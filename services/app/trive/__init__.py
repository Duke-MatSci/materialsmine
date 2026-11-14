"""
Tri-VE: viscoelastic Prony-series fitting and time-temperature superposition.

The Flask blueprint in `routes` is mounted at /tri-ve; everything it calls
lives here, split by what each piece is responsible for. Reading order runs
bottom-up:

    prony        the Prony series itself — basis matrix, tau grid, the sizing
                 rule for an auto-chosen series, forward evaluation of the
                 complex and relaxation moduli
    objective    the penalized loss the fit minimizes, the log-spectrum
                 curvature its smoothness penalty is built from, and the
                 scaling that makes `smoothness` mesh-independent
    reduction    the chunked QR that compresses the weighted least-squares
                 problem to O(N) rows, and its content-addressed LRU cache
    quality      scoring a converged fit: reduced chi-squared, the Laplace
                 posterior of the smoothing weight, the spectrum's roughness
    fit          smooth_prony_fit — composes the four above into the single
                 call that turns data into (tau_i, E_i)

    shift        WLF / Arrhenius / hybrid shift factors and their inverses
    calibration  the reverse direction — fitting C1/C2/Ea to measured shift
                 data, and the peak finder that estimates Tg and TC
    tts          applying a shift model to a data frame, both directions

    figures      plotly figures, their captions, plot-trace thinning, the
                 shift-factor figure, and the coefficient table
    chart        update_line_chart — the whole pipeline, called by the route

Public names are re-exported below. Private helpers (anything underscored) stay
in their own modules: import them from there, and note that monkeypatching one
in a test must target the defining module, not this package.
"""
import os
# OpenBLAS reads this when numpy first loads it, so it has to be set before any
# import of numpy. Importing ANY submodule of this package runs this file first,
# which makes it the one placement that covers every entry point into the fit.
# (app.config and the test modules set it too, for the same reason.)
os.environ['OPENBLAS_NUM_THREADS'] = '1'

from .calibration import (  # noqa: E402
    argmax_peak,
    fit_hybrid_coefficients,
    fit_wlf_coefficients,
    peak_edge_warning,
)
from .chart import EXPECTED_DOMAIN_COLUMNS, update_line_chart  # noqa: E402
from .fit import smooth_prony_fit  # noqa: E402
from .prony import (  # noqa: E402
    PRONY_TERMS_MAX,
    PRONY_TERMS_MIN,
    PRONY_TERMS_PER_DECADE,
    compute_complex,
    compute_relaxation_modulus,
    prony_basis,
    prony_relaxation_space,
    prony_terms_for_span,
)
from .shift import (  # noqa: E402
    UNIVERSAL_WLF_C1,
    UNIVERSAL_WLF_C2,
    hybrid_shift,
    inverse_hybrid_shift,
    inverse_wlf_shift,
    wlf_log10_shift,
    wlf_shift,
)
from .tts import (  # noqa: E402
    MAX_ABS_LOG10_SHIFT,
    VIS_REF_FREQUENCY_HZ,
    tts_frequency_to_temperature,
    tts_frequency_to_temperature_V2,
    tts_frequency_to_temperature_hybrid,
    tts_temperature_to_frequency_V2,
)

__all__ = [
    'EXPECTED_DOMAIN_COLUMNS',
    'MAX_ABS_LOG10_SHIFT',
    'PRONY_TERMS_MAX',
    'PRONY_TERMS_MIN',
    'PRONY_TERMS_PER_DECADE',
    'UNIVERSAL_WLF_C1',
    'UNIVERSAL_WLF_C2',
    'VIS_REF_FREQUENCY_HZ',
    'argmax_peak',
    'compute_complex',
    'compute_relaxation_modulus',
    'fit_hybrid_coefficients',
    'fit_wlf_coefficients',
    'hybrid_shift',
    'inverse_hybrid_shift',
    'inverse_wlf_shift',
    'peak_edge_warning',
    'prony_basis',
    'prony_relaxation_space',
    'prony_terms_for_span',
    'smooth_prony_fit',
    'tts_frequency_to_temperature',
    'tts_frequency_to_temperature_V2',
    'tts_frequency_to_temperature_hybrid',
    'tts_temperature_to_frequency_V2',
    'update_line_chart',
    'wlf_log10_shift',
    'wlf_shift',
]
