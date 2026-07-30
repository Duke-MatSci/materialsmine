import os
os.environ['OPENBLAS_NUM_THREADS'] = '1'
import hashlib
import numpy as np
import pandas as pd

from collections import OrderedDict, namedtuple
from contextlib import contextmanager
from scipy.optimize import curve_fit, minimize, nnls
from scipy.signal import find_peaks
from scipy.interpolate import interp1d
import plotly.express as px
import plotly.graph_objects as go

from app.utils.util import log_errors

float_correction = 1e-7
R = 8.31446261815324  # J/(mol*K)

# Williams-Landel-Ferry's "universal" empirical constants — reasonable defaults
# across many polymers when the user hasn't supplied material-specific values.
# Used (a) by the frequency-domain visualization to scatter the master curve
# across a temperature axis, and (b) by the route as the fallback when the
# C1/C2 "estimate" toggles are on.
UNIVERSAL_WLF_C1 = 17.44
UNIVERSAL_WLF_C2 = 51.6

# Drop master-curve rows whose |log10(a_T)| exceeds this; near the WLF
# singularity (T → T_ref − C2) shift factors blow up and overflow the Prony fit.
MAX_ABS_LOG10_SHIFT = 15.0

# Reference frequency / temperature for the frequency-domain visualization's
# inverse-WLF scatter; arbitrary but stable so the temperature axis stays
# comparable across uploads.
VIS_REF_FREQUENCY_HZ = 1.0
VIS_REF_TEMPERATURE_C = 30.0

# Frequency points per block in smooth_prony_fit's chunked QR reduction. Each
# block materializes a (2 * chunk, N + 2) basis slab (plus prony_basis's
# np.where temporaries), so peak memory is O(chunk * N) no matter how many
# rows the upload has.
_QR_CHUNK_ROWS = 8192

# Experiment traces with more rows than this are thinned before plotting —
# broadband uploads (e.g. 41k-row chirp master curves) otherwise bloat the
# response JSON and bog down browser-side plotly rendering. This affects the
# FIGURES ONLY: the Prony fit and the coefficient table always use every row.
# ~2000 points per trace is far denser than any screen resolves.
_PLOT_MAX_POINTS = 2000

# Reference residual count for smoothness normalization in smooth_prony_fit:
# a nominal 400-row upload contributes 800 residuals (storage + loss), the
# scale on which the smoothness knob was historically calibrated. The penalty
# weight is normalized to this so a given smoothness value produces comparable
# smoothing regardless of upload size (see smooth_prony_fit).
_SMOOTHNESS_REF_RESIDUALS = 800

# Second-difference stencil behind the smoothness penalty: the np.diff(..., n=2)
# weights in _prony_objective, and the outer product that builds lam * L.T @ L
# in _prony_fit_quality.
_D2_STENCIL = (1.0, -2.0, 1.0)

# Reduced systems retained by _prony_reduce's LRU cache. Each entry holds only
# the (m + 1) x (m + 1) triangle — at most ~102 x 102, since the route caps N at
# 100 — so the cache stays tiny no matter how large the uploads that produced it.
# Sized for a smoothness sweep, which varies only `smoothness` and can reuse one
# reduction throughout.
_REDUCE_CACHE_SIZE = 4


@contextmanager
def _fp_safe(user_message: str):
    """Convert numpy FP overflow/divide/invalid into a user-facing ValueError.

    The shift-factor functions all need the same protective shell around their
    arithmetic: switch numpy to raise on overflow/divide/invalid, catch those
    (and any FloatingPointError the body raises explicitly for a non-finite
    result), and re-raise as ValueError(user_message) so the route can convert
    it to HTTP 400 with text the end user can act on.
    """
    with np.errstate(divide='raise', invalid='raise', over='raise'):
        try:
            yield
        except (FloatingPointError, ZeroDivisionError):
            raise ValueError(user_message)


def prony_basis(freq: np.ndarray, relaxations: np.ndarray, solid: bool) -> np.ndarray:
    """
    Construct the Prony-series basis matrix for storage and loss moduli.

    For each (ω, τ) pair the storage-modulus contribution is ω²τ² / (1 + ω²τ²)
    and the loss-modulus contribution is ωτ / (1 + ω²τ²). The two blocks are
    stacked vertically so that prony_basis(...) @ E_i yields a flat
    [E_storage; E_loss] vector. When solid is True, a leading column is
    prepended to represent an equilibrium modulus: ones on the storage block,
    zeros on the loss block.

    Parameters:
        freq (numpy.ndarray): 1-D array of angular frequencies ω.
        relaxations (numpy.ndarray): 1-D array of relaxation times τ.
        solid (bool): Whether to prepend an equilibrium-modulus column.

    Returns:
        numpy.ndarray: Basis matrix of shape (2 * len(freq), len(relaxations) + bool(solid)).
    """
    assert isinstance(freq, np.ndarray) and freq.ndim == 1, \
        "freq must be a 1-D numpy.ndarray"
    assert isinstance(relaxations, np.ndarray) and relaxations.ndim == 1, \
        "relaxations must be a 1-D numpy.ndarray"

    # dimensionless time ωτ
    dt = np.outer(freq, relaxations)

    # Bases are dt²/(1+dt²) and dt/(1+dt²). Forming dt² directly overflows to
    # inf → NaN for large ωτ, so for |ωτ|≥1 use inv=1/(ωτ) (1/(1+inv²),
    # inv/(1+inv²)); for |ωτ|<1 the direct dt² form is safe. errstate discards
    # the inf/NaN from the unused np.where branch.
    # TODO: profile — np.where evaluates both branches over the full grid; use
    # masked/in-place computation if this dominates the hot fitting path.
    with np.errstate(over='ignore', invalid='ignore', divide='ignore'):
        inv = np.where(dt != 0, 1.0 / dt, np.inf)
        big = np.abs(dt) >= 1.0
        dt2 = dt * dt
        ep_basis = np.where(big, 1.0 / (1.0 + inv * inv), dt2 / (1.0 + dt2))
        epp_basis = np.where(big, inv / (1.0 + inv * inv), dt / (1.0 + dt2))

    if solid:
        ep_basis = np.concatenate(
            (np.ones_like(ep_basis, shape=(len(ep_basis), 1)), ep_basis), axis=1
        )
        epp_basis = np.concatenate(
            (np.zeros_like(epp_basis, shape=(len(epp_basis), 1)), epp_basis), axis=1
        )

    return np.concatenate((ep_basis, epp_basis), axis=0)


def prony_relaxation_space(tau_min: float, tau_max: float, N: int) -> np.ndarray:
    """
    Build a log-spaced grid of relaxation times.

    Parameters:
        tau_min (float): Lower bound of the relaxation-time range.
        tau_max (float): Upper bound of the relaxation-time range.
        N (int): Number of grid points.

    Returns:
        numpy.ndarray: 1-D array of N log-spaced values from tau_min to tau_max (inclusive).
    """
    return np.logspace(np.log10(tau_min), np.log10(tau_max), N, endpoint=True)


def compute_complex(tau_i: np.ndarray, E_i: np.ndarray,
                    num_pts: int = 1000) -> pd.DataFrame:
    """
    Compute the complex modulus on a log-spaced frequency grid.

    Builds an angular-frequency grid spanning 1/max(tau_i) to 1/min(tau_i) and
    evaluates the storage and loss moduli from the Prony coefficients in E_i.
    When E_i has one more element than tau_i, the leading coefficient is
    treated as an equilibrium-modulus term.

    Parameters:
        tau_i (numpy.ndarray): 1-D array of relaxation times.
        E_i (numpy.ndarray): 1-D array of Prony coefficients (same length as
            tau_i, or one longer to include an equilibrium-modulus term).
        num_pts (int): Number of points in the output frequency grid.

    Returns:
        pandas.DataFrame: Frame with num_pts rows and columns
        "Frequency", "E Storage", "E Loss".
    """
    assert isinstance(tau_i, np.ndarray) and tau_i.ndim == 1, \
        "tau_i must be a 1-D numpy.ndarray"
    assert isinstance(E_i, np.ndarray) and E_i.ndim == 1, \
        "E_i must be a 1-D numpy.ndarray"
    omega = np.logspace(-np.log10(np.max(tau_i)), -np.log10(np.min(tau_i)), num_pts)
    basis = prony_basis(omega, tau_i, solid=not (len(E_i) == len(tau_i)))
    complex = basis @ E_i
    real, imag = complex.reshape(2, num_pts)

    return pd.DataFrame(data={"Frequency": omega, "E Storage": real, "E Loss": imag})


def compute_relaxation_modulus(tau_i: np.ndarray, E_i: np.ndarray,
                               num_pts: int = 1000) -> pd.DataFrame:
    """
    Compute the time-domain relaxation modulus on a log-spaced time grid.

    Builds a time grid spanning min(tau_i) to max(tau_i) and evaluates the
    decaying part of the Prony relaxation modulus from the coefficients in
    E_i. When E_i has one more element than tau_i, the leading
    equilibrium-modulus coefficient is excluded from the output.

    Parameters:
        tau_i (numpy.ndarray): 1-D array of relaxation times.
        E_i (numpy.ndarray): 1-D array of Prony coefficients (same length as
            tau_i, or one longer to include an equilibrium-modulus term).
        num_pts (int): Number of points in the output time grid.

    Returns:
        pandas.DataFrame: Frame with num_pts rows and columns "Time", "E".
    """
    assert isinstance(tau_i, np.ndarray) and tau_i.ndim == 1, \
        "tau_i must be a 1-D numpy.ndarray"
    assert isinstance(E_i, np.ndarray) and E_i.ndim == 1, \
        "E_i must be a 1-D numpy.ndarray"
    t = np.logspace(np.log10(np.min(tau_i)), np.log10(np.max(tau_i)), num_pts)
    # dimensionless time t/τ
    dt = np.outer(t, 1 / tau_i)
    solid = not (len(E_i) == len(tau_i))
    E = np.exp(-dt) @ E_i[solid:]
    return pd.DataFrame(data={"Time": t, "E": E})


def _prony_objective(
        logcoefs: np.ndarray,
        data: np.ndarray,
        basis: np.ndarray,
        smoothness: float,
        solid: bool,
) -> tuple:
    """
    Compute the loss and gradient for the smoothed Prony fit.

    Designed to be passed to scipy.optimize.minimize with jac=True. Coefficients
    are parameterized in log-space (E_i = exp(logcoefs)) so that the optimizer
    sees an unconstrained problem while the physical coefficients remain
    positive. The loss is the sum of squared residuals between
    basis @ exp(logcoefs) and data, plus an optional second-difference penalty
    on logcoefs[solid:] scaled by smoothness.

    Residuals are UNWEIGHTED here: the caller passes an already-weighted system.
    smooth_prony_fit's _prony_reduce folds 1/std into R and z before this is
    ever called, so carrying a std array through would only buy a per-iteration
    division by ones on the optimizer's hot path.

    Parameters:
        logcoefs (numpy.ndarray): 1-D array of log-coefficients to fit.
        data (numpy.ndarray): 1-D array of target values, pre-weighted.
        basis (numpy.ndarray): 2-D basis matrix, pre-weighted to match data;
            basis @ exp(logcoefs) is the model.
        smoothness (float): Strength of the second-difference penalty on
            logcoefs[solid:]. Pass 0 to disable.
        solid (bool): Whether the leading coefficient is an equilibrium term to
            exclude from the smoothness penalty.

    Returns:
        tuple: (loss, gradient) where loss is a float and gradient is a 1-D
        ndarray with the same shape as logcoefs.
    """
    coefs = np.exp(logcoefs)
    estimate = basis @ coefs
    resid = data - estimate
    loss = resid @ resid
    if smoothness:
        curve = smoothness * np.diff(logcoefs[solid:], n=2)
        loss += curve @ curve

    grad = -(basis.T @ resid)

    # apply chain rule because these are functions of
    # coefs rather than logcoefs
    grad *= coefs

    if smoothness:
        diffs = smoothness * curve  # smoothness*np.diff(logcoefs[solid:], n=2)
        grad_slice = grad[solid:]
        grad_slice[:-2] += diffs
        grad_slice[1:-1] -= 2 * diffs
        grad_slice[2:] += diffs

    return loss, 2 * grad  # more chain rule (squared errors)


