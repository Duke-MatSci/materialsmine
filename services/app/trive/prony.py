"""
The Prony series itself: the basis matrix, the relaxation-time grid, and the
forward evaluations of the model on a fresh grid.

Everything here is a pure function of (tau_i, E_i) — no fitting, no caching, no
plotting. `fit` produces the coefficients these functions consume; `figures`
turns their output into traces.
"""

import numpy as np
import pandas as pd


# Sizing rule for an auto-chosen Prony series, mirroring the frontend's
# useDynamfitDefaults (PRONY_TERMS_PER_DECADE / PRONY_TERMS_MIN / _MAX), which
# applies it to the first column of a frequency-domain upload. The two copies
# run on different inputs — the raw column there, the transformed master curve
# here — and neither can import the other, so they are kept in step by eye.
PRONY_TERMS_PER_DECADE = 3
PRONY_TERMS_MIN = 5
PRONY_TERMS_MAX = 100


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

    # Bases are dt²/(1+dt²) and dt/(1+dt²) in the dimensionless time dt = ωτ.
    # Forming dt² directly overflows to inf → NaN for large ωτ, so use the
    # algebraically identical reciprocal forms, which stay finite for every
    # input — including dt = 0, where 1/dt is inf and each outer reciprocal
    # carries it to the right limit:
    #     ep  = 1 / (1 + (1/dt)²)     dt=0 → 1/(1+inf) = 0,  dt→∞ → 1
    #     epp = 1 / (dt + 1/dt)       dt=0 → 1/inf     = 0,  dt→∞ → 0
    # errstate discards the inf from 1/0 and the overflow in (1/dt)². (The one
    # place this parts company with the direct form is |dt| < ~1e-308, where
    # 1/dt overflows and epp lands on 0 instead of a subnormal ~dt — the ~300
    # decades of frequency range that would take are unreachable, and the error
    # is 1e-308 absolute either way.)
    #
    # This is the hot loop of the whole fit — profiled at ~45% of _prony_reduce
    # on a 41k-row upload — so the two blocks are written straight into the
    # output, one temporary, no np.where (which evaluates both branches over the
    # full grid) and no concatenate. Measured 2-3.6x the previous form.
    n, k = len(freq), len(relaxations)
    basis = np.empty((2 * n, k + solid))
    ep_basis = basis[:n, solid:]
    epp_basis = basis[n:, solid:]
    np.multiply.outer(freq, relaxations, out=ep_basis)  # ep_basis <- dt
    with np.errstate(over='ignore', invalid='ignore', divide='ignore'):
        inv = np.reciprocal(ep_basis)          # 1/dt, inf where dt == 0
        np.add(ep_basis, inv, out=epp_basis)   # dt + 1/dt
        np.reciprocal(epp_basis, out=epp_basis)
        np.multiply(inv, inv, out=inv)         # (1/dt)²
        np.add(inv, 1.0, out=inv)
        np.reciprocal(inv, out=ep_basis)       # dt's last reader is the np.add above

    if solid:
        # Equilibrium modulus: ones on the storage block, zeros on the loss block.
        basis[:n, 0] = 1.0
        basis[n:, 0] = 0.0

    return basis


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


def prony_terms_for_span(omega: np.ndarray) -> int:
    """
    Size a Prony series to the frequency span and row count it will be fitted to.

    A fixed number of terms per decade, then two ceilings. PRONY_TERMS_MAX is
    the route's own limit; the other is that the series must never carry more
    parameters than the data has complex points — m = N + 1 (the equilibrium
    term) may not exceed len(omega). That second cap is what keeps the fit-
    quality readout alive: chi-squared is reported per degree of freedom
    nu = 2 * len(omega) - m, so an N chosen without reference to the row count
    can drive nu to zero and _prony_fit_quality then has no misfit to return
    (see its Returns section). At the cap, nu = len(omega) - 1.

    Parameters:
        omega (numpy.ndarray): 1-D array of frequencies the fit will see, i.e.
            the master curve AFTER any temperature -> frequency transform.

    Returns:
        int: Number of Prony terms, at least 1. A degenerate span (a single
        distinct frequency) yields PRONY_TERMS_MIN before the caps, since there
        are no decades to count but the caller still needs a usable grid.
    """
    decades = np.log10(np.max(omega) / np.min(omega))
    if np.isfinite(decades) and decades > 0:
        terms = round(PRONY_TERMS_PER_DECADE * decades)
    else:
        terms = PRONY_TERMS_MIN
    ceiling = min(PRONY_TERMS_MAX, len(omega) - 1)
    # np.clip applies the lower bound first, so the ceiling wins outright when a
    # very short upload puts it below PRONY_TERMS_MIN — which is the point: the
    # row count is a hard limit, the floor only a preference. max(1, ...) keeps
    # prony_relaxation_space from being handed an empty grid on a 1-row file.
    return max(1, int(np.clip(terms, PRONY_TERMS_MIN, ceiling)))


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
