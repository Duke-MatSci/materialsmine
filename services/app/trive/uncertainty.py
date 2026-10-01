"""
1-sigma bands for a fitted Prony series, by the delta method.

Every function takes the fit's (tau_i, E_i) and the covariance of the
log-coefficients that quality._FitQuality reports. The results are +-1 sigma
credible intervals of the Laplace posterior, conditional on the stated errors
and the smoothness setting; the bias smoothing itself introduces is not
included.

complex_modulus_noise is the exception: it takes the measurement error the
fit ran with instead of the covariance, and adds in quadrature to
complex_modulus_sigma to give a +-1 sigma prediction band.

Shapes: E_i has len(tau_i) entries, or len(tau_i) + 1 with the equilibrium
modulus first. The covariance is square with len(tau_i) rows, or
len(tau_i) + 1 rows only when E_i carries the equilibrium term. An E_i of
N + 1 entries with an (N, N) covariance (the clamped-equilibrium fit) draws
the curve from every coefficient and propagates the decaying terms only.
"""

import numpy as np

from .prony import prony_basis

# Ceiling on a displayed log-sigma: six decades either way.
_SIGMA_DISPLAY_CAP = float(np.log(1e6))


def _check_shapes(tau_i: np.ndarray, E_i: np.ndarray, covariance: np.ndarray):
    """
    Validate the shape contract in the module docstring.

    Returns:
        bool: Whether E_i carries the equilibrium term.
    """
    N = len(tau_i)
    if len(E_i) not in (N, N + 1):
        raise ValueError(
            f"E_i has {len(E_i)} entries; expected {N} or {N + 1}")
    solid = len(E_i) == N + 1
    rows = covariance.shape[0] if covariance.ndim == 2 else -1
    if covariance.ndim != 2 or covariance.shape[1] != rows:
        raise ValueError("covariance must be a square 2-D array")
    if rows != N and not (solid and rows == N + 1):
        raise ValueError(
            f"covariance has {rows} rows; does not match {len(E_i)} "
            f"coefficients on {N} relaxation times")
    return solid


def _sigma(G: np.ndarray, covariance: np.ndarray) -> np.ndarray:
    """sqrt(g @ covariance @ g) for each row g of G, roundoff clipped at 0."""
    var = np.einsum('ij,ij->i', G @ covariance, G)
    return np.sqrt(np.clip(var, 0.0, None))


def sigma_log_coefficients(covariance: np.ndarray) -> np.ndarray:
    """
    1-sigma of each log-coefficient, uncapped, in the covariance's row order.

    Parameters:
        covariance (numpy.ndarray): Covariance of the log-coefficients.

    Returns:
        numpy.ndarray: sqrt of the diagonal.
    """
    return np.sqrt(np.diag(covariance))


def spectrum_error_bars(E_terms, sigma_log, cap=_SIGMA_DISPLAY_CAP):
    """
    Linear error-bar offsets for coefficients with a log-normal 1-sigma.

    The interval [E exp(-s), E exp(s)] as offsets from E, with s capped so
    the upper edge stays finite and the lower edge above zero.

    Parameters:
        E_terms (numpy.ndarray): The coefficients.
        sigma_log (numpy.ndarray): 1-sigma of their logarithms.
        cap (float): Ceiling applied to sigma_log before exponentiating.

    Returns:
        tuple: (plus, minus), both non-negative arrays.
    """
    E_terms = np.asarray(E_terms, dtype=float)
    s = np.minimum(np.asarray(sigma_log, dtype=float), cap)
    return E_terms * np.expm1(s), E_terms * -np.expm1(-s)