# Fit-quality readout for a converged smooth_prony_fit. chi2_reduced is the
# data misfit alone; neg_log_posterior is the Laplace-approximated negative log
# posterior of lam = smoothness**2. Both are "positive, lower is better". Either
# may be None — see _prony_fit_quality for the conditions.
_FitQuality = namedtuple('_FitQuality', 'chi2_reduced neg_log_posterior')


def _prony_fit_quality(
        logcoefs: np.ndarray,
        data: np.ndarray,
        basis: np.ndarray,
        smoothness: float,
        solid: bool,
        n_resid: int,
        prior_lam: float = None,
) -> _FitQuality:
    """
    Score a converged Prony fit: reduced chi-squared and the log posterior of lam.

    The second number is a Laplace (saddle-point) approximation of

        log pi_lam = -V(H) + 0.5 * (log|A| + n_tau * log(lam) - log|C|) - lam

    with H = logcoefs, lam = smoothness**2, V = rho^2 + lam * eta^2 (the
    _prony_objective loss), A = L.T @ L for the second-difference operator L
    behind the penalty, and C = lam * A + J.T @ J + diag(r.T @ J) — which is
    exactly 0.5 * Hess(V), the second-derivative term being diagonal because
    the coefficients are parameterized as exp(logcoefs). The trailing -lam is a
    unit-rate exponential prior on lam.

    Two details that are easy to get wrong:

    * A is singular. L is the (npen - 2) x m second-difference stencil, so A has
      a null space of dimension 2 + solid (a constant, a linear ramp, and the
      unpenalized equilibrium term). The determinant the formula needs is the
      PSEUDO-determinant, and the exponent of lam is rank(A) = npen - 2, not
      n_tau. Inflating that exponent to the full dimension adds a spurious
      0.5 * (m - rank) * log(lam) drift that biases the result toward
      oversmoothing. Conveniently pdet(L.T @ L) == det(L @ L.T) ==
      npen**2 * (npen**2 - 1) / 12 exactly, so no decomposition of A is needed.
    * The null directions carry a flat prior whose normalizer, together with the
      Laplace prefactor, contributes a constant 0.5 * (2 + solid) * log(pi).
      It is included, so the result is comparable across smoothness, N, row
      count, AND solid.

    This is an approximation, not an identity — expect ~0.1 nat of Laplace error
    — and it assumes logcoefs is a CONVERGED, INTERIOR minimum of V. At a
    non-stationary point the expansion has an unaccounted linear term.

    Expects the QR-REDUCED system from smooth_prony_fit (basis=R, data=z), which
    the route's N <= 100 cap bounds at ~102 rows; peak allocation is then two
    m x m arrays. That system is already weighted by 1/std, so residuals here are
    unweighted — see _prony_objective — and it carries the orthogonal residual
    the fit cannot reach as its own row, so both numbers come out on the
    full-problem scale and stay comparable across N with nothing to add back.

    Parameters:
        logcoefs (numpy.ndarray): 1-D array of log-coefficients at the optimum.
        data (numpy.ndarray): 1-D array of target values, pre-weighted.
        basis (numpy.ndarray): 2-D basis matrix, pre-weighted to match data;
            basis @ exp(logcoefs) is the model.
        smoothness (float): Penalty strength actually used in the fit, i.e. the
            row-count-scaled value, since lam * A must match the fitted V.
        solid (bool): Whether the leading coefficient is an equilibrium term
            excluded from the smoothness penalty.
        n_resid (int): Residual count of the FULL problem (2 * len(omega)), used
            for the chi-squared degrees of freedom. It cannot be read off `data`,
            whose length is the reduced m + 1 for any upload size.
        prior_lam (float): lam to charge the exponential prior for. Defaults to
            smoothness**2; pass the UNSCALED smoothness**2 so the prior tracks
            the user-facing knob rather than the row-count-scaled one.

    Returns:
        _FitQuality: (chi2_reduced, neg_log_posterior), both floats and both
        "lower is better". chi2_reduced is None when the fit has no degrees of
        freedom left; neg_log_posterior is None when the posterior is undefined
        (no penalty, or fewer than 3 penalized terms) or when the Laplace
        expansion does not apply (C not positive definite, or non-finite).
    """
    m = len(logcoefs)
    npen = m - solid

    coefs = np.exp(logcoefs)
    resid = data - basis @ coefs
    # Data misfit only — the smoothness penalty is not part of chi-squared.
    # Regularization means the effective parameter count is below m, so this
    # dof understates nu and chi2_reduced reads as an upper bound.
    dof = n_resid - m
    chi2 = (resid @ resid) / dof if dof > 0 else None

    # No penalty (lam = 0 -> log(lam) = -inf) or too few penalized terms for a
    # second difference to exist means there is no prior on lam to be posterior
    # about. npen < 3 would also reach log(npen - 1) = log(0) below.
    if npen < 3 or not smoothness:
        return _FitQuality(chi2, None)

    lam = smoothness * smoothness
    # Take V from the objective itself so the two cannot drift apart on the
    # penalty convention. Note V is NOT a marginal likelihood: it is the
    # unnormalized negative log JOINT density at the mode (misfit + penalty).
    V, _ = _prony_objective(logcoefs, data, basis, smoothness, solid)

    # r.T @ J, the exact second-derivative term. Same expression as the
    # objective's gradient before the chain rule is doubled and before the
    # penalty is folded in.
    rj = -(basis.T @ resid) * coefs

    # C = lam * A + J.T @ J + diag(r.T @ J), assembled in ONE m x m array:
    # neither J (n x m) nor L nor A is ever materialized. The matmul allocates,
    # so the in-place scalings below cannot touch the read-only cached R.
    C = basis.T @ basis
    C *= coefs           # -> J.T @ J; J = -basis @ diag(coefs), so its two
    C *= coefs[:, None]  # sign flips cancel in the Gram.
    # np.einsum('ii->i', C) is a writable stride view even when C is not
    # contiguous; C.ravel()[::m + 1] would silently write to a copy instead.
    np.einsum('ii->i', C)[...] += rj
    # lam * L.T @ L is pentadiagonal; accumulate the nine stencil outer-product
    # terms straight onto its bands. Index pairs are strictly increasing within
    # each (t, u) pass, so there is no fancy-index += aliasing. The loop also
    # stays correct at npen == 3, where the two boundary corrections collide and
    # the generic band pattern [1, 5, 6, ..., 6, 5, 1] does not apply.
    band = solid + np.arange(npen - 2)
    for t, stencil_t in enumerate(_D2_STENCIL):
        for u, stencil_u in enumerate(_D2_STENCIL):
            C[band + t, band + u] += lam * stencil_t * stencil_u

    try:
        # Cholesky succeeding IS the positive-definiteness test, i.e. the test
        # that this is a local minimum at all — slogdet's sign is +1 for an
        # indefinite C with two negative eigenvalues, and eigvalsh costs 10-30x.
        chol = np.linalg.cholesky(C)
    except np.linalg.LinAlgError:
        return _FitQuality(chi2, None)
    if not np.all(np.isfinite(chol)):
        # cholesky does NOT raise on NaN/Inf, it returns a NaN factor, and
        # smooth_prony_fit runs minimize under errstate(invalid='ignore') — so
        # an overflowed coefficient would otherwise escape as a NaN score.
        return _FitQuality(chi2, None)
    logdetC = 2 * np.log(np.diag(chol)).sum()

    logpdetA = (
        2 * np.log(npen) + np.log(npen - 1) + np.log(npen + 1) - np.log(12.0)
    )
    # abs(): the penalty is sign-agnostic in smoothness (it enters squared) and
    # nothing upstream rejects a negative value.
    loglam = 2 * np.log(abs(smoothness))
    if prior_lam is None:
        prior_lam = lam
    # Negated so that lower is better. This is a log DENSITY, so positivity is
    # not guaranteed — it holds in practice because V dominates for any real
    # upload. Deliberately not clamped.
    neg_log_posterior = (
        V
        - 0.5 * (logpdetA + (npen - 2) * loglam - logdetC)
        - 0.5 * (2 + solid) * np.log(np.pi)
        + prior_lam
    )
    return _FitQuality(chi2, neg_log_posterior)


# digest -> (R, z), least-recently-used first. See _prony_reduce.
_REDUCE_CACHE = OrderedDict()


def _reduce_cache_key(arrays: tuple, solid: bool) -> tuple:
    """
    Content-address the reduction inputs without retaining them.

    Returns a hashable key holding only a digest, never the arrays themselves,
    so a cache entry cannot pin a 40,000-row upload in memory. Hashing ~1 MB
    costs on the order of a millisecond against seconds for the QR it saves.

    Parameters:
        arrays (tuple): numpy arrays the reduction depends on.
        solid (bool): Whether an equilibrium term is included.

    Returns:
        tuple: (digest bytes, solid) — hashable and content-addressed.
    """
    digest = hashlib.blake2b(digest_size=16)
    for arr in arrays:
        arr = np.ascontiguousarray(arr)
        digest.update(str(arr.shape).encode())
        digest.update(arr.dtype.str.encode())
        digest.update(memoryview(arr).cast('B'))  # no copy for contiguous input
    return digest.digest(), bool(solid)


def _prony_reduce(
        omega: np.ndarray,
        E_stor: np.ndarray,
        E_loss: np.ndarray,
        E_stor_std: np.ndarray,
        E_loss_std: np.ndarray,
        tau_i: np.ndarray,
        solid: bool,
) -> tuple:
    """
    Compress the weighted least-squares problem by a chunked QR factorization.

    Maintains the triangular augmented system [R | z] and folds each weighted
    basis block into it, so that EXACTLY
        ||(y - B c) / std||^2 = ||R c - z||^2
    and the reduced system has at most len(tau_i) + solid + 1 rows regardless of
    how many data rows the upload carries. Householder QR accumulates the residual
    information backward-stably (no explicit sums of squares), memory stays
    O(_QR_CHUNK_ROWS * N), and every subsequent solver operation costs O(N^2)
    independent of the input row count.

    Memoized on input CONTENT in a size-_REDUCE_CACHE_SIZE LRU, because a
    smoothness sweep varies only `smoothness` — which this reduction does not
    depend on — and would otherwise redo the expensive pass over every row for
    each trial value. Cached R and z are returned READ-ONLY: scipy 1.10's nnls
    and minimize do not write to them, but a future scipy that did would
    otherwise silently poison every later cache hit. The cache is not
    synchronized; under gunicorn's sync workers only one request runs per
    process, and a threaded worker could at worst duplicate work or perturb LRU
    order, never corrupt an entry.

    Parameters:
        omega (numpy.ndarray): 1-D array of angular frequencies.
        E_stor (numpy.ndarray): 1-D array of storage-modulus values.
        E_loss (numpy.ndarray): 1-D array of loss-modulus values.
        E_stor_std (numpy.ndarray): 1-D array of per-point standard deviations
            for E_stor.
        E_loss_std (numpy.ndarray): 1-D array of per-point standard deviations
            for E_loss.
        tau_i (numpy.ndarray): 1-D relaxation-time grid.
        solid (bool): Whether to include an equilibrium-modulus term.

    Returns:
        tuple: (R, z), the read-only reduced design matrix and target. The
        equality above is exact with no correction term to carry: see the
        comment on the residual row below.
    """
    key = _reduce_cache_key(
        (omega, E_stor, E_loss, E_stor_std, E_loss_std, tau_i), solid
    )
    hit = _REDUCE_CACHE.get(key)
    if hit is not None:
        _REDUCE_CACHE.move_to_end(key)
        return hit

    m = len(tau_i) + solid
    # Keeping m + 1 rows retains the full least-squares information. Row m of
    # the final triangle carries the orthogonal residual the fit can never
    # reach, and it is KEPT in (R, z) rather than returned as a separate
    # constant: R is upper triangular, so that row is exactly zero across the
    # basis columns, making it an ordinary residual row that contributes
    # z[m]**2 to any loss and nothing at all to any gradient. Every consumer
    # therefore sees full-problem values with no offset to thread through, and
    # the reduction stays exact rather than exact-up-to-a-correction. For
    # uploads with fewer than m rows the triangle is simply shorter (wide R) —
    # nnls and _prony_objective both accept that shape, and there is then no
    # unreachable residual to carry.
    Rz = np.empty((0, m + 1))
    for start in range(0, len(omega), _QR_CHUNK_ROWS):
        chunk = slice(start, start + _QR_CHUNK_ROWS)
        basis = prony_basis(omega[chunk], tau_i, solid)
        y = np.concatenate((E_stor[chunk], E_loss[chunk]))
        y_std = np.concatenate((E_stor_std[chunk], E_loss_std[chunk]))
        block = np.concatenate(
            (basis / y_std[:, None], (y / y_std)[:, None]), axis=1
        )
        Rz = np.linalg.qr(
            np.concatenate((Rz, block), axis=0), mode='r'
        )[:m + 1]
    Rz.flags.writeable = False
    reduced = (Rz[:, :m], Rz[:, m])

    _REDUCE_CACHE[key] = reduced
    if len(_REDUCE_CACHE) > _REDUCE_CACHE_SIZE:
        _REDUCE_CACHE.popitem(last=False)
    return reduced


