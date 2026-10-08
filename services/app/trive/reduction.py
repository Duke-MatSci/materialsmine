"""
The chunked QR reduction that makes the fit's cost independent of upload size,
and the content-addressed LRU cache that lets a slider sweep reuse it.

This is the module the fit's performance rests on: it turns an
O(rows) x O(N) weighted least-squares problem into an (N + 2) x (N + 1)
triangle, exactly. See `_prony_reduce` for why the residual row is kept, and the
project README/CLAUDE notes for the benchmark that says not to "simplify" it
away.

`prony_rank_limit` reuses the reduction on a fixed probe grid to count the
relaxation terms the data's window can resolve.
"""

import hashlib
from collections import OrderedDict

import numpy as np
from scipy.linalg import cho_solve, qr
from scipy.optimize import nnls

from .objective import (
    _add_penalty_inplace, _penalty_trace, _scaled_smoothness)
from .prony import PRONY_TERMS_MAX, prony_basis, prony_relaxation_space
from .quality import _cholesky_or_none


# Frequency points per block in smooth_prony_fit's chunked QR reduction. Each
# block is factored in one preallocated (N + 2 + 2 * chunk, N + 2) buffer
# (plus prony_basis's slab and its reciprocal temporary), so peak memory is
# O(chunk * N) no matter how many
# rows the upload has.
_QR_CHUNK_ROWS = 8192

# Reduced systems retained by _prony_reduce's LRU cache. Each entry holds only
# the (m + 1) x (m + 1) triangle — at most ~102 x 102 for a fit, since the route
# caps N at 100, and 110 x 110 for prony_rank_limit's probe — so the cache
# stays tiny no matter how large the uploads that produced it.
# Sized for a smoothness sweep, which varies only `smoothness` and can reuse one
# reduction throughout; each dataset occupies two slots, its fit grid and the
# rank probe.
_REDUCE_CACHE_SIZE = 4


# Relaxation times on prony_rank_limit's probe grid: a few more than the route
# accepts, so a rank at the route maximum is measured rather than imposed.
_RANK_PROBE_TERMS = PRONY_TERMS_MAX + 8


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
        std_scale: float = 1.0,
) -> tuple:
    """
    Compress the weighted least-squares problem by a chunked QR factorization.

    Maintains the triangular augmented system [R | z] and folds each weighted
    basis block into it, so that EXACTLY
        ||(y - B c) / (std_scale * std)||^2 = ||R c - z||^2
    and the reduced system has at most len(tau_i) + solid + 1 rows regardless of
    how many data rows the upload carries. Householder QR (scipy, in place in
    one buffer) accumulates the residual
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

    std_scale is a UNIFORM multiplier on both std arrays, held out of the QR and
    out of the cache key: R and z are proportional to 1/std, so it divides back
    out of the (m + 1) x (m + 1) result and the O(rows) pass never sees it. That
    is what makes the relative-error widget cheap — varying only this factor
    reuses one reduction. It divides on every call, so hits and misses match.

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
        std_scale (float): Uniform positive multiplier on both std arrays, kept
            out of the reduction and divided out of the result.

    Returns:
        tuple: (R, z), the reduced design matrix and target. The equality above
        is exact with no correction term to carry: see the comment on the
        residual row below. Both are fresh arrays scaled from the read-only
        cache entry, so a consumer that wrote to them could not poison it.
    """
    key = _reduce_cache_key(
        (omega, E_stor, E_loss, E_stor_std, E_loss_std, tau_i), solid
    )
    hit = _REDUCE_CACHE.get(key)
    if hit is not None:
        _REDUCE_CACHE.move_to_end(key)
        return hit[0] / std_scale, hit[1] / std_scale

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
    # One F-ordered buffer holds the stacked [Rz; weighted chunk] system;
    # scipy's qr factors it in place and the new triangle is written back to
    # its top rows for the next chunk. r counts the triangle's rows.
    n_chunk = min(_QR_CHUNK_ROWS, len(omega))
    buf = np.empty((m + 1 + 2 * n_chunk, m + 1), order='F')
    r = 0
    for start in range(0, len(omega), _QR_CHUNK_ROWS):
        chunk = slice(start, start + _QR_CHUNK_ROWS)
        n = len(omega[chunk])
        rows = slice(r, r + 2 * n)
        buf[rows, :m] = prony_basis(omega[chunk], tau_i, solid)
        buf[r:r + n, m] = E_stor[chunk]
        buf[r + n:r + 2 * n, m] = E_loss[chunk]
        y_std = np.concatenate((E_stor_std[chunk], E_loss_std[chunk]))
        buf[rows] /= y_std[:, None]
        tri, = qr(buf[:r + 2 * n], mode='r', overwrite_a=True,
                  check_finite=False)
        r = min(r + 2 * n, m + 1)
        buf[:r] = tri[:r]
    Rz = buf[:r].copy()
    Rz.flags.writeable = False
    reduced = (Rz[:, :m], Rz[:, m])

    _REDUCE_CACHE[key] = reduced
    if len(_REDUCE_CACHE) > _REDUCE_CACHE_SIZE:
        _REDUCE_CACHE.popitem(last=False)
    return reduced[0] / std_scale, reduced[1] / std_scale


