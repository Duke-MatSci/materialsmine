"""
Slow tier: the Tri-VE grid suggestion scored against the exact 108-term
effective count on every bundled dataset, and at low smoothness on four more
master curves from app/public/docs/dynamfit. About 11 minutes, so it is
skipped unless TRIVE_SLOW=1. These sweeps also chose
chart._MAX_GAUSS_NEWTON_CORRECTION; the grid-suggestion comment in
app.trive.chart.update_line_chart sets out the rule they score.

    TRIVE_SLOW=1 python -m unittest tests.trive.test_grid_suggestion_recall
"""
import unittest
import os
os.environ['OPENBLAS_NUM_THREADS'] = '1'
import sys
from unittest import mock

import numpy as np

# Append the directory above 'tests' to sys.path to find the 'app' module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.config import Config
from app.trive.fit import SmoothPronyFitDiverged, SmoothPronyFitTimeout
from app.utils.util import upload_init

from ._paths import DYNAMFIT_DIR, TRIVE_FILES_DIR
from ._resolution_oracle import exact_probe_terms, fires, run_chart


# name -> (upload file, domain, shift file or None)
DATASETS = {
    'PETMP-TATATO': ('PETMP-TATATO master curve 55C clean.txt',
                     'frequency', None),
    'PMMA R10': ('PMMA_shifted_R10_data.txt', 'frequency', None),
    'VeroCyan MC': ('VeroCyan (5) master curve 80C.txt', 'frequency', None),
    'agilus30 MC': ('agilus30 (8) master curve 20C.txt', 'frequency', None),
    'VeroCyan ramp': ('VeroCyan (5) Temperature Ramp clean.txt',
                      'temperature',
                      'VeroCyan (5) shift factors 80C clean.txt'),
    'agilus30 ramp': ('agilus30 (8) Temperature Ramp clean.txt',
                      'temperature',
                      'agilus30 (8) shift factors 20C clean.txt'),
}
# The frontend's example master curves (in DYNAMFIT_DIR) that are not copies
# or re-shifts of the bundled sets above.
DYNAMFIT_DATASETS = {
    'Cavaille PS (dynamfit)': ('Cavaille-PS-98k-master-93C.csv',
                               'frequency', None),
    'PMMA R09 (dynamfit)': ('PMMA-R09-master-clean-148C.csv',
                            'frequency', None),
    'dgeba-ipd (dynamfit)': ('dgeba-ipd-wide-bar-170C_mastercurve.tsv',
                             'frequency', None),
    'fisher PC (dynamfit)': ('fisher-polycarbonate-150C_mastercurve.csv',
                             'frequency', None),
}
RELATIVE_ERRORS = (0.2, 0.05, 0.01)
SMOOTHNESS = np.geomspace(1e-4, 10, 16)
LOW_SMOOTHNESS = set(map(float, SMOOTHNESS[:4]))  # 1e-4 .. 1e-3
REQUESTS = (20, 40, 60, 80)
FINE_REQUESTS = tuple(range(20, 101, 4))
MIN_RECALL = 0.90
MAX_FALSE_FIRE_RATE = 0.01


def _sweep(directory, datasets, requests, smoothness):
    """
    Scored rows (name, rel, s, n_fit, exact, fired), one per distinct fit,
    plus the cells dropped because the app or the oracle gave no answer.
    """
    rows, dropped, seen, oracle = [], [], set(), {}
    for name, (upload_file, domain, shift_file) in datasets.items():
        with mock.patch.object(Config, 'FILES_DIRECTORY', directory):
            upload = upload_init(upload_file, domain)
            kwargs = {}
            if shift_file:
                kwargs = dict(shift_model='manual',
                              shiftData=upload_init(shift_file, 'shift'))
        # N outermost keeps the fit and probe reductions warm in the cache.
        for N in requests:
            for rel in RELATIVE_ERRORS:
                for s in map(float, smoothness):
                    try:
                        result, fit, n_fit = run_chart(
                            upload, N, s, rel, domain=domain, **kwargs)
                    except (SmoothPronyFitTimeout, SmoothPronyFitDiverged):
                        dropped.append((name, rel, s, N, 'app rejected'))
                        continue
                    if (name, rel, s, n_fit) in seen:
                        continue
                    seen.add((name, rel, s, n_fit))
                    if (name, rel, s) not in oracle:
                        oracle[name, rel, s] = exact_probe_terms(fit, s)
                    exact = oracle[name, rel, s]
                    if exact is None:
                        dropped.append((name, rel, s, n_fit, 'no oracle'))
                        continue
                    rows.append((name, rel, s, n_fit, exact, fires(result)))
    return rows, dropped