def smooth_prony_fit(
        omega: np.ndarray,
        E_stor: np.ndarray,
        E_loss: np.ndarray,
        E_stor_std: np.ndarray,
        E_loss_std: np.ndarray,
        N: int,
        smoothness: float,
        solid: bool = True,
        return_fit_quality: bool = False,
) -> tuple:
    """
    Fit a Prony series to complex-modulus data with coefficient smoothing.

    Builds a log-spaced relaxation-time grid spanning 1/max(omega) to
    1/min(omega) and solves for non-negative Prony coefficients that minimize
    the weighted squared residuals, plus an optional second-difference
    smoothness penalty on the log-coefficients (see _prony_objective).

    Numerics: the weighted data term is first compressed EXACTLY by a chunked
    QR factorization of the weighted basis (see _prony_reduce) —
        ||(y - B c) / std||^2 = ||R c - z||^2
    — so the reduced system has at most N + solid + 1 rows regardless of how many
    data rows the upload carries. Householder QR accumulates the residual
    information backward-stably (no explicit sums of squares), memory stays
    O(_QR_CHUNK_ROWS * N), and every subsequent solver operation costs O(N^2)
    independent of the input row count.

    With smoothness == 0 the reduced problem is exactly non-negative least
    squares and is solved directly by scipy.optimize.nnls: finite,
    deterministic, no line search, no initial guess. Coefficients may then be
    EXACTLY zero (downstream consumers already filter E_i != 0). With
    smoothness > 0 the log-space penalty is nonlinear in the coefficients, so
    _prony_objective is minimized on the reduced system (basis=R, data=z, which
    the reduction has already weighted by 1/std) with L-BFGS-B, seeded from the
    NNLS solution and bounded above in log-space — without that bound the line
    search was measured to run exp(logcoefs) into overflow on broadband
    (many-decade) master curves.

    Parameters:
        omega (numpy.ndarray): 1-D array of angular frequencies.
        E_stor (numpy.ndarray): 1-D array of storage-modulus values, same
            length as omega.
        E_loss (numpy.ndarray): 1-D array of loss-modulus values, same length
            as omega.
        E_stor_std (numpy.ndarray): 1-D array of per-point standard deviations
            for E_stor, same length as omega. Used to weight residuals.
        E_loss_std (numpy.ndarray): 1-D array of per-point standard deviations
            for E_loss, same length as omega. Used to weight residuals.
        N (int): Number of relaxation times in the fit grid.
        smoothness (float): Strength of the second-difference penalty on the
            log-coefficients. Pass 0 to disable. Normalized internally to the
            upload's residual count (referenced to a nominal 400-row upload,
            _SMOOTHNESS_REF_RESIDUALS), so a given value produces comparable
            smoothing whether the file has 400 rows or 40,000.
        solid (bool): Whether to include an equilibrium-modulus term.
        return_fit_quality (bool): Append a _FitQuality to the return tuple.
            Off by default so existing two-value unpacking keeps working.

    Returns:
        tuple: (tau_i, E_i) where tau_i is the 1-D relaxation-time grid of
        length N and E_i is the 1-D non-negative coefficient array of length
        N + bool(solid). Entries can be exactly zero (NNLS active set). With
        return_fit_quality, (tau_i, E_i, quality); quality.neg_log_posterior is
        None unless the fit converged to an INTERIOR minimum with smoothing on,
        since the Laplace approximation behind it assumes a stationary point.
    """
    assert isinstance(omega, np.ndarray) and omega.ndim == 1, \
        "omega must be a 1-D numpy.ndarray"
    assert isinstance(E_stor, np.ndarray) and E_stor.ndim == 1, \
        "E_stor must be a 1-D numpy.ndarray"
    assert isinstance(E_loss, np.ndarray) and E_loss.ndim == 1, \
        "E_loss must be a 1-D numpy.ndarray"
    assert len(omega) == len(E_stor) == len(E_loss), \
        "omega, E_stor, E_loss must all have the same length"
    assert isinstance(E_stor_std, np.ndarray) and E_stor_std.shape == E_stor.shape, \
        "E_stor_std must be a 1-D numpy.ndarray matching E_stor"
    assert isinstance(E_loss_std, np.ndarray) and E_loss_std.shape == E_loss.shape, \
        "E_loss_std must be a 1-D numpy.ndarray matching E_loss"

    tau_max = 1 / np.min(omega)
    tau_min = 1 / np.max(omega)
    tau_i = prony_relaxation_space(tau_min, tau_max, N)

    m = N + solid
    n_res = 2 * len(omega)

    R, z = _prony_reduce(
        omega, E_stor, E_loss, E_stor_std, E_loss_std, tau_i, solid
    )
    # (R, z) carries the unreachable orthogonal residual as its last row, which
    # is what puts every score on the full-problem scale. L-BFGS-B must NOT see
    # it: its ftol is RELATIVE to f, so a constant the fit cannot reduce makes
    # the stopping test lazier by exactly the factor it inflates f — measured at
    # 13x the reducible residual on a 200-row upload, costing ~1e-5 in the
    # converged coefficients. nnls is immune (finite active set, no tolerance)
    # and wants the full norm, so only the minimize call takes the slice.
    R_fit, z_fit = R[:m], z[:m]

    # Reduced problem with smoothness == 0 is exactly non-negative least
    # squares — solve it directly (finite algorithm, no iteration budget).
    E_nnls, rnorm = nnls(R, z)
    if smoothness == 0:
        if not return_fit_quality:
            return tau_i, E_nnls
        # No penalty means no posterior over lam to report, but the misfit is
        # still meaningful — and nnls already handed us ||R c - z||, which the
        # reduction's residual row makes a full-problem quantity.
        dof = n_res - len(E_nnls)
        chi2 = rnorm ** 2 / dof if dof > 0 else None
        return tau_i, E_nnls, _FitQuality(chi2, None)

    # smoothness > 0: the second-difference penalty acts on log-coefficients,
    # so run _prony_objective on the reduced system. Seed from the NNLS
    # solution (clipping exact zeros so log stays finite); if NNLS zeroed
    # everything, fall back to the data-scaled flat guess.
    pos = E_nnls[E_nnls > 0]
    if pos.size:
        x0 = np.log(np.maximum(E_nnls, pos.min() * 1e-3))
    else:
        x0 = np.full(m, np.log(E_stor.max() / m))
    # Normalize the smoothness trade-off to the upload size: the data term
    # sums over all 2n residuals while the penalty sums over N-2 second
    # differences, so an unscaled weight weakens as ~1/n_res with growing
    # uploads (a 41k-row broadband file needed ~100x the smoothness a 400-row
    # file needs for the same effect). Scaling the weight by
    # sqrt(n_res / _SMOOTHNESS_REF_RESIDUALS) makes the penalty TERM (the
    # weight is squared inside _prony_objective) grow linearly with the
    # residual count, so a given `smoothness` value produces comparable
    # smoothing regardless of row count. The reference (800 residuals ~ a
    # 400-row upload) preserves historical calibrations at fixture scale.
    smoothness_scaled = smoothness * np.sqrt(n_res / _SMOOTHNESS_REF_RESIDUALS)
    # Upper bound on log-coefficients: no single Prony term should exceed
    # ~1000x the data maximum. Without this, the line search was measured to
    # push exp(logcoefs) into overflow on broadband master curves.
    ub = np.log(E_stor.max()) + np.log(1e3)
    with np.errstate(over='ignore', invalid='ignore'):
        result = minimize(
            fun=_prony_objective,
            x0=x0,
            args=(z_fit, R_fit, smoothness_scaled, solid),
            jac=True,
            method='L-BFGS-B',
            bounds=[(None, ub)] * m,
        )
    E_i = np.exp(result.x)
    if not return_fit_quality:
        return tau_i, E_i

    if np.any(result.x >= ub):
        # The optimum sits on the log-space bound, so grad(V) != 0 there and the
        # Laplace expansion behind neg_log_posterior does not apply. Report the
        # misfit only; the reduced residual is already a full-problem quantity.
        resid = (z - R @ E_i)
        dof = n_res - len(E_i)
        chi2 = resid @ resid / dof if dof > 0 else None
        return tau_i, E_i, _FitQuality(chi2, None)

    quality = _prony_fit_quality(
        result.x, z, R, smoothness_scaled, solid,
        n_resid=n_res,
        # UNSCALED: the exp(-lam) prior belongs on the user-facing smoothness.
        # Charged against the row-count-scaled lam it would penalize a 41k-row
        # upload ~50x harder than a 400-row one for identical physical
        # smoothing, undoing the _SMOOTHNESS_REF_RESIDUALS normalization above.
        prior_lam=smoothness * smoothness,
    )
    return tau_i, E_i, quality


# OLD Method
# def wlf_shift(T, T_ref, C1, C2):
#     """Calculate shift factor a_T using the WLF equation."""
#     print(f"T: {T}")
#     print(f"T_ref: {T_ref}")
#     print(f'C1: {C1}')
#     print(f'C2: {C2}')
#     return 10 ** (-C1 * (T - T_ref) / (C2 + (T - T_ref)))

def wlf_log10_shift(T: np.ndarray, T_ref: float, C1: float, C2: float) -> np.ndarray:
    """
    Return log10(a_T) = -C1 * (T - T_ref) / (C2 + (T - T_ref)) directly.

    Computing in log10 space avoids the 10**exponent overflow that occurs for
    cold data (T well below T_ref) when the exponent is large but finite.
    No finiteness guard is applied here; wlf_shift wraps this function and
    raises ValueError via _fp_safe if the result is non-finite.

    Parameters:
        T (numpy.ndarray): 1-D array of temperatures in °C.
        T_ref (float): Reference temperature in °C.
        C1 (float): WLF parameter C1.
        C2 (float): WLF parameter C2.

    Returns:
        numpy.ndarray: 1-D array of log10(a_T) values, same length as T.
    """
    return -C1 * (T - T_ref) / (C2 + (T - T_ref))


