"""
The chunked QR reduction that makes the fit's cost independent of upload size,
and the content-addressed LRU cache that lets a slider sweep reuse it.

This is the module the fit's performance rests on: it turns an
O(rows) x O(N) weighted least-squares problem into an (N + 2) x (N + 1)
triangle, exactly. See `_prony_reduce` for why the residual row is kept, and the
project README/CLAUDE notes for the benchmark that says not to "simplify" it
away.
"""

import hashlib
from collections import OrderedDict

import numpy as np

from .prony import prony_basis


# Frequency points per block in smooth_prony_fit's chunked QR reduction. Each
# block materializes a (2 * chunk, N + 2) basis slab (plus prony_basis's single
# reciprocal temporary), so peak memory is O(chunk * N) no matter how many
# rows the upload has.
_QR_CHUNK_ROWS = 8192

# Reduced systems retained by _prony_reduce's LRU cache. Each entry holds only
# the (m + 1) x (m + 1) triangle — at most ~102 x 102, since the route caps N at
# 100 — so the cache stays tiny no matter how large the uploads that produced it.
# Sized for a smoothness sweep, which varies only `smoothness` and can reuse one
# reduction throughout.
_REDUCE_CACHE_SIZE = 4


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
    return reduced[0] / std_scale, reduced[1] / std_scale
