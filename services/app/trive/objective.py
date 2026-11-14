"""
The penalized loss the smoothed Prony fit minimizes, and the curvature
quantities its penalty is built from.

Kept in one module because the smoothness penalty and the reported curvature
must agree on what "roughness of the log spectrum" means: `_log_curvature` is
the single definition both `_prony_objective` (which squares it into the loss)
and `quality._prony_fit_quality` (which reports it) go through. Likewise
`_PronyLoss.hess` is the one second derivative, used both by the Newton solver
in `fit` and inside the Laplace determinant in `quality`.

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


class _PronyLoss:
    """
    The penalized Prony loss with its gradient and Hessian, sharing one
    evaluation of the common intermediates.

    scipy.optimize.minimize takes fun, jac and hess as separate callables and
    calls all three at every accepted point. Computing them independently
    would redo exp(logcoefs), the model, the residual and r.T @ J — everything
    but the final assembly — and rebuild the constant Gram basis.T @ basis on
    every Hessian. This object evaluates the intermediates once per point and
    keeps them until a DIFFERENT point is asked for; whichever of fun / jac /
    hess arrives first at a point pays, the others reuse. The cache is keyed
    on the point rather than on call order because the order is not a
    contract: scipy evaluates the Hessian before the loss at accepted points
    but the loss alone at rejected proposals, and the sequence differs between
    scipy versions. The Gram is built lazily on the first Hessian request and
    kept for the life of the object.

    This is the same single-slot memo scipy's own MemoizeJac would interpose
    if fun were handed over as a combined (loss, gradient) with jac=True — kept
    here instead so one layer owns the sharing and extends it to the Hessian,
    which scipy never shares.

    Coefficients are parameterized in log-space (E_i = exp(logcoefs)) so the
    optimizer sees an unconstrained problem while the physical coefficients
    remain positive. The loss is the sum of squared residuals between
    basis @ exp(logcoefs) and data, plus an optional second-difference penalty
    on logcoefs[solid:] scaled by smoothness. With J = -basis @ diag(coefs),
    the Jacobian of the residual in log-space,

        V       = r.r + smoothness**2 * |L x|**2
        grad V  = 2 * (r.T @ J + smoothness**2 * L.T L x)
        Hess V  = 2 * (J.T @ J + diag(r.T @ J) + smoothness**2 * L.T @ L)

    The diag term is the exact second derivative, not a Gauss-Newton
    approximation; it is diagonal because each model term depends on a single
    log-coefficient through exp(). L is the second-difference stencil and
    L.T @ L is accumulated onto its pentadiagonal bands directly, so neither L
    nor J is ever materialized.

    Residuals are UNWEIGHTED here: the caller passes an already-weighted
    system. fit.smooth_prony_fit's _prony_reduce folds 1/std into R and z
    before this is ever called.

    Overflow guard (log_cap). With a cap set, any point with a log-coefficient
    above it evaluates to +inf so a trust-region solver rejects the proposal
    and shrinks. Without it an overflowed exp() reaches the basis, whose
    QR-mixed signs turn inf * basis into NaN, and a NaN reduction ratio leaves
    scipy's trust-region loop neither accepting nor shrinking — forever. Not
    observed with the flat seed across 324 benchmark cases, but a hang is not
    a failure mode to leave to luck. hess is unguarded: it is only ever asked
    for at accepted, hence finite-loss, points.

    Parameters:
        data (numpy.ndarray): 1-D array of target values, pre-weighted.
        basis (numpy.ndarray): 2-D basis matrix, pre-weighted to match data;
            basis @ exp(logcoefs) is the model. May be read-only: it is never
            written to.
        smoothness (float): Weight of the second-difference penalty on
            logcoefs[solid:] — the SCALED weight the fit is run with. Pass 0
            to disable.
        solid (bool): Whether the leading coefficient is an equilibrium term
            to exclude from the smoothness penalty.
        log_cap (float or None): Largest log-coefficient fun/jac will
            evaluate; None disables the guard (one-shot scoring and tests).
    """

    def __init__(self, data: np.ndarray, basis: np.ndarray, smoothness: float,
                 solid: bool, log_cap: float = None):
        self._data = data
        self._basis = basis
        self._smoothness = smoothness
        self._solid = solid
        self._log_cap = log_cap
        self._gram = None
        self._x = None

    def _capped(self, logcoefs: np.ndarray) -> bool:
        return self._log_cap is not None and bool(np.any(logcoefs > self._log_cap))

    def _at(self, logcoefs: np.ndarray) -> tuple:
        """(coefs, resid, r.T @ J) at logcoefs, recomputed only if it moved."""
        if self._x is None or not np.array_equal(logcoefs, self._x):
            self._x = np.array(logcoefs, copy=True)
            self._coefs = np.exp(logcoefs)
            self._resid = self._data - self._basis @ self._coefs
            # r.T @ J: the gradient before the chain rule is doubled and
            # before the penalty is folded in; also the Hessian's exact
            # second-derivative diagonal.
            self._rj = -(self._basis.T @ self._resid) * self._coefs
        return self._coefs, self._resid, self._rj

    def residual(self, logcoefs: np.ndarray) -> np.ndarray:
        """data - basis @ exp(logcoefs); cached with the rest. Do not write
        to it."""
        return self._at(logcoefs)[1]

    def fun(self, logcoefs: np.ndarray) -> float:
        """Loss, for scipy.optimize.minimize's fun=; +inf above log_cap."""
        if self._capped(logcoefs):
            return np.inf
        _, resid, _ = self._at(logcoefs)
        loss = resid @ resid
        if self._smoothness:
            curve = self._smoothness * _log_curvature(logcoefs, self._solid)
            loss += curve @ curve
        return loss

    def jac(self, logcoefs: np.ndarray) -> np.ndarray:
        """Gradient, for scipy.optimize.minimize's jac=; a fresh array.

        Zeros above log_cap: never requested there (the trust region rejects
        on fun alone) but kept finite so a caller that does ask gets an array,
        not an overflow.
        """
        if self._capped(logcoefs):
            return np.zeros_like(logcoefs)
        _, _, rj = self._at(logcoefs)
        grad = rj.copy()
        if self._smoothness:
            # smoothness**2 * curvature, spread back onto the stencil.
            diffs = self._smoothness ** 2 * _log_curvature(logcoefs, self._solid)
            grad_slice = grad[self._solid:]
            grad_slice[:-2] += diffs
            grad_slice[1:-1] -= 2 * diffs
            grad_slice[2:] += diffs
        return 2 * grad  # more chain rule (squared errors)

    def fun_jac(self, logcoefs: np.ndarray) -> tuple:
        """(loss, gradient) in one call, for one-shot callers."""
        return self.fun(logcoefs), self.jac(logcoefs)

    def hess(self, logcoefs: np.ndarray) -> np.ndarray:
        """
        Exact Hessian, for scipy.optimize.minimize's hess=.

        Also the one definition of 0.5 * Hess(V) = C that
        quality._prony_fit_quality puts inside its Laplace determinant, so the
        curvature the optimizer converges on is the curvature the score is
        charged for.

        Returns:
            numpy.ndarray: fresh (m, m) symmetric Hessian, m = len(logcoefs).
        """
        coefs, _, rj = self._at(logcoefs)
        if self._gram is None:
            self._gram = self._basis.T @ self._basis
        # The product allocates, so the in-place scaling below cannot touch
        # the cached Gram (nor a read-only basis).
        H = self._gram * coefs   # -> J.T @ J; J = -basis @ diag(coefs), so its
        H *= coefs[:, None]      # two sign flips cancel in the Gram.
        # np.einsum('ii->i', H) is a writable stride view even when H is not
        # contiguous; H.ravel()[::m + 1] would silently write to a copy instead.
        np.einsum('ii->i', H)[...] += rj

        if self._smoothness:
            # lam * L.T @ L is pentadiagonal; accumulate the nine stencil
            # outer-product terms straight onto its bands. Index pairs are
            # strictly increasing within each (t, u) pass, so there is no
            # fancy-index += aliasing. The loop also stays correct at npen == 3,
            # where the two boundary corrections collide and the generic band
            # pattern [1, 5, 6, ..., 6, 5, 1] does not apply — and at npen < 3,
            # where band is empty and the penalty is identically zero.
            lam = self._smoothness * self._smoothness
            npen = len(logcoefs) - self._solid
            band = self._solid + np.arange(max(npen - 2, 0))
            for t, stencil_t in enumerate(_D2_STENCIL):
                for u, stencil_u in enumerate(_D2_STENCIL):
                    H[band + t, band + u] += lam * stencil_t * stencil_u

        H *= 2  # squared errors, matching the factor jac returns
        return H


def _prony_objective(
        logcoefs: np.ndarray,
        data: np.ndarray,
        basis: np.ndarray,
        smoothness: float,
        solid: bool,
) -> tuple:
    """
    One-shot (loss, gradient) of the smoothed Prony fit at a point.

    Convenience form of _PronyLoss.fun_jac for callers that evaluate once
    (scoring, tests). The solver itself holds a _PronyLoss so the Hessian can
    share the evaluation; see that class for the definitions.
    """
    return _PronyLoss(data, basis, smoothness, solid).fun_jac(logcoefs)


def _prony_hessian(
        logcoefs: np.ndarray,
        data: np.ndarray,
        basis: np.ndarray,
        smoothness: float,
        solid: bool,
) -> np.ndarray:
    """
    One-shot exact Hessian of the smoothed Prony fit at a point.

    Convenience form of _PronyLoss.hess; same argument list as
    _prony_objective. See _PronyLoss for the definition.
    """
    return _PronyLoss(data, basis, smoothness, solid).hess(logcoefs)


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