def wlf_shift(T, T_ref: float, C1: float, C2: float) -> np.ndarray:
    """
    Calculate the WLF shift factor a_T.

    Implements the Williams-Landel-Ferry equation:
        log10(a_T) = -C1 * (T - T_ref) / (C2 + (T - T_ref))

    Delegates to wlf_log10_shift for the analytic log10, then exponentiates.
    The single-source-of-truth formula lives in wlf_log10_shift; this function
    adds the _fp_safe shell and the finiteness check.

    Parameters:
        T: Temperatures at which to evaluate a_T. Scalars and 0-D arrays are
            promoted to a length-1 1-D array; 1-D arrays pass through.
        T_ref (float): Reference temperature.
        C1 (float): WLF parameter C1.
        C2 (float): WLF parameter C2.

    Returns:
        numpy.ndarray: 1-D array of shift factors a_T, same length as T.

    Raises:
        ValueError: If the WLF denominator C2 + (T - T_ref) reaches zero or the
            result is non-finite (overflow or invalid arithmetic).
    """
    T = np.atleast_1d(T)
    assert T.ndim == 1, "T must be a 1-D numpy.ndarray or scalar"

    with _fp_safe(
        "divide by zero detected when calculating WLF. "
        "Please adjust parameters or manually provide shift factors."
    ):
        a_T = np.power(10.0, wlf_log10_shift(T, T_ref, C1, C2))
        if not np.all(np.isfinite(a_T)):
            raise FloatingPointError("Non-finite result in WLF computation")
        return a_T


def _arr_shift(T: np.ndarray, T_ref: float, Ea: float) -> np.ndarray:
    """
    Calculate the Arrhenius shift factor a_T.

    Implements the Arrhenius equation:
        ln(a_T) = (Ea_J_per_mol / R) * (1/T_K - 1/T_ref_K)

    where T_K and T_ref_K are absolute temperatures in Kelvin (T + 273.15) and
    Ea_J_per_mol = 1000 * Ea.

    Parameters:
        T (numpy.ndarray): 1-D array of temperatures in °C.
        T_ref (float): Reference temperature in °C.
        Ea (float): Activation energy in kJ/mol.

    Returns:
        numpy.ndarray: 1-D array of shift factors a_T, same length as T.

    Raises:
        ValueError: If an absolute-zero singularity is reached or the result
            is non-finite (overflow or invalid arithmetic).
    """
    T_ref_K = T_ref + 273.15
    T_K = T + 273.15
    m = (Ea * 1000.0) /  R
    with _fp_safe(
        "absolute-zero singularity detected when calculating Arrhenius shift. "
        "Please adjust parameters or manually provide shift factors."
    ):
        a_T = np.exp(m * (1.0 / T_K - 1.0 / T_ref_K))
        if not np.all(np.isfinite(a_T)):
            raise FloatingPointError("Non-finite result in Arrhenius computation")
        return a_T


def hybrid_shift(
        T,
        T_ref: float,
        C1: float,
        C2: float,
        Ea: float,
        a_T_ref: float=1.0,
        ascending: bool=None,
) -> np.ndarray:
    """
    Calculate hybrid Arrhenius/WLF shift factors at T_ref.

    Applies the WLF equation to temperatures above T_ref and the Arrhenius
    equation to temperatures at or below T_ref. With two or more elements, T
    must be monotonically sorted (ascending or descending); the direction is
    detected from the signs of consecutive differences so the assembled output
    preserves the input order.

    Parameters:
        T: Temperatures in °C. Scalars and 0-D arrays are promoted to a
            length-1 1-D array; 1-D arrays of length >= 2 must be monotonically
            sorted.
        T_ref (float): Reference temperature in °C; WLF/Arrhenius boundary.
        C1 (float): WLF parameter C1.
        C2 (float): WLF parameter C2.
        Ea (float): Arrhenius activation energy in kJ/mol.
        a_T_ref (float): convenience argument to scale returned shift factors.
        ascending (bool): Flag to skip descending handling if pre-calculated elsewhere

    Returns:
        numpy.ndarray: 1-D array of shift factors a_T, same length as T, where
            np.interp(T_ref,T,a_T) ~ a_T_ref

    Raises:
        ValueError: If the WLF or Arrhenius sub-calculation hits a singularity.
    """
    T = np.atleast_1d(T)
    if ascending is None:
        assert T.ndim == 1, "T must be a 1-D numpy.ndarray or scalar"
        assert np.all(np.isfinite(T)), "T must contain only finite values"
        diffs = np.diff(T)
        if len(diffs) > 0:
            ascending = bool(np.all(diffs > 0))  # base case from loader utility
            assert ascending or np.all(diffs < 0), "T must be monotonically sorted"
        else:
            ascending = True  # single element; direction irrelevant

    T = T if ascending else T[::-1]
    k = np.searchsorted(T, T_ref + float_correction, side='right')
    a_T_arr = _arr_shift(T[:k], T_ref, Ea)
    a_T_wlf = wlf_shift(T[k:], T_ref, C1, C2)
    result = np.concatenate((a_T_arr, a_T_wlf))
    result *= a_T_ref
    return result if ascending else result[::-1]


def _curve_fit_shift(model, T: np.ndarray, log10_a_T: np.ndarray,
                     p0: list, bounds=(-np.inf, np.inf),
                     log10_space: bool = False) -> np.ndarray:
    """
    Fit shift-model parameters to log10(a_T) data via curve_fit.

    By default wraps model (which returns linear-scale a_T) in a log10
    transform so the optimizer sees uniform weighting across many orders of
    magnitude. When log10_space=True the model already returns log10(a_T)
    directly (avoiding intermediate exponentiation and potential overflow).
    Only free parameters are passed; fixed parameters must already be closed
    over in the model callable.

    Parameters:
        model: Callable with signature model(T, *free_params) -> np.ndarray.
            Returns linear-scale a_T when log10_space=False, or log10(a_T)
            when log10_space=True. Fixed parameters must be captured in the
            closure.
        T (numpy.ndarray): 1-D array of temperatures in °C.
        log10_a_T (numpy.ndarray): 1-D array of log10(a_T) target values,
            same length as T.
        p0 (list): Initial guesses for the free parameters.
        bounds: Bounds for the free parameters forwarded to curve_fit
            (same format as scipy's bounds argument). Defaults to no bounds.
        log10_space (bool): If True, model already returns log10(a_T) and no
            np.log10 wrapping is applied. Defaults to False.

    Returns:
        numpy.ndarray: Fitted values for the free parameters, same length as p0.

    Raises:
        ValueError: If curve_fit fails to converge.
    """
    # TODO(scipy>=1.11): fixed parameters are currently held constant by
    # closure reparametrization (excluded from the fit vector and captured in
    # `model`) because scipy 1.10.1 rejects equal bounds with "Each lower bound
    # must be strictly less than each upper bound". Once the services env is
    # bumped to scipy >= 1.11, this can be revised to pass ALL parameters to
    # curve_fit with bounds, fixing a parameter via lb == ub. That would let the
    # callers (fit_wlf_coefficients / fit_hybrid_coefficients) drop their
    # per-parameter free/fixed branching in favor of one bounds vector.
    if log10_space:
        fit_model = model
    else:
        def fit_model(T_arg, *params):
            return np.log10(model(T_arg, *params))

    try:
        popt, _ = curve_fit(fit_model, T, log10_a_T, p0=p0, bounds=bounds)
    except RuntimeError as exc:
        raise ValueError(
            f"Shift-factor curve fit did not converge: {exc}. "
            "Try supplying better initial guesses or checking the input data."
        ) from exc
    return popt


def fit_wlf_coefficients(
        T: np.ndarray,
        a_T: np.ndarray,
        T_ref: float,
        C1: float = None,
        C2: float = None,
        fix_C1: bool = False,
        fix_C2: bool = False,
) -> tuple:
    """
    Fit WLF shift-model coefficients (C1, C2) to shift-domain data.

    Uses scipy.optimize.curve_fit in log10(a_T) space so that points spanning
    many decades of shift factor receive uniform weight. T_ref is required and
    is never optimized — it is a physical input (e.g. Tg) supplied by the
    caller.

    Individual parameters can be fixed at their supplied values by setting the
    corresponding fix_* flag. A supplied-but-not-fixed value becomes the
    initial guess; otherwise the WLF universal constants are used. Fixed
    parameters are held constant by closing them over inside the model rather
    than passing them to curve_fit.

    When C2 is free, a lower bound c2_min = (T_ref - min(T)) + 1.0 is enforced
    to keep the WLF denominator positive (1 °C margin). The fit uses
    wlf_log10_shift directly (log10_space=True) to avoid the 10**exponent
    overflow that otherwise occurs for cold data (T well below T_ref).

    Parameters:
        T (numpy.ndarray): 1-D array of temperatures in °C, same length as a_T.
        a_T (numpy.ndarray): 1-D array of positive shift factors (linear scale).
        T_ref (float): Reference temperature in °C; passed through to wlf_shift
            and never optimized.
        C1 (float): Initial guess for WLF C1. Defaults to UNIVERSAL_WLF_C1 if
            None.
        C2 (float): Initial guess for WLF C2. Defaults to UNIVERSAL_WLF_C2 if
            None.
        fix_C1 (bool): If True, hold C1 constant at its supplied value.
        fix_C2 (bool): If True, hold C2 constant at its supplied value.

    Returns:
        tuple: (C1_fit, C2_fit) — fitted (or fixed) WLF coefficients.

    Raises:
        ValueError: If any a_T value is non-positive (log10 undefined), or if
            curve_fit does not converge.
    """
    T = np.atleast_1d(T)
    a_T = np.atleast_1d(a_T)
    assert T.ndim == 1 and a_T.ndim == 1, \
        "T and a_T must be 1-D numpy.ndarray or scalar"
    assert len(T) == len(a_T), \
        f"T and a_T must have the same length; got {len(T)} and {len(a_T)}"
    if not np.all(a_T > 0):
        raise ValueError(
            "All shift factors a_T must be positive (log10 is undefined for "
            "non-positive values). Check the input shift-factor data."
        )

    C1_0 = C1 if C1 is not None else UNIVERSAL_WLF_C1
    C2_0 = C2 if C2 is not None else UNIVERSAL_WLF_C2

    # Lower bound for a free C2: keeps denominator C2 + (T - T_ref) >= 1 for
    # all T in the dataset, preventing a WLF pole and keeping the analytic
    # log10 finite for any finite C1.
    c2_min = (T_ref - float(np.min(T))) + 1.0

    # Build a model over only the free parameters; fixed ones are closed over.
    # This avoids passing degenerate lb==ub bounds to curve_fit, which some
    # scipy versions reject.
    if fix_C1 and fix_C2:
        return float(C1_0), float(C2_0)
    elif fix_C1:
        # C2 free: use analytic log10 form and enforce c2_min bound.
        def model(T_arg, C2_p):
            return wlf_log10_shift(T_arg, T_ref, C1_0, C2_p)
        C2_start = max(C2_0, c2_min)
        (C2_fit,) = _curve_fit_shift(
            model, T, np.log10(a_T), p0=[C2_start],
            bounds=([c2_min], [np.inf]), log10_space=True,
        )
        return float(C1_0), float(C2_fit)
    elif fix_C2:
        # C1 free, C2 fixed: no overflow risk (denominator is fixed and positive
        # as long as the fixed C2 was chosen appropriately by the caller).
        def model(T_arg, C1_p):
            return wlf_shift(T_arg, T_ref, C1_p, C2_0)
        (C1_fit,) = _curve_fit_shift(model, T, np.log10(a_T), p0=[C1_0])
        return float(C1_fit), float(C2_0)
    else:
        # Both free: use analytic log10 form directly (avoids 10**exponent
        # overflow for cold data) and enforce c2_min on C2.
        def model(T_arg, C1_p, C2_p):
            return wlf_log10_shift(T_arg, T_ref, C1_p, C2_p)
        C2_start = max(C2_0, c2_min)
        C1_fit, C2_fit = _curve_fit_shift(
            model, T, np.log10(a_T), p0=[C1_0, C2_start],
            bounds=([-np.inf, c2_min], [np.inf, np.inf]), log10_space=True,
        )
        return float(C1_fit), float(C2_fit)


