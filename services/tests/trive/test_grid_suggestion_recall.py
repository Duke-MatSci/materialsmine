"""
Slow tier: the Tri-VE grid suggestion scored against the exact 108-term
effective count on every bundled dataset. About 3 minutes, so it is skipped
unless TRIVE_SLOW=1.

    TRIVE_SLOW=1 python -m unittest tests.trive.test_grid_suggestion_recall
"""
import unittest
import os
os.environ['OPENBLAS_NUM_THREADS'] = '1'
import sys

import numpy as np

# Append the directory above 'tests' to sys.path to find the 'app' module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.config import Config
from app.trive.fit import SmoothPronyFitDiverged, SmoothPronyFitTimeout
from app.utils.util import upload_init

from ._resolution_oracle import exact_probe_terms, fires, run_chart


DATA_DIR = os.path.abspath(os.path.join(
    os.path.dirname(__file__), '..', '..', 'app', 'trive', 'files',
))

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
RELATIVE_ERRORS = (0.2, 0.05, 0.01)
SMOOTHNESS = np.geomspace(1e-4, 10, 16)
LOW_SMOOTHNESS = set(map(float, SMOOTHNESS[:4]))  # 1e-4 .. 1e-3
REQUESTS = (20, 40, 60, 80)
MIN_RECALL = 0.90
MAX_FALSE_FIRE_RATE = 0.01


def _sweep():
    """
    Scored rows (name, rel, s, n_fit, exact, fired), one per distinct fit,
    plus the cells dropped because the app or the oracle gave no answer.
    """
    rows, dropped, seen, oracle = [], [], set(), {}
    for name, (upload_file, domain, shift_file) in DATASETS.items():
        upload = upload_init(upload_file, domain)
        kwargs = {}
        if shift_file:
            kwargs = dict(shift_model='manual',
                          shiftData=upload_init(shift_file, 'shift'))
        # N outermost keeps the fit and probe reductions warm in the cache.
        for N in REQUESTS:
            for rel in RELATIVE_ERRORS:
                for s in map(float, SMOOTHNESS):
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


@unittest.skipUnless(os.environ.get('TRIVE_SLOW') == '1',
                     'slow tier; set TRIVE_SLOW=1 to run')
class TestGridSuggestionAgainstExactProbeCount(unittest.TestCase):
    """Pooled over the bundled sets: the suggestion fires on at least 90%
    of fits the exact 108-term count supports (exact_108 > N + 1) at
    s <= 1e-3, and on at most 1% of unsupported fits (exact_108 < N - 1)."""

    def test_low_smoothness_recall_and_false_fires(self):
        Config.FILES_DIRECTORY = DATA_DIR
        rows, dropped = _sweep()
        supported = [r for r in rows
                     if r[2] in LOW_SMOOTHNESS and r[4] > r[3] + 1]
        unsupported = [r for r in rows if r[4] < r[3] - 1]
        missed = [r for r in supported if not r[5]]
        false_fires = [r for r in unsupported if r[5]]
        recall = 1 - len(missed) / len(supported)
        false_rate = len(false_fires) / len(unsupported)
        message = (
            f'recall {recall:.1%} over {len(supported)} supported low-s '
            f'fits (need >= {MIN_RECALL:.0%}); false fires {false_rate:.2%} '
            f'over {len(unsupported)} unsupported fits (need <= '
            f'{MAX_FALSE_FIRE_RATE:.0%}); {len(dropped)} cells dropped\n'
            f'missed:\n{_describe(missed)}\n'
            f'falsely fired:\n{_describe(false_fires)}')
        self.assertTrue(recall >= MIN_RECALL
                        and false_rate <= MAX_FALSE_FIRE_RATE, message)


if __name__ == '__main__':
    unittest.main()
