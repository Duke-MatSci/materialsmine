"""
Unit tests for the public Tg and Tc estimates from a temperature sweep:
estimate_tg reads the tan-delta peak, estimate_tc the E-loss peak, and each
returns the peak temperature with the edge warning for it (or None).

    python -m unittest tests.trive.test_peak_estimates
"""
import unittest
import os
os.environ['OPENBLAS_NUM_THREADS'] = '1'
import sys

import numpy as np

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.trive import estimate_tc, estimate_tg, peak_edge_warning

T = np.arange(0.0, 81.0, 2.0)  # 0..80 C in 2 C steps
STOR = 1.0e9 - T * 1.0e6


def _loss_bump(bump_T, height=1.0e8, base=1.0e7):
    """E-loss flat at base with a single point of height at bump_T."""
    return np.where(T == bump_T, height, base)


def _split_peaks():
    """
    A sweep whose tan-delta peak (50 C, where storage dips) and E-loss peak
    (30 C) sit at different temperatures.
    """
    stor = np.where(T == 50.0, 1.0e8, 1.0e9)
    loss = np.where(T == 30.0, 5.0e7, 1.0e7)
    return stor, loss


def _hot_edge_rise(curve_at_bump, bump_T, rise_top):
    """
    Interior bump at bump_T plus a ramp up to rise_top at the hot end, so
    the series' global maximum is the last point, not the interior peak.
    """
    rise = np.where(T >= 70.0, rise_top * (T - 68.0) / 12.0, 0.0)
    return np.where(T == bump_T, curve_at_bump, 0.0) + rise


class TestEstimateTg(unittest.TestCase):
    def test_interior_tan_delta_peak_returns_its_temperature_and_no_warning(self):
        """An interior tan-delta peak gives its temperature, as a float,
        and no warning."""
        Tg, warning = estimate_tg(T, STOR, _loss_bump(40.0))
        self.assertEqual(Tg, 40.0)
        self.assertIsInstance(Tg, float)
        self.assertIsNone(warning)

    def test_reads_the_tan_delta_peak_not_the_loss_peak(self):
        """Tg is the tan-delta (E_loss / E_stor) peak, not the E-loss peak."""
        stor, loss = _split_peaks()
        Tg, warning = estimate_tg(T, stor, loss)
        self.assertEqual(Tg, 50.0)
        self.assertIsNone(warning)

    def test_prefers_an_interior_peak_over_a_higher_hot_edge_rise(self):
        """A tan-delta rise to the hot edge that tops the interior peak is
        not a peak; the interior peak is returned."""
        tan_delta = 0.01 + _hot_edge_rise(0.05, 30.0, 0.2)
        stor = np.full_like(T, 1.0e9)
        Tg, _ = estimate_tg(T, stor, tan_delta * stor)
        self.assertEqual(Tg, 30.0)

    def test_peak_near_an_edge_returns_the_edge_warning(self):
        """A peak within 5 C of either edge carries peak_edge_warning's
        message for label 'Tg'."""
        for bump_T in (2.0, 78.0):
            with self.subTest(bump_T=bump_T):
                Tg, warning = estimate_tg(T, STOR, _loss_bump(bump_T))
                self.assertEqual(Tg, bump_T)
                self.assertIsNotNone(warning)
                self.assertEqual(warning, peak_edge_warning(bump_T, T, 'Tg'))

    def test_no_peak_raises_value_error(self):
        """A monotonic tan delta has no peak to estimate from."""
        stor = np.full_like(T, 1.0e9)
        with self.assertRaises(ValueError):
            estimate_tg(T, stor, 1.0e7 + T * 1.0e5)

    def test_accepts_plain_lists(self):
        """Lists work as well as arrays."""
        Tg, warning = estimate_tg(
            T.tolist(), STOR.tolist(), _loss_bump(40.0).tolist())
        self.assertEqual(Tg, 40.0)
        self.assertIsInstance(Tg, float)
        self.assertIsNone(warning)


class TestEstimateTc(unittest.TestCase):
    def test_interior_loss_peak_returns_its_temperature_and_no_warning(self):
        """An interior E-loss peak gives its temperature, as a float, and
        no warning."""
        TC, warning = estimate_tc(T, _loss_bump(40.0))
        self.assertEqual(TC, 40.0)
        self.assertIsInstance(TC, float)
        self.assertIsNone(warning)

    def test_reads_the_loss_peak_not_the_tan_delta_peak(self):
        """Tc is the E-loss peak, even where tan delta peaks elsewhere."""
        _, loss = _split_peaks()
        TC, warning = estimate_tc(T, loss)
        self.assertEqual(TC, 30.0)
        self.assertIsNone(warning)

    def test_prefers_an_interior_peak_over_a_higher_hot_edge_rise(self):
        """An E-loss rise to the hot edge that tops the interior peak is not
        a peak; the interior peak is returned."""
        loss = 1.0e7 + _hot_edge_rise(4.0e7, 30.0, 2.0e8)
        TC, _ = estimate_tc(T, loss)
        self.assertEqual(TC, 30.0)

    def test_peak_near_an_edge_returns_the_edge_warning(self):
        """A peak within 5 C of either edge carries peak_edge_warning's
        message for label 'Tc'."""
        for bump_T in (2.0, 78.0):
            with self.subTest(bump_T=bump_T):
                TC, warning = estimate_tc(T, _loss_bump(bump_T))
                self.assertEqual(TC, bump_T)
                self.assertIsNotNone(warning)
                self.assertEqual(warning, peak_edge_warning(bump_T, T, 'Tc'))

    def test_no_peak_raises_value_error(self):
        """A monotonic E-loss has no peak to estimate from."""
        with self.assertRaises(ValueError):
            estimate_tc(T, 1.0e7 + T * 1.0e5)

    def test_accepts_plain_lists(self):
        """Lists work as well as arrays."""
        TC, warning = estimate_tc(T.tolist(), _loss_bump(40.0).tolist())
        self.assertEqual(TC, 40.0)
        self.assertIsInstance(TC, float)
        self.assertIsNone(warning)


if __name__ == '__main__':
    unittest.main()