def fit_hybrid_coefficients(
        T: np.ndarray,
        a_T: np.ndarray,
        TL: float,
        C1: float = None,
        C2: float = None,
        Ea: float = None,
        fix_C1: bool = False,
        fix_C2: bool = False,
        fix_Ea: bool = False,
) -> tuple:
    """
    Fit hybrid Arrhenius/WLF shift-model coefficients (C1, C2, Ea) to
    shift-domain data.

    Uses scipy.optimize.curve_fit in log10(a_T) space so that points spanning
    many decades of shift factor receive uniform weight. TL is required and is
    never optimized — it is produced upstream by the E-loss-peak logic in the
    extract step and is a physical input, not a fit parameter.

    Individual parameters can be fixed at their supplied values by setting the
    corresponding fix_* flag. A supplied-but-not-fixed value becomes the
    initial guess; otherwise the WLF universal constants are used for C1/C2 and
    a moderate activation energy (100 kJ/mol) for Ea. Fixed parameters are held
    constant by closing them over inside the model rather than passing them to
    curve_fit.

    Parameters:
        T (numpy.ndarray): 1-D array of temperatures in °C, same length as a_T.
            Must be monotonically sorted (ascending or descending) as required by
            hybrid_shift.
        a_T (numpy.ndarray): 1-D array of positive shift factors (linear scale).
        TL (float): WLF/Arrhenius crossover temperature in °C; passed through
            to hybrid_shift and never optimized.
        C1 (float): Initial guess for WLF C1. Defaults to UNIVERSAL_WLF_C1 if
            None.
        C2 (float): Initial guess for WLF C2. Defaults to UNIVERSAL_WLF_C2 if
            None.
        Ea (float): Initial guess for Arrhenius activation energy in kJ/mol.
            Defaults to 100.0 if None.
        fix_C1 (bool): If True, hold C1 constant at its supplied value.
        fix_C2 (bool): If True, hold C2 constant at its supplied value.
        fix_Ea (bool): If True, hold Ea constant at its supplied value.

    Returns:
        tuple: (C1_fit, C2_fit, Ea_fit, a_T_ref) — fitted (or fixed) hybrid
            coefficients plus the co-fitted reference shift factor a_T_ref (the
            data's shift factor at TL; 1.0 when the data is referenced to TL).

    Raises:
        ValueError: If any a_T value is non-positive (log10 undefined), if TL
            falls outside the data range so a model segment is degenerate, or if
            curve_fit does not converge.
    """
    T = np.atleast_1d(T)
    a_T = np.atleast_1d(a_T)
    assert T.ndim == 1 and a_T.ndim == 1, \
        "T and a_T must be 1-D numpy.ndarray or scalar"
    assert len(T) == len(a_T), \
        f"T and a_T must have the same length; got {len(T)} and {len(a_T)}"
    if not np.all(a_T > 0):
        raise ValueError(
            "All shift factors a_T must be positive (log10 is undefined for "
            "non-positive values). Check the input shift-factor data."
        )
    assert np.all(np.isfinite(T)), "T must contain only finite values"

    _EA_DEFAULT = 100.0  # kJ/mol — broad mid-range starting point
    C1_0 = C1 if C1 is not None else UNIVERSAL_WLF_C1
    C2_0 = C2 if C2 is not None else UNIVERSAL_WLF_C2
    Ea_0 = Ea if Ea is not None else _EA_DEFAULT

    diffs = np.diff(T)
    if len(diffs) > 0:
        ascending = bool(np.all(diffs > 0))  # base case from loader utility
        assert ascending or np.all(diffs < 0), "T must be monotonically sorted"
    else:
        ascending = True  # single element; direction irrelevant

    if not fix_Ea and TL <= T[-(not ascending)]:
        raise ValueError("TL is below the range of the shift factor data, leading"
                         "to a degenerate Arrhenius segment of hybrid fit. Check data "
                         "or supply a different TL.")

    if not (fix_C1 or fix_C2) and TL >= T[-(ascending)]:
        raise ValueError("TL is above the range of the shift factor data, leading"
                         "to a degenerate WLF segment of hybrid fit. Check data or "
                         "supply a different TL.")

    # The shift factors may not be referenced to TL, but hybrid_shift is always 1
    # at TL. So a_T_ref (the data's shift factor at TL) is co-fitted as a vertical
    # offset rather than read off a single interpolated point: interpolating
    # across the WLF/Arrhenius kink at TL biases the estimate (and hence the whole
    # fit) even when the data is referenced exactly to TL. The interp value only
    # seeds the optimizer; np.interp needs ascending samples, so order them.
    log10_a_T = np.log10(a_T)
    T_asc = T if ascending else T[::-1]
    log10_asc = log10_a_T if ascending else log10_a_T[::-1]
    a_T_ref_0 = 10 ** float(np.interp(TL, T_asc, log10_asc))

    # Build a model over only the free parameters; fixed ones are closed over.
    # This avoids passing degenerate lb==ub bounds to curve_fit, which some
    # scipy versions reject. a_T_ref is always free (the co-fitted offset).
    free_names = [n for n, fixed in
                  [('C1', fix_C1), ('C2', fix_C2), ('Ea', fix_Ea), ('a_T_ref', False)]
                  if not fixed]
    p0 = [v for v, fixed in
          [(C1_0, fix_C1), (C2_0, fix_C2), (Ea_0, fix_Ea), (a_T_ref_0, False)]
          if not fixed]

    # C2 floored at 1.0 to stay off the WLF pole; a_T_ref floored just above 0 so
    # the log10 wrapper in _curve_fit_shift stays finite. Hybrid's WLF branch only
    # sees T > TL (not cold data), so the 10**exponent overflow that afflicts
    # fit_wlf_coefficients cannot occur here; log10_space=False is intentional.
    _floor = {'C2': 1.0, 'a_T_ref': np.finfo(float).tiny}
    lb = [_floor.get(n, -np.inf) for n in free_names]
    ub = [np.inf] * len(free_names)

    def model(T_arg, *free_vals):
        vals = dict(zip(free_names, free_vals))
        return hybrid_shift(
            T_arg, TL,
            vals.get('C1', C1_0),
            vals.get('C2', C2_0),
            vals.get('Ea', Ea_0),
            vals.get('a_T_ref', a_T_ref_0),
            ascending,
        )

    fitted = _curve_fit_shift(model, T, log10_a_T, p0=p0, bounds=(lb, ub))
    result = dict(zip(free_names, fitted))
    return (
        float(result.get('C1', C1_0)),
        float(result.get('C2', C2_0)),
        float(result.get('Ea', Ea_0)),
        float(result.get('a_T_ref', a_T_ref_0)),
    )


def inverse_wlf_shift(a_T, T_ref: float, C1: float, C2: float) -> np.ndarray:
    """
    Calculate the temperature T corresponding to a WLF shift factor a_T.

    Inverts the Williams-Landel-Ferry equation
        log10(a_T) = -C1 * (T - T_ref) / (C2 + (T - T_ref))
    to give
        T = T_ref - C2 * log10(a_T) / (C1 + log10(a_T)).

    Parameters:
        a_T: Shift factor(s). Scalars and 0-D arrays are promoted to a length-1
            1-D array; 1-D arrays pass through.
        T_ref (float): Reference temperature.
        C1 (float): WLF parameter C1.
        C2 (float): WLF parameter C2.

    Returns:
        numpy.ndarray: 1-D array of temperatures, same length as a_T.

    Raises:
        ValueError: If a_T <= 0 (log10 undefined), C1 + log10(a_T) = 0
            (singularity), or the result is non-finite.
    """
    a_T = np.atleast_1d(a_T)
    assert a_T.ndim == 1, "a_T must be a 1-D numpy.ndarray or scalar"

    with _fp_safe(
        "invalid shift factor when inverting WLF "
        "(a_T must be positive and log10(a_T) != -C1). Please adjust parameters."
    ):
        log_a_T = np.log10(a_T)
        T = (log_a_T * (T_ref - C2) + C1 * T_ref) / (log_a_T + C1)
        if not np.all(np.isfinite(T)):
            raise FloatingPointError("Non-finite result in inverse WLF computation")
        return T


def tts_temperature_to_frequency_V2(temp_sweep_data, shift_model, *,
                                    Tg=None, TL=None, C1=None, C2=None, Ea=None,
                                    shiftData=None):
    """
    Convert temperature-sweep viscoelastic data to frequency-sweep data via TTS.

    Computes a shift factor a_T per row and returns a new DataFrame at the
    reference temperature with shifted frequencies (Frequency * a_T). Rows are
    sorted by Temperature ascending before the shift is applied.

    The reference temperature is selected from shift_model: 'WLF' uses Tg
    (glass transition); 'hybrid' uses TL (WLF/Arrhenius crossover).

    Parameters:
        temp_sweep_data (pd.DataFrame): Input data with columns
            ['Temperature', "E'", "E''"], optionally including 'Frequency'
            for the per-row measurement frequency. If 'Frequency' is absent,
            1.0 Hz is assumed (typical for a fixed-frequency DMA temperature sweep).
        shift_model (str): Which shift function to apply. 'WLF' uses
            wlf_shift across all temperatures; 'hybrid' uses hybrid_shift
            (Arrhenius at or below TL, WLF above); 'manual' requires
            shiftData and uses it directly.
        Tg (float): WLF reference temperature (used when shift_model == 'WLF').
        TL (float): Hybrid WLF/Arrhenius crossover temperature (used when
            shift_model == 'hybrid').
        C1 (float): WLF equation parameter C1.
        C2 (float): WLF equation parameter C2.
        Ea (float): Arrhenius activation energy in kJ/mol; used only when
            shift_model == 'hybrid'.
        shiftData: Optional precomputed shift factors. When falsy (None,
            empty, etc.), shift factors are computed from shift_model with
            the supplied parameters. When truthy, must be convertible to a
            DataFrame with an 'a_T' column. If it also has a 'Temperature'
            column (as upload_init(..., 'shift') produces), a_T is interpolated
            in log10 space onto the data temperatures, so the shift file need
            not match the data file's row count or grid (values outside the
            file's temperature range are extrapolated). Without a 'Temperature'
            column, a_T is used positionally and must match the row count of
            temp_sweep_data sorted by Temperature ascending.

    Returns:
        pd.DataFrame: Frequency-sweep data at T_ref with columns
        ['Frequency', 'Temperature', "E'", "E''"], sorted by Frequency with a
        fresh 0..N-1 index. Input temp_sweep_data is not mutated. Rows whose
        |log10(a_T)| exceeds MAX_ABS_LOG10_SHIFT are dropped (WLF-singularity
        guard), so the result may be shorter than the input.

    Raises:
        ValueError: If shift_model is 'manual' without shiftData, or if no rows
            fall within the valid shift-factor window (|log10 a_T| bound).
    """
    df = temp_sweep_data.sort_values('Temperature')
    T = df['Temperature'].to_numpy()

    if shiftData:
        a_T_df = pd.DataFrame(shiftData)
        assert 'a_T' in a_T_df.columns, \
            f"shiftData must have an 'a_T' column; got {list(a_T_df.columns)}. " \
            "shiftData should come from upload_init(..., 'shift') which guarantees this."
        if 'Temperature' in a_T_df.columns:
            # Interpolate a_T onto the data temperatures (in log10 space, since
            # shift factors span many decades) so the shift and data files need
            # not share a row count or grid; extrapolate beyond the file's range.
            shift_T = a_T_df['Temperature'].to_numpy()
            order = np.argsort(shift_T)
            log_a_T = interp1d(
                shift_T[order], np.log10(a_T_df['a_T'].to_numpy()[order]),
                kind='linear', bounds_error=False, fill_value='extrapolate',
            )(T)
            a_T = np.power(10.0, log_a_T)
        else:
            # Legacy positional form: a_T aligns row-for-row with the sorted data.
            a_T = a_T_df['a_T'].to_numpy()
            if len(a_T) != len(T):
                raise ValueError(
                    f"Shift file has {len(a_T)} rows but data file has {len(T)} rows. "
                    "Include a Temperature column in the shift file to interpolate, "
                    "or match the row counts."
                )
    elif shift_model == 'WLF':
        a_T = wlf_shift(T, Tg, C1, C2)
    elif shift_model == 'hybrid':
        a_T = hybrid_shift(T, TL, C1, C2, Ea)
    elif shift_model == 'manual':
        raise ValueError(
            "Manual shift model selected but no shift-factor file was provided. "
            "Upload a shift-factor file or pick 'WLF' or 'hybrid'."
        )
    else:
        assert False, (
            f"Unknown shift_model: {shift_model!r}; expected 'WLF', 'hybrid', "
            "or 'manual'. The route must restrict shift_model to this set."
        )

    T_ref = {'WLF': Tg, 'hybrid': TL}.get(shift_model)  # None for 'manual'

    # Drop rows outside the valid shift window (see MAX_ABS_LOG10_SHIFT).
    with np.errstate(divide='ignore', invalid='ignore'):
        keep = np.abs(np.log10(a_T)) <= MAX_ABS_LOG10_SHIFT
    if not np.any(keep):
        raise ValueError(
            "No data rows fall within the valid shift-factor window "
            f"(|log10 a_T| ≤ {MAX_ABS_LOG10_SHIFT:g}). The temperature range likely "
            "sits too close to the WLF T_ref − C2 singularity; narrow the range, "
            "adjust Tg/C2, use the hybrid model, or provide manual shift factors."
        )
    if not np.all(keep):
        df = df.iloc[keep]
        a_T = a_T[keep]

    source_omega = df['Frequency'].to_numpy() if 'Frequency' in df.columns else 1.0
    out = df.assign(Frequency=source_omega * a_T, Temperature=T_ref)
    canonical = ['Frequency', 'Temperature', "E'", "E''"]
    extras = [c for c in df.columns if c not in canonical]
    return out[canonical + extras].sort_values('Frequency').reset_index(drop=True)