def _probe_reduce(omega, E_stor, E_loss, E_stor_std, E_loss_std, solid,
                  std_scale):
    """
    The probe grid (_RANK_PROBE_TERMS log-spaced tau over the data window)
    and its reduction. Shared so every probe consumer hits one cache entry.

    Returns:
        tuple: (tau_probe, R, z) as _prony_reduce returns R and z.
    """
    tau = prony_relaxation_space(
        1 / np.max(omega), 1 / np.min(omega), _RANK_PROBE_TERMS)
    R, z = _prony_reduce(omega, E_stor, E_loss, E_stor_std, E_loss_std,
                         tau, solid, std_scale)
    return tau, R, z


def _probe_singular_values(omega, E_stor, E_loss, E_stor_std, E_loss_std,
                           solid, std_scale):
    """Singular values of the reduced probe basis, descending."""
    _, R, _ = _probe_reduce(omega, E_stor, E_loss, E_stor_std, E_loss_std,
                            solid, std_scale)
    return np.linalg.svd(R, compute_uv=False)


def prony_rank_limit(
        omega: np.ndarray,
        E_stor: np.ndarray,
        E_loss: np.ndarray,
        E_stor_std: np.ndarray,
        E_loss_std: np.ndarray,
        solid: bool = True,
        std_scale: float = 1.0,
) -> int:
    """
    The number of relaxation terms this dataset's Prony basis can carry.

    Counts the singular values of the reduced probe basis (a fixed grid of
    _RANK_PROBE_TERMS times over the data's window) above sqrt(eps) of the
    largest. The fit factors the Gram, whose eigenvalues are the squared
    singular values, so sqrt(eps) on the basis is eps on the Gram: terms past
    this rank are redundant columns only the smoothing fills. Advisory only.

    Parameters:
        omega, E_stor, E_loss, E_stor_std, E_loss_std (numpy.ndarray): the
            data and per-point standard deviations, as the fit receives them.
        solid (bool): Whether an equilibrium term is included; its column is
            not a relaxation term and is not counted.
        std_scale (float): Uniform multiplier on both std arrays; it scales
            every singular value alike, so it cannot change the count.

    Returns:
        int: the rank, clipped to [1, PRONY_TERMS_MAX].
    """
    sigma = _probe_singular_values(omega, E_stor, E_loss, E_stor_std,
                                   E_loss_std, solid, std_scale)
    eps = np.finfo(np.result_type(E_stor, E_loss)).eps
    rank = int(np.count_nonzero(sigma > np.sqrt(eps) * sigma[0])) - bool(solid)
    return min(max(rank, 1), PRONY_TERMS_MAX)


