"""
The penalized loss the smoothed Prony fit minimizes, and the curvature
quantities its penalty is built from.

Kept in one module because the smoothness penalty and the reported curvature
must agree on what "roughness of the log spectrum" means: `_log_curvature` is
the single definition both `_prony_objective` (which squares it into the loss)
and `quality._prony_fit_quality` (which reports it) go through.

Depends on nothing else in the package — `quality` and `fit` both import from
here, so keeping it a leaf is what keeps those two acyclic.
"""

import numpy as np


# Second-difference stencil behind the smoothness penalty: the np.diff(..., n=2)
# weights in _prony_objective, and the outer product that builds lam * L.T @ L
# in _prony_fit_quality.
_D2_STENCIL = (1.0, -2.0, 1.0)


def _log_curvature(logcoefs: np.ndarray, solid: bool) -> np.ndarray:
    """
    Second differences of the penalized log-coefficients.

    The vector behind both the smoothness penalty and the reported curvature —
    one definition so the two cannot drift apart. np.diff degrades to an empty
    array rather than raising when there are fewer than three penalized terms,
    so len() of the result doubles as the "is a second difference even defined
    here" test.

    Parameters:
        logcoefs (numpy.ndarray): 1-D array of log-coefficients.
        solid (bool): Whether the leading coefficient is an unpenalized
            equilibrium term to exclude.

    Returns:
        numpy.ndarray: 1-D array of length max(0, len(logcoefs) - solid - 2).
    """
    return np.diff(logcoefs[solid:], n=2)


def _mean_sq_curvature(curve: np.ndarray, npen: int, log_range: float):
    """
    Mean squared curvature of the log spectrum, d2(lnE)/d(ln tau)**2.

    Converts the raw second differences into the mesh-independent quantity they
    approximate. A second difference is h**2 * H'' + O(h**4) for grid spacing
    h = log_range / (npen - 1), and averaging over the span costs another h, so

        mean(H''**2) = sum(d2H)**2 / (h**3 * log_range)

    Reporting that rather than sum(d2H)**2 / (npen - 2) is what makes the number
    comparable across N and across crops of the same data: sampling one fixed
    spectrum more finely shrinks every second difference, so the per-term mean
    falls ~90x over a 10x change in N where this moves ~1.2x.

    Parameters:
        curve (numpy.ndarray): Second differences from _log_curvature.
        npen (int): Number of penalized terms, i.e. len(logcoefs) - solid.
        log_range (float): ln(tau_max / tau_min) of the fit grid.

    Returns:
        float or None: None when fewer than 3 penalized terms leave no second
        difference to take, or when the span is degenerate.
    """
    if not len(curve) or log_range <= 0:
        return None
    return curve @ curve * (npen - 1) ** 3 / log_range ** 4


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
        curve = smoothness * _log_curvature(logcoefs, solid)
        loss += curve @ curve

    grad = -(basis.T @ resid)

    # apply chain rule because these are functions of
    # coefs rather than logcoefs
    grad *= coefs

    if smoothness:
        diffs = smoothness * curve  # smoothness**2 * _log_curvature(...)
        grad_slice = grad[solid:]
        grad_slice[:-2] += diffs
        grad_slice[1:-1] -= 2 * diffs
        grad_slice[2:] += diffs

    return loss, 2 * grad  # more chain rule (squared errors)


def _scaled_smoothness(smoothness: float, npen: int, dof: int,
                       log_range: float) -> float:
    """
    Turn the user-facing smoothness knob into the penalty weight actually used.

    Makes the knob mean the same thing on any upload. The data term sums over
    n_resid residuals while the penalty sums over npen - 2 second differences,
    so both need normalizing, and the penalty needs more care than it looks:

      * dof, because the data term grows with the row count. Without this a
        41k-row broadband file needed ~100x the smoothness a 400-row file needs
        for the same effect.
      * 1/h**3, because a second difference is NOT a second derivative. On a
        log-tau grid of spacing h, d2H = h**2 * H'' + O(h**4), and turning the
        sum into an integral costs another h, so sum(d2H)**2 ~ h**3 *
        integral(H''**2). That hidden h**3 ~ npen**-3 is why an uncorrected
        weight silently weakens as terms are added: the recovered spectrum was
        measured to get 18x rougher going from N=23 to N=100 at a fixed knob
        setting, i.e. N was a second, undocumented smoothness control. With the
        correction it moves 1.2x.

    The pair gives V/dof = chi2_reduced + smoothness**2 * (log_range *
    curvature), so smoothness**2 is exactly the exchange rate between the two
    numbers the fit-quality readout puts on the plot. Note that when N is chosen
    per decade of span, h is constant and this reduces to a pure rescaling of
    the older dof-only normalization; the 1/h**3 only does work when N is
    overridden independently of the span.

    Lives here rather than inline in smooth_prony_fit because _prony_fit_quality
    has to charge the Laplace expansion the SAME weight the fit was run with,
    and it can rebuild that weight from arguments it already takes. One formula,
    so a score cannot come to belong to a different fit than the one that ran.

    Parameters:
        smoothness (float): The user-facing knob. 0 disables the penalty.
        npen (int): Number of penalized terms, i.e. the grid size N.
        dof (int): Residual degrees of freedom of the full problem, n_resid - m.
        log_range (float): ln(tau_max / tau_min) of the fit grid.

    Returns:
        float: The weight to hand _prony_objective. Falls back to smoothness
        unchanged when fewer than 3 penalized terms leave np.diff(..., n=2)
        empty, or when a degenerate span leaves h undefined; the penalty term
        is identically zero either way, so any finite weight does, and this
        avoids a zero division.
    """
    if npen < 3 or log_range <= 0:
        return smoothness
    h = log_range / (npen - 1)
    return smoothness * np.sqrt(max(dof, 1) / h ** 3)