def tts_frequency_to_temperature(
        freq_sweep_data: pd.DataFrame,
        omega_ref: float,
        T_ref: float,
        C1: float,
        C2: float,
) -> pd.DataFrame:
    """
    Convert frequency-sweep viscoelastic data to temperature-sweep data via TTS.

    For each row computes a_T = Frequency / omega_ref and inverts the WLF
    equation about T_ref to find the temperature that would produce that shift
    factor. The returned DataFrame is at the reference frequency omega_ref.

    Parameters:
        freq_sweep_data (pd.DataFrame): Input data with columns
            ['Frequency', "E'", "E''"].
        omega_ref (float): Reference frequency for shifting.
        T_ref (float): WLF reference temperature.
        C1 (float): WLF parameter C1.
        C2 (float): WLF parameter C2.

    Returns:
        pd.DataFrame: Temperature-sweep data at omega_ref with columns
        ['Frequency', 'Temperature', "E'", "E''"], sorted by Temperature with a
        fresh 0..N-1 index. Input freq_sweep_data is not mutated.

    Raises:
        ValueError: If the inverse-WLF computation hits a singularity.
    """
    omega = freq_sweep_data['Frequency'].to_numpy()
    a_T = omega / omega_ref
    shifted_T = inverse_wlf_shift(a_T, T_ref, C1, C2)

    return pd.DataFrame({
        'Frequency': np.full(len(omega), omega_ref),
        'Temperature': shifted_T,
        "E'": freq_sweep_data["E'"].to_numpy(),
        "E''": freq_sweep_data["E''"].to_numpy(),
    }).sort_values('Temperature').reset_index(drop=True)


def _freq_to_temp_via_shift_table(freq_sweep_data: pd.DataFrame, shiftData,
                                  omega_ref: float) -> pd.DataFrame:
    """
    Map master-curve frequencies to temperatures using an uploaded shift table.

    This is the "manual" frequency→temperature inversion: for each master-curve
    point a_T = Frequency / omega_ref, and the temperature is read off the shift
    table by interpolating Temperature against log10(a_T) (shift factors span
    many decades, so interpolate in log space) — the inverse of the shiftData
    branch of tts_temperature_to_frequency_V2. np.interp does not extrapolate, so
    frequencies outside the table's a_T range clamp to its temperature limits.

    The shift table is used as data, not fit to a model. Physically a_T(T) is
    monotonic, but measurement noise in a_T can create local non-monotonicity
    (Temperature is the reliable axis). The monotonic trend direction is read
    from the two ENDS of the table (a flat table has no invertible trend), and
    the (log10 a_T, Temperature) pairs are then ordered by log10 a_T so np.interp
    gets the increasing x it requires; residual a_T noise cannot break the
    lookup and no rows are dropped.

    Parameters:
        freq_sweep_data (pd.DataFrame): Master curve with columns
            ['Frequency', "E'", "E''"].
        shiftData: Shift factors convertible to a DataFrame with 'a_T' and
            'Temperature' columns (as upload_init(..., 'shift') produces).
        omega_ref (float): Reference (physical) frequency; a_T == 1 there.

    Returns:
        pd.DataFrame: Temperature-sweep data at omega_ref with columns
        ['Frequency', 'Temperature', "E'", "E''"], sorted by Temperature.

    Raises:
        ValueError, KeyError, AssertionError: If the shift table lacks the
            required columns, has fewer than 2 usable rows, or has no a_T trend.
            Callers treat any of these as "not usable" and fall back to a
            default view.
    """
    tbl = pd.DataFrame(shiftData)
    assert 'a_T' in tbl.columns and 'Temperature' in tbl.columns, (
        "manual frequency→temperature needs a shift table with 'a_T' and "
        "'Temperature' columns (from upload_init(..., 'shift'))."
    )
    aT = tbl['a_T'].to_numpy(dtype=float)
    T = tbl['Temperature'].to_numpy(dtype=float)
    usable = np.isfinite(aT) & (aT > 0) & np.isfinite(T)
    log_a = np.log10(aT[usable])
    T = T[usable]
    if len(T) < 2:
        raise ValueError("shift table has fewer than 2 usable rows.")

    # Temperature is the reliable axis; a_T carries the measurement noise. Order
    # by T and read the monotonic trend from the two ENDS of the table (cheap,
    # rather than scanning every row). A flat table has no invertible trend.
    # No model is fit and no rows are dropped.
    # TODO: the robust long-term fix for noisy shift tables is to FIT a monotone
    # shift-factor model (reuse fit_wlf_coefficients / fit_hybrid_coefficients,
    # or a monotone spline) and invert that, and to expose that fit as a GUI
    # option — the frequency→temperature analog of the /fit-shift flow. That
    # would replace both this direct inversion and the universal-WLF fallback.
    order = np.argsort(T)
    T, log_a = T[order], log_a[order]
    if log_a[0] == log_a[-1]:
        raise ValueError("shift-table a_T does not vary across its temperature range.")

    # np.interp needs strictly-increasing xp: order the (log10 a_T, T) pairs by
    # log10 a_T. The a_T→T direction follows automatically from the sort.
    order = np.argsort(log_a)
    log_a, T = log_a[order], T[order]
    omega = freq_sweep_data['Frequency'].to_numpy()
    shifted_T = np.interp(np.log10(omega / omega_ref), log_a, T)

    return pd.DataFrame({
        'Frequency': np.full(len(omega), omega_ref),
        'Temperature': shifted_T,
        "E'": freq_sweep_data["E'"].to_numpy(),
        "E''": freq_sweep_data["E''"].to_numpy(),
    }).sort_values('Temperature').reset_index(drop=True)


def tts_frequency_to_temperature_V2(freq_sweep_data: pd.DataFrame, shift_model, *,
                                    Tg=None, TL=None, C1=None, C2=None, Ea=None,
                                    shiftData=None,
                                    omega_ref: float = VIS_REF_FREQUENCY_HZ) -> pd.DataFrame:
    """
    Convert a frequency master curve to a temperature sweep via inverse TTS.

    Mirror image of tts_temperature_to_frequency_V2, used to build the
    temperature-axis visualization for a frequency-domain upload. Selection of
    the inverse-shift model, in priority order (shiftData wins, matching the
    forward V2):

        1. manual  — shiftData present and usable → invert the shift table
           (_freq_to_temp_via_shift_table).
        2. WLF     — shift_model == 'WLF' with Tg, C1, C2 all supplied →
           analytic inverse WLF (tts_frequency_to_temperature / inverse_wlf_shift).
        3. fallback — anything else (hybrid, missing params, or a failed attempt
           above) → the universal-WLF view (fixed UNIVERSAL_WLF_* constants and
           VIS_REF_TEMPERATURE_C), i.e. the historical behavior.

    Unlike the forward tts_temperature_to_frequency_V2 (whose transform is
    essential and *raises* on manual-without-file), this conversion is
    visualization-only — the Prony fit runs on the frequency data directly — so
    it must never raise/block: an unusable model silently degrades to (3).

    Parameters:
        freq_sweep_data (pd.DataFrame): Master curve with columns
            ['Frequency', "E'", "E''"].
        shift_model (str): 'WLF', 'hybrid', or 'manual'.
        Tg (float): WLF reference temperature (used when shift_model == 'WLF').
        TL, Ea: Accepted for signature symmetry with the forward V2; unused
            because no inverse-hybrid exists yet (hybrid → fallback).
        C1 (float): WLF parameter C1 (used when shift_model == 'WLF').
        C2 (float): WLF parameter C2 (used when shift_model == 'WLF').
        shiftData: Optional shift-factor table {'Temperature': ..., 'a_T': ...};
            when usable it takes priority (manual path).
        omega_ref (float): Reference (physical) frequency; a_T == 1 there.

    Returns:
        pd.DataFrame: Temperature-sweep data at omega_ref with columns
        ['Frequency', 'Temperature', "E'", "E''"], sorted by Temperature.
    """
    if shiftData:
        try:
            return _freq_to_temp_via_shift_table(freq_sweep_data, shiftData, omega_ref)
        except (ValueError, KeyError, AssertionError):
            pass  # unusable shift table → universal-WLF visualization
    elif shift_model == 'WLF' and Tg is not None and C1 is not None and C2 is not None:
        try:
            return tts_frequency_to_temperature(freq_sweep_data, omega_ref, Tg, C1, C2)
        except ValueError:
            pass  # WLF singularity → universal-WLF visualization

    # Universal-WLF fallback (hybrid, insufficient params, or a failed attempt).
    return tts_frequency_to_temperature(
        freq_sweep_data, omega_ref, VIS_REF_TEMPERATURE_C,
        UNIVERSAL_WLF_C1, UNIVERSAL_WLF_C2,
    )