def prony_noise_ceiling(
        omega: np.ndarray,
        E_stor: np.ndarray,
        E_loss: np.ndarray,
        E_stor_std: np.ndarray,
        E_loss_std: np.ndarray,
        solid: bool = True,
        std_scale: float = 1.0,
) -> int:
    """
    Probe singular directions the stated error determines to better than the
    modulus scale: sigma_k * max(E_stor) > 1. A smoothness-free ceiling on
    what any smoothed fit can leave to the data.

    Not sent to the client. Its one use is as an empirical consistency bound:
    the tests assert that prony_resolution and the fit's effective_terms
    never exceed it on the bundled curves. That is observed, not a theorem.

    Parameters:
        As prony_rank_limit.

    Returns:
        int: the count, unclipped, equilibrium column included.
    """
    sigma = _probe_singular_values(omega, E_stor, E_loss, E_stor_std,
                                   E_loss_std, solid, std_scale)
    return int(np.count_nonzero(sigma * np.max(E_stor) > 1.0))


def prony_resolution(
        omega: np.ndarray,
        E_stor: np.ndarray,
        E_loss: np.ndarray,
        E_stor_std: np.ndarray,
        E_loss_std: np.ndarray,
        tau_i: np.ndarray,
        E_i: np.ndarray,
        smoothness: float,
        solid: bool = True,
        std_scale: float = 1.0,
):
    """
    How many relaxation terms a dense grid would resolve at this smoothing.

    With smoothness 0 this is the NNLS active-set size on the probe grid.
    Otherwise it is the effective parameter count
    gamma = N_probe - lam * tr(L.T L inv(H)) of the smoothed problem
    linearized at the given fit, its spectrum resampled onto the probe grid.
    The fit's own effective count is bounded by its term count; this one is
    not, so it can say when the data supports more terms than were asked for.

    Parameters:
        omega, E_stor, E_loss, E_stor_std, E_loss_std (numpy.ndarray): the
            data and per-point standard deviations, as the fit receives them.
        tau_i (numpy.ndarray): The fit's relaxation grid, ascending.
        E_i (numpy.ndarray): The fitted coefficients, equilibrium first when
            solid.
        smoothness (float): The knob the fit ran with.
        solid (bool): Whether the fit carried an equilibrium term.
        std_scale (float): As passed to smooth_prony_fit.

    Returns:
        float or None: the resolution in terms; None when it is undefined
        (fewer than two fit nodes, non-positive coefficients, or a probe
        Hessian that is not positive definite).
    """
    tau_probe, R, z = _probe_reduce(omega, E_stor, E_loss, E_stor_std,
                                    E_loss_std, solid, std_scale)
    n_probe = len(tau_probe)
    if not smoothness:
        coefs, _ = nnls(R, z)
        return float(np.count_nonzero(coefs[int(solid):] > 0))

    if len(tau_i) < 2:
        return None
    E_dec = np.asarray(E_i)[len(E_i) - len(tau_i):]
    if not (np.all(np.isfinite(E_dec)) and np.all(E_dec > 0)):
        return None
    m_probe = n_probe + solid
    R = R[:m_probe]
    log_tau_fit, log_tau_probe = np.log(tau_i), np.log(tau_probe)
    h_fit = (log_tau_fit[-1] - log_tau_fit[0]) / (len(tau_i) - 1)
    h_probe = (log_tau_probe[-1] - log_tau_probe[0]) / (n_probe - 1)
    # Coefficient per node tracks node spacing, preserving the summed modulus.
    c = np.exp(np.interp(log_tau_probe, log_tau_fit, np.log(E_dec))
               + np.log(h_probe / h_fit))
    has_eq = bool(solid and len(E_i) == len(tau_i) + 1 and E_i[0] > 0)
    if has_eq:
        c = np.concatenate(([E_i[0]], c))
    elif solid:
        R = R[:, 1:]
    log_range = log_tau_probe[-1] - log_tau_probe[0]
    lam = _scaled_smoothness(
        smoothness, n_probe, 2 * len(omega) - m_probe, log_range) ** 2
    # Gauss-Newton block of the log-parameterized Hessian, J = R diag(c).
    H = (R.T @ R) * c * c[:, None]
    _add_penalty_inplace(H, lam, has_eq)
    chol = _cholesky_or_none(H)
    if chol is None:
        return None
    H_inv = cho_solve((chol, True), np.eye(len(c)))
    gamma = n_probe - lam * _penalty_trace(H_inv, has_eq)
    return float(gamma) if np.isfinite(gamma) else None