def _describe(rows):
    return '\n'.join(
        f'  {name}, rel {rel:g}, s {s:.3g}, N {n_fit}: exact_108 {exact:.2f}'
        for name, rel, s, n_fit, exact, _ in rows)


def _describe_dropped(dropped):
    return '\n'.join(
        f'  {name}, rel {rel:g}, s {s:.3g}, N {N}: {why}'
        for name, rel, s, N, why in dropped)


def _score(rows, dropped):
    """
    The class's two bars on scored rows: recall over the supported fits
    (exact_108 > N + 1) at s in LOW_SMOOTHNESS, and the false-fire rate over
    the unsupported fits (exact_108 < N - 1) at every s in rows.

    Returns:
        tuple: (recall, false-fire rate, failure message listing the counts,
        the missed fits, the false fires and the dropped cells).
    """
    supported = [r for r in rows
                 if r[2] in LOW_SMOOTHNESS and r[4] > r[3] + 1]
    unsupported = [r for r in rows if r[4] < r[3] - 1]
    missed = [r for r in supported if not r[5]]
    false_fires = [r for r in unsupported if r[5]]
    recall = 1 - len(missed) / len(supported)
    false_rate = len(false_fires) / len(unsupported)
    message = (
        f'recall {recall:.1%} ({len(supported) - len(missed)} of '
        f'{len(supported)} supported low-s fits; need >= '
        f'{MIN_RECALL:.0%}); false fires {false_rate:.2%} '
        f'({len(false_fires)} of {len(unsupported)} unsupported fits; '
        f'need <= {MAX_FALSE_FIRE_RATE:.0%}); {len(dropped)} cells dropped\n'
        f'missed:\n{_describe(missed)}\n'
        f'falsely fired:\n{_describe(false_fires)}\n'
        f'dropped:\n{_describe_dropped(dropped)}')
    return recall, false_rate, message


@unittest.skipUnless(os.environ.get('TRIVE_SLOW') == '1',
                     'slow tier; set TRIVE_SLOW=1 to run')
class TestGridSuggestionAgainstExactProbeCount(unittest.TestCase):
    """Pooled over the bundled sets: the suggestion fires on at least 90%
    of fits the exact 108-term count supports (exact_108 > N + 1) at
    s <= 1e-3, and on at most 1% of unsupported fits (exact_108 < N - 1)."""

    def test_low_smoothness_recall_and_false_fires(self):
        rows, dropped = _sweep(
            TRIVE_FILES_DIR, DATASETS, REQUESTS, SMOOTHNESS)
        recall, false_rate, message = _score(rows, dropped)
        self.assertTrue(recall >= MIN_RECALL
                        and false_rate <= MAX_FALSE_FIRE_RATE, message)

    def test_low_smoothness_fine_grids_on_more_master_curves(self):
        """At s <= 1e-3, over the bundled sets plus four dynamfit master
        curves and N = 20, 24, ..., 100, pooled: recall >= 90% on
        supported fits and false fires <= 1% on unsupported fits."""
        low = SMOOTHNESS[:4]
        rows, dropped = _sweep(TRIVE_FILES_DIR, DATASETS, FINE_REQUESTS, low)
        more_rows, more_dropped = _sweep(
            DYNAMFIT_DIR, DYNAMFIT_DATASETS, FINE_REQUESTS, low)
        # Every swept s is in LOW_SMOOTHNESS, so _score's recall bar covers
        # all the supported fits here.
        recall, false_rate, message = _score(
            rows + more_rows, dropped + more_dropped)
        self.assertGreaterEqual(recall, MIN_RECALL, message)
        self.assertLessEqual(false_rate, MAX_FALSE_FIRE_RATE, message)


if __name__ == '__main__':
    unittest.main()