def argmax_peak(signal: np.ndarray) -> int:
    """
    Return the index of the most prominent peak in a 1-D signal.

    Uses scipy.signal.find_peaks with prominence=0.01 to locate candidate
    peaks and picks the one with the largest signal value.

    Parameters:
        signal (numpy.ndarray): 1-D array to scan for peaks.

    Returns:
        int: Index of the most prominent peak in signal.

    Raises:
        ValueError: If find_peaks returns no peaks.
    """
    assert isinstance(signal, np.ndarray) and signal.ndim == 1, \
        "signal must be a 1-D numpy.ndarray"
    peaks, _ = find_peaks(signal, prominence=0.01)
    if len(peaks) == 0:
        raise ValueError(
            "No peaks found. Try lowering the prominence parameter or enter the value manually."
        )
    return int(peaks[np.argmax(signal[peaks])])


def _decimate_for_plot(df: pd.DataFrame) -> tuple:
    """
    Thin a sorted experiment DataFrame for plotting when it exceeds
    _PLOT_MAX_POINTS.

    Rows are subsampled at evenly spaced positional indices (first and last
    rows always kept), which preserves the curve shape for data that is
    already sorted along its x axis regardless of grid spacing. The fit never
    sees this — callers decimate only the frames handed to figure builders.

    Parameters:
        df (pd.DataFrame): Experiment data sorted by its x column.

    Returns:
        tuple: (plot_df, percent) where plot_df is df itself when no thinning
        was needed, or a positional subsample otherwise; percent is None when
        no thinning happened, else the integer percentage of rows dropped
        (for the user-facing figure annotation).
    """
    n = len(df)
    if n <= _PLOT_MAX_POINTS:
        return df, None
    idx = np.unique(np.linspace(0, n - 1, _PLOT_MAX_POINTS).astype(int))
    percent = int(round(100.0 * (1 - len(idx) / n)))
    return df.iloc[idx], percent


def _annotate_decimation(figs, percent) -> None:
    """
    Stamp a decimation notice onto each figure when plot thinning occurred.

    The notice rides inside the plotly figures themselves (paper-coordinate
    annotation above the plot area), so the frontend needs no changes to
    display it. No-op when percent is None.

    Parameters:
        figs: Iterable of plotly Figures to annotate.
        percent: Integer percentage of experiment rows dropped, or None.
    """
    if percent is None:
        return
    text = (
        f"too many data points, plot traces decimated by {percent}% for speed"
        " (the fit uses all points)"
    )
    for fig in figs:
        fig.add_annotation(
            text=text,
            xref='paper', yref='paper', x=0.0, y=1.06,
            xanchor='left', yanchor='bottom', showarrow=False,
            font=dict(size=11, color='gray'),
        )


def _annotate_fit_quality(figs, quality) -> None:
    """
    Stamp the fit-quality readout onto each figure that overlays fit on data.

    Rides inside the figures as a paper-coordinate annotation, the same trick
    _annotate_decimation uses, so the frontend needs no changes — plotly's
    to_json carries layout.annotations. Right-aligned on the same row as the
    decimation notice so the two never overlap.

    Both numbers are "lower is better". Fields that are None are omitted, so an
    unsmoothed fit shows the misfit alone (there is no posterior over the
    smoothing weight when there is no smoothing).

    Uses add_annotation rather than update_layout(annotations=...): these are
    plotly-express faceted figures whose layout.annotations already holds the
    facet titles, which update_layout would replace.

    Parameters:
        figs: Iterable of plotly Figures to annotate.
        quality (_FitQuality): Scores from smooth_prony_fit, or None to no-op.
    """
    if quality is None:
        return
    parts = []
    if quality.chi2_reduced is not None:
        parts.append(f"χ²/ν = {quality.chi2_reduced:.3g}")
    if quality.neg_log_posterior is not None:
        parts.append(
            f"−log posterior(λ) = {quality.neg_log_posterior:.4g}"
        )
    if not parts:
        return
    text = " · ".join(parts + ["lower is better"])
    for fig in figs:
        fig.add_annotation(
            text=text,
            xref='paper', yref='paper', x=1.0, y=1.06,
            xanchor='right', yanchor='bottom', showarrow=False,
            font=dict(size=11, color='gray'),
        )


def _build_temperature_figures(temp_sweep_data: pd.DataFrame) -> tuple:
    """
    Build E vs Temperature and tan-delta vs Temperature figures.

    Parameters:
        temp_sweep_data (pd.DataFrame): Frame with columns
            ['Temperature', "E'", "E''"]; extra columns are ignored.

    Returns:
        tuple: (fig4, fig41) where fig4 is the E' / E'' line plot in
        Temperature and fig41 is the E' / tan-delta line plot in Temperature.
    """
    df_melt = pd.melt(
        temp_sweep_data,
        id_vars=["Temperature"],
        value_vars=["E'", "E''"],
        var_name='Modulus',
        value_name="Young's Modulus (Pa)",
    )
    df_melt["Type"] = "Experiment"

    fig4 = px.line(
        df_melt, x="Temperature", y="Young's Modulus (Pa)",
        log_y=True,
        facet_col='Modulus',
        color="Type", line_dash="Type",
        labels={"Temperature": "Temperature (C)"},
    )

    df41_concat = df_melt.copy()
    df41_tand = pd.DataFrame()
    df41_tand["Temperature"] = df41_concat[df41_concat["Modulus"] == "E''"]["Temperature"]
    df41_tand["Type"] = df41_concat[df41_concat["Modulus"] == "E''"]["Type"]
    df41_tand["Young's Modulus (Pa)"] = (
        df41_concat[df41_concat["Modulus"] == "E''"]["Young's Modulus (Pa)"].to_numpy() /
        df41_concat[df41_concat["Modulus"] == "E'"]["Young's Modulus (Pa)"].to_numpy()
    )
    df41_tand['Modulus'] = 'tan delta'
    df41_concat = pd.concat([df41_concat, df41_tand], ignore_index=True)

    fig41 = px.line(
        df41_concat[df41_concat['Modulus'] != "E''"],
        x="Temperature", y="Young's Modulus (Pa)",
        facet_col='Modulus',
        color="Type", line_dash="Type",
        labels={"Temperature": "Temperature (C)"},
    )
    fig41.update_yaxes(matches=None, showticklabels=True)
    fig41.update_yaxes(type="log", col=1)
    fig4.update_yaxes(exponentformat='power')
    fig41.update_yaxes(exponentformat='power')
    return fig4, fig41


def _build_complex_figures(df: pd.DataFrame, tau_i: np.ndarray, E_i: np.ndarray,
                           N_nz: int) -> tuple:
    """
    Build E vs frequency and tan-delta vs frequency figures with Prony overlay.

    Parameters:
        df (pd.DataFrame): Experimental data with columns
            ['Frequency', 'E Storage', 'E Loss'].
        tau_i (numpy.ndarray): Prony relaxation times.
        E_i (numpy.ndarray): Prony coefficients (length tau_i or tau_i + 1).
        N_nz (int): Number of nonzero Prony coefficients; used in trace names.

    Returns:
        tuple: (fig1, fig11) where fig1 is E' / E'' vs Frequency and fig11 is
        E' / tan-delta vs Frequency.
    """
    complex_df = compute_complex(tau_i, E_i)
    x_col, y_col, z_col = df.columns[0], df.columns[1], df.columns[2]
    df_melt = pd.melt(
        df, id_vars=[x_col], value_vars=[y_col, z_col],
        var_name='Modulus', value_name="Young's Modulus (Pa)",
    )
    df_melt["Type"] = "Experiment"

    cx_x, cx_y, cx_z = complex_df.columns[0], complex_df.columns[1], complex_df.columns[2]
    complex_melt = pd.melt(
        complex_df, id_vars=[cx_x], value_vars=[cx_y, cx_z],
        var_name='Modulus', value_name="Young's Modulus (Pa)",
    )
    complex_melt["Type"] = f"{N_nz}-Term Prony"

    df_concat = pd.concat([df_melt, complex_melt], ignore_index=True)

    fig1 = px.line(
        df_concat, x=cx_x, y="Young's Modulus (Pa)",
        log_x=True, log_y=True,
        facet_col='Modulus',
        color="Type", line_dash="Type",
        line_dash_map={"Experiment": "solid", f"{N_nz}-Term Prony": "dash"},
        labels={"Frequency": "Frequency (Hz)"},
    )

    df11_concat = df_concat.copy()
    df11_tand = pd.DataFrame()
    df11_tand["Frequency"] = df11_concat[df11_concat["Modulus"] == "E Loss"]["Frequency"]
    df11_tand["Type"] = df11_concat[df11_concat["Modulus"] == "E Loss"]["Type"]
    df11_tand["Young's Modulus (Pa)"] = (
        df11_concat[df11_concat["Modulus"] == "E Loss"]["Young's Modulus (Pa)"].to_numpy() /
        df11_concat[df11_concat["Modulus"] == "E Storage"]["Young's Modulus (Pa)"].to_numpy()
    )
    df11_tand['Modulus'] = 'tan delta'
    df11_concat = pd.concat([df11_concat, df11_tand], ignore_index=True)

    fig11 = px.line(
        df11_concat[df11_concat['Modulus'] != "E Loss"],
        x="Frequency", y="Young's Modulus (Pa)",
        log_x=True,
        facet_col='Modulus',
        color="Type", line_dash="Type",
        line_dash_map={"Experiment": "solid", f"{N_nz}-Term Prony": "dash"},
        labels={"Frequency": "Frequency (Hz)"},
    )
    fig11.update_yaxes(matches=None, showticklabels=True)
    fig11.update_yaxes(type="log", col=1)
    for fig in (fig1, fig11):
        fig.update_xaxes(exponentformat='power')
        fig.update_yaxes(exponentformat='power')
    return fig1, fig11


def _build_relaxation_figures(tau_i: np.ndarray, E_i: np.ndarray, N_nz: int,
                              fit_settings: bool) -> tuple:
    """
    Build relaxation-modulus and discrete-spectrum figures.

    Parameters:
        tau_i (numpy.ndarray): Prony relaxation times.
        E_i (numpy.ndarray): Prony coefficients (length tau_i or tau_i + 1).
        N_nz (int): Number of nonzero Prony coefficients; used in trace names.
        fit_settings (bool): If True, overlay the basis scatter on the
            relaxation-modulus figure; if False, return only its line trace.

    Returns:
        tuple: (fig2, fig3) where fig2 is the time-domain relaxation modulus
        E(t) and fig3 is the discrete relaxation spectrum — the Prony
        coefficients as dots at (tau_i, E_i) with a horizontal reference line
        at the long-term (equilibrium) modulus when one is present.
    """
    relax = compute_relaxation_modulus(tau_i, E_i)
    relax["Type"] = f"{N_nz}-Term Prony"
    fig2a = px.line(
        relax, x="Time", y="E",
        log_x=True, log_y=True,
        color="Type", line_dash="Type",
        line_dash_map={"Basis": "solid", f"{N_nz}-Term Prony": "dash"},
        labels={"Time": "Time (s)", "E": "Relaxation Modulus (Pa)"},
    )
    fig2a.update_layout(
        autosize=False, width=800, height=450,
        margin=dict(l=80, r=60, t=60, b=80),
    )

    basis_df = pd.DataFrame({
        "Time": tau_i,
        "E": E_i[len(E_i) - len(tau_i):],
        "Type": f"{N_nz}-Term Basis",
    })
    fig2b = px.scatter(
        basis_df, x="Time", y="E",
        log_x=True, log_y=True,
        symbol="Type",
        labels={"Time": "Time (s)", "E": "Relaxation Modulus (Pa)"},
    )

    fig2 = go.Figure(data=fig2a.data + fig2b.data)
    fig2.update_xaxes(type="log")
    fig2.update_yaxes(type="log")
    fig2.update_layout(
        autosize=False, margin=dict(l=80, r=60, t=60, b=80),
        xaxis_title="Time (s)",
        yaxis_title="Relaxation Modulus (Pa)",
        legend_title="Type",
    )

    # fig3: the discrete relaxation spectrum — the fitted Prony coefficients
    # as dots at (tau_i, E_i) — with the equilibrium term, when present and
    # nonzero, drawn as a horizontal long-term-modulus reference line. Unlike
    # fig2's basis overlay this is the figure's primary content, so
    # fit_settings does not alter it.
    solid = len(E_i) != len(tau_i)
    # Count only the decaying terms: the equilibrium coefficient is split out
    # into its own long-term-modulus trace, so it must not inflate this label.
    N_decay = np.count_nonzero(E_i[solid:])
    spectrum_df = pd.DataFrame({
        "Time": tau_i,
        "E": E_i[solid:],
        "Type": f"{N_decay}-Term Prony",
    })
    fig3 = px.scatter(
        spectrum_df, x="Time", y="E",
        log_x=True, log_y=True,
        color="Type", symbol="Type",
        labels={"Time": "Relaxation Time, 𝜏 (s)", "E": "Prony Coefficient, Eᵢ (Pa)"},
    )
    if solid and E_i[0] > 0:
        fig3.add_trace(go.Scatter(
            x=[tau_i.min(), tau_i.max()],
            y=[E_i[0], E_i[0]],
            mode="lines",
            line=dict(dash="dash"),
            name="Long-Term Modulus",
        ))
    fig3.update_layout(
        autosize=False, margin=dict(l=80, r=60, t=60, b=80),
        legend_title="Type",
    )

    if not fit_settings:
        fig2 = fig2a

    for fig in (fig2, fig3):
        fig.update_xaxes(exponentformat='power')
        fig.update_yaxes(exponentformat='power')
    return fig2, fig3