def complex_modulus_sigma(omega, tau_i, E_i, covariance) -> dict:
    """
    1-sigma of E', E'' and tan delta over omega.

    With x = log(E_i), dy/dx_j = b_j E_j for basis column b_j. tan delta is
    propagated through the ratio directly, g'' / E' - (E'' / E'^2) g', so it
    accounts for the coefficients E' and E'' share.

    Parameters:
        omega (numpy.ndarray): Angular frequencies.
        tau_i (numpy.ndarray): Relaxation times.
        E_i (numpy.ndarray): Coefficients, equilibrium first if present.
        covariance (numpy.ndarray): Covariance of the log-coefficients.

    Returns:
        dict: 'E Storage', 'E Loss' and 'tan delta', each an array over omega.
    """
    omega, tau_i = np.asarray(omega, float), np.asarray(tau_i, float)
    E_i, covariance = np.asarray(E_i, float), np.asarray(covariance, float)
    solid = _check_shapes(tau_i, E_i, covariance)
    basis = prony_basis(omega, tau_i, solid)
    n = len(omega)
    curve = basis @ E_i
    G = basis * E_i
    # Clamped equilibrium: the covariance covers the decaying terms only.
    G = G[:, G.shape[1] - covariance.shape[0]:]
    stor, loss = curve[:n], curve[n:]
    G_tan = G[n:] / stor[:, None] - (loss / stor ** 2)[:, None] * G[:n]
    return {
        'E Storage': _sigma(G[:n], covariance),
        'E Loss': _sigma(G[n:], covariance),
        'tan delta': _sigma(G_tan, covariance),
    }


def complex_modulus_noise(omega, tau_i, E_i, omega_data, rel_stor,
                          rel_loss) -> dict:
    """
    1-sigma measurement noise of E', E'' and tan delta over omega.

    The relative error profile (sigma / |E*| at omega_data) is interpolated
    linearly in log-frequency, held at its edge values outside the data, and
    scaled by the fitted |E*| at omega. tan delta treats the E' and E''
    errors as independent.

    Parameters:
        omega (numpy.ndarray): Angular frequencies to evaluate at.
        tau_i (numpy.ndarray): Relaxation times.
        E_i (numpy.ndarray): Coefficients, equilibrium first if present.
        omega_data (numpy.ndarray): Measured frequencies, in any order.
        rel_stor (numpy.ndarray): Relative E' error at omega_data.
        rel_loss (numpy.ndarray): Relative E'' error at omega_data.

    Returns:
        dict: 'E Storage', 'E Loss' and 'tan delta', each an array over omega.
    """
    omega, tau_i = np.asarray(omega, float), np.asarray(tau_i, float)
    E_i = np.asarray(E_i, float)
    omega_data = np.asarray(omega_data, float)
    order = np.argsort(omega_data)
    log_data = np.log(omega_data[order])
    log_omega = np.log(omega)
    n = len(omega)
    curve = prony_basis(omega, tau_i, len(E_i) == len(tau_i) + 1) @ E_i
    stor, loss = curve[:n], curve[n:]
    mag = np.hypot(stor, loss)
    s_stor = mag * np.interp(log_omega, log_data,
                             np.asarray(rel_stor, float)[order])
    s_loss = mag * np.interp(log_omega, log_data,
                             np.asarray(rel_loss, float)[order])
    return {
        'E Storage': s_stor,
        'E Loss': s_loss,
        'tan delta': np.hypot(s_loss / stor, loss * s_stor / stor ** 2),
    }


def relaxation_sigma(t, tau_i, E_i, covariance) -> np.ndarray:
    """
    1-sigma of the decaying part of E(t) = sum_i E_i exp(-t / tau_i).

    An equilibrium row in the covariance is dropped; marginalizing a Gaussian
    is exactly that.

    Parameters:
        t (numpy.ndarray): Times.
        tau_i (numpy.ndarray): Relaxation times.
        E_i (numpy.ndarray): Coefficients, equilibrium first if present.
        covariance (numpy.ndarray): Covariance of the log-coefficients.

    Returns:
        numpy.ndarray: 1-sigma over t.
    """
    t, tau_i = np.asarray(t, float), np.asarray(tau_i, float)
    E_i, covariance = np.asarray(E_i, float), np.asarray(covariance, float)
    _check_shapes(tau_i, E_i, covariance)
    N = len(tau_i)
    G = np.exp(-np.outer(t, 1 / tau_i)) * E_i[-N:]
    return _sigma(G, covariance[-N:, -N:])