def _build_coef_records(tau_i: np.ndarray, E_i: np.ndarray) -> list:
    """
    Build the Prony coefficient table as a list of records.

    Parameters:
        tau_i (numpy.ndarray): Prony relaxation times.
        E_i (numpy.ndarray): Prony coefficients (length tau_i or tau_i + 1).

    Returns:
        list: List of dicts with keys 'i', 'tau_i', 'E_i' — one per nonzero
        coefficient, with 'i' the original (pre-filter) index.
    """
    coef_df = pd.DataFrame({"tau_i": tau_i, "E_i": E_i[len(E_i) - len(tau_i):]})
    coef_df = coef_df[coef_df.E_i != 0].reset_index(drop=False)
    coef_df = coef_df.rename(columns={'index': 'i'})
    return coef_df.to_dict("records")


EXPECTED_DOMAIN_COLUMNS = {
    'frequency':   ('Frequency', 'E Storage', 'E Loss'),
    'temperature': ('Temperature', 'E Storage', 'E Loss'),
}


@log_errors
def update_line_chart(uploadData, number_of_prony, smoothness, fit_settings, domain,
                      Tg=None, C1=None, C2=None, Ea=None, TL=None, shift_model=None, shiftData=None,
                      relative_error=0.2):
    """
    Update the dynamfit figures and Prony coefficient table for an uploaded dataset.

    Parameters:
        uploadData (dict[str, np.ndarray]): Output of upload_init() for the
            chosen domain. Keys must be ('Frequency', 'E Storage', 'E Loss')
            for frequency domain or ('Temperature', 'E Storage', 'E Loss') for
            temperature domain.
        number_of_prony (int): Number of terms in the Prony series.
        smoothness (float): Smoothing regularization for the fit.
        fit_settings (bool): If True, overlay the basis scatter on the
            relaxation modulus and spectrum figures.
        domain (str): 'frequency' or 'temperature'.
        Tg, C1, C2, Ea, TL: Shift-model parameters. In the temperature domain
            they drive the temperature→frequency transform that feeds the Prony
            fit; in the frequency domain they (and shiftData) drive the
            frequency→temperature visualization only (manual/WLF; hybrid falls
            back to a universal-WLF view).
        shift_model (str): 'WLF', 'hybrid', 'manual', or 'none'/None for no
            transform at all. 'none' is not merely "no usable parameters" — it
            means the caller did not ask for a transform, and in the frequency
            domain it suppresses the temperature figures rather than falling
            back to the universal-WLF view.
        shiftData: Optional precomputed shift factors {'Temperature': ..., 'a_T': ...}.
            Supplying one counts as requesting a transform even under 'none'.

    Returns:
        fig1 (plotly.graph_objects.Figure): The line chart.
        fig11 (plotly.graph_objects.Figure): The updated line chart.
        fig2 (plotly.graph_objects.Figure): The scatter plot.
        fig3 (plotly.graph_objects.Figure): The updated scatter plot.
        fig4 (plotly.graph_objects.Figure): The temperature line chart. Empty in
            the frequency domain when no transform was requested (see shift_model).
        fig41 (plotly.graph_objects.Figure): The tandelta temperature updated line chart.
            Empty under the same condition as fig4.
        coef_df (List[Dict[str, Union[float, int]]]): The coefficients.

    Raises:
        ValueError: If the uploaded data is empty, contains non-finite values,
            has non-positive frequency values where positives are required, or
            has non-positive values in an optional error column.
        AssertionError: If domain or uploadData keys do not match the contract;
            this signals a server bug, not user-fixable input.

    Note:
        Uploads larger than _PLOT_MAX_POINTS rows have their experiment plot
        traces thinned (the Prony fit and coefficient table always use every
        row); affected figures carry an annotation stating the percentage
        dropped.
    """
    assert domain in EXPECTED_DOMAIN_COLUMNS, \
        f"Unknown domain {domain!r}; expected one of {list(EXPECTED_DOMAIN_COLUMNS)}."
    expected_cols = EXPECTED_DOMAIN_COLUMNS[domain]
    assert isinstance(uploadData, dict) and all(k in uploadData for k in expected_cols), \
        f"uploadData must contain {expected_cols} for domain {domain!r}; got " \
        f"{tuple(uploadData.keys()) if isinstance(uploadData, dict) else type(uploadData).__name__}."

    df = pd.DataFrame(uploadData)

    if len(df) == 0:
        raise ValueError("Uploaded file has no data rows.")
    if not np.all(np.isfinite(df.to_numpy())):
        raise ValueError(
            "Uploaded file contains non-finite values (NaN or Inf). "
            "Check for blank entries or text in numeric columns."
        )
    # Checked before the domain branch so it also fires on the temperature
    # preview path, which returns early below without ever reaching the fit.
    for col in ('Error', 'E Storage Error', 'E Loss Error'):
        if col in df.columns and np.any(df[col].to_numpy() <= 0):
            raise ValueError(
                f"All '{col}' values in the uploaded file must be positive. "
                "Error columns are absolute standard deviations in the same "
                "units as the moduli and are used as 1/sigma fit weights, so "
                "zero or negative entries are undefined."
            )

    if domain == "frequency":
        if np.any(df['Frequency'].to_numpy() <= 0):
            raise ValueError(
                "All Frequency values in the uploaded file must be positive. "
                "Remove rows with zero or negative frequencies."
            )
        freq_sweep_data = df.rename(columns={'E Storage': "E'", 'E Loss': "E''"})
        # Counterpart of the temperature branch's has_shift_params guard below,
        # but an *intent* test rather than a capability one. The forward
        # transform can genuinely fail, whereas tts_frequency_to_temperature_V2
        # never does — it degrades to a universal-WLF view — so without this gate
        # every frequency upload silently grew a temperature curve computed from
        # UNIVERSAL_WLF_* at VIS_REF_TEMPERATURE_C, constants that have nothing
        # to do with the uploaded material and that the user never chose.
        # The temperature axis is a transform of the upload, not the upload
        # itself, so it is only drawn when a transform was actually requested.
        if shift_model in (None, 'none') and shiftData is None:
            fig4 = go.Figure()
            fig41 = go.Figure()
        else:
            # A visualization only (the Prony fit below runs on the frequency
            # data directly), so this never blocks: an unusable shift model
            # degrades to a universal-WLF view inside V2.
            # TODO: hybrid still has no analytic inverse and falls back to
            # universal WLF; add a reverse-hybrid model when one becomes
            # available.
            temp_sweep_data = tts_frequency_to_temperature_V2(
                freq_sweep_data, shift_model,
                Tg=Tg, TL=TL, C1=C1, C2=C2, Ea=Ea, shiftData=shiftData,
            )
            plot_temp, temp_decimation = _decimate_for_plot(temp_sweep_data)
            fig4, fig41 = _build_temperature_figures(plot_temp)
            _annotate_decimation((fig4, fig41), temp_decimation)

    elif domain == "temperature":
        temp_sweep_data = df.rename(columns={'E Storage': "E'", 'E Loss': "E''"})
        plot_temp, temp_decimation = _decimate_for_plot(temp_sweep_data)
        fig4, fig41 = _build_temperature_figures(plot_temp)
        _annotate_decimation((fig4, fig41), temp_decimation)

        # `is not None` rather than truthy checks: Tg = 0 °C is a valid
        # reference, and the route default-fills numeric estimates that may
        # legitimately be zero. Tg is required only for WLF (used as T_ref);
        # hybrid_shift uses TL as the WLF/Arrhenius crossover and never reads Tg.
        has_shift_params = (
            shiftData is not None
            or (shift_model == "WLF"
                and Tg is not None and C1 is not None and C2 is not None)
            or (shift_model == "hybrid"
                and TL is not None and C1 is not None and C2 is not None
                and Ea is not None)
        )
        if not has_shift_params:
            # No way to bring temperature data onto a master curve, so the
            # frequency-domain figures and coefficient table are not produced.
            empty = go.Figure()
            return (
                empty, empty, empty, empty, fig4, fig41,
                pd.DataFrame(columns=["tau_i", "E_i"]).to_dict("records"),
            )

        freq_sweep_data = tts_temperature_to_frequency_V2(
            temp_sweep_data, shift_model,
            Tg=Tg, TL=TL, C1=C1, C2=C2, Ea=Ea, shiftData=shiftData,
        )
        df = freq_sweep_data.rename(
            columns={"E'": 'E Storage', "E''": 'E Loss'},
        )

    E_stor_arr = df['E Storage'].to_numpy()
    E_loss_arr = df['E Loss'].to_numpy()
    if 'E Storage Error' in df.columns and 'E Loss Error' in df.columns:
        E_stor_std = df['E Storage Error'].to_numpy()
        E_loss_std = df['E Loss Error'].to_numpy()
    elif 'Error' in df.columns:
        E_stor_std = df['Error'].to_numpy()
        E_loss_std = E_stor_std
    else:
        E_stor_std = np.abs(E_stor_arr + 1.0j * E_loss_arr) * relative_error
        E_loss_std = E_stor_std
    tau_i, E_i, fit_quality = smooth_prony_fit(
        omega=df['Frequency'].to_numpy(),
        E_stor=E_stor_arr,
        E_loss=E_loss_arr,
        E_stor_std=E_stor_std,
        E_loss_std=E_loss_std,
        N=number_of_prony, smoothness=smoothness,
        return_fit_quality=True,
    )
    N_nz = np.count_nonzero(E_i)

    # Downstream figure builders assume df's first three columns are
    # exactly (Frequency, E Storage, E Loss); drop any extras now that
    # the std arrays have been pulled out. The plot frame may be thinned
    # (figures only — the fit above already consumed every row).
    df = df[['Frequency', 'E Storage', 'E Loss']]
    plot_df, freq_decimation = _decimate_for_plot(df)
    fig1, fig11 = _build_complex_figures(plot_df, tau_i, E_i, N_nz)
    _annotate_decimation((fig1, fig11), freq_decimation)
    _annotate_fit_quality((fig1, fig11), fit_quality)
    fig2, fig3 = _build_relaxation_figures(tau_i, E_i, N_nz, fit_settings)
    coef_records = _build_coef_records(tau_i, E_i)

    return fig1, fig11, fig2, fig3, fig4, fig41, coef_records
