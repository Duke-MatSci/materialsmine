"""
The smoothed Prony fit: the one entry point that turns measured complex-modulus
data into (tau_i, E_i).

Composes the rest of the fitting stack — `prony` for the grid, `reduction` for
the exact QR compression, `objective` for the penalized loss, `quality` for the
score — and owns the two decisions that need all four in view: how the
user-facing smoothness knob is normalized, and how the equilibrium modulus is
kept out of the Newton solver's search (`_PlateauProjectedProblem`).
"""

import numpy as np
from scipy.optimize import minimize, nnls

from .prony import prony_relaxation_space
from .objective import _PronyLoss, _scaled_smoothness
from .reduction import _prony_reduce
from .quality import _FitQuality, _prony_fit_quality


class _PlateauProjectedProblem:
    """
    The smoothed fit with the equilibrium (plateau) modulus projected out, so
    the solver only searches the log-coefficients of the decaying terms.

    Variable projection. For any fixed decaying coefficients c the optimal
    non-negative equilibrium modulus is a one-variable NNLS with the closed
    form

        E_eq = max(0, r0 . (z - Rr c) / (r0 . r0))

    (r0 the equilibrium column of the reduced basis, Rr the rest), so the
    equilibrium term never has to be a search variable. While E_eq > 0 the
    partially-minimized loss is EXACTLY the solid=False loss on the system
    projected orthogonally to r0, (P z, P Rr); once it clamps at zero it is the
    solid=False loss on (z, Rr) itself. A _PronyLoss on whichever pair applies
    therefore gives the exact loss, gradient and Hessian of the projected
    problem — no envelope-theorem approximation — and shares their common
    intermediates between the solver's separate fun, jac and hess calls.

    Why bother: in log-space the equilibrium term is unpenalized and its
    gradient carries a factor of E_eq itself (chain rule), so a solver can run
    it toward -inf, watch the gradient vanish, and declare convergence at a
    point that is not a minimum of anything. Measured on the bundled VeroCyan
    master curve: a 14x worse objective than the true optimum. The correct
    answer is sometimes E_eq == 0 — that is a boundary optimum, not something
    a penalty should push away from — and log-parameterization turns that
    boundary into a spurious stationary point at infinity. Projection removes
    the direction from the search entirely, guarantees E_eq is optimal for the
    returned decaying terms, and lands the clamped case on an exact 0.0.

    Exposes fun / jac / hess with the same signatures as _PronyLoss (which
    also carries the overflow guard, via log_cap), plus equilibrium() and
    coefficients() to rebuild the full vector. The solid=False fit needs none
    of this and uses a _PronyLoss directly.
    """

    def __init__(self, data: np.ndarray, basis: np.ndarray, smoothness: float,
                 log_cap: float = None):
        r0 = basis[:, 0]
        self._r0 = r0
        self._r0_sq = r0 @ r0
        # Two views of the same problem: the clamped system (z, Rr) — whose
        # residual also yields E_eq — and the system projected orthogonally
        # off r0, for E_eq > 0. The projector is applied once to each array
        # rather than materialized.
        rest = basis[:, 1:]
        self._clamped = _PronyLoss(data, rest, smoothness, False, log_cap)
        self._free = _PronyLoss(
            data - r0 * ((r0 @ data) / self._r0_sq),
            rest - np.outer(r0, (r0 @ rest) / self._r0_sq),
            smoothness, False, log_cap,
        )

    def equilibrium(self, logcoefs: np.ndarray) -> float:
        """Optimal non-negative equilibrium modulus for these decaying terms.

        Exactly 0.0 when the unconstrained optimum is negative — the clamp is
        the active set of a one-variable NNLS, not a rounding artifact.
        """
        resid = self._clamped.residual(logcoefs)
        return max(0.0, (self._r0 @ resid) / self._r0_sq)

    def _loss(self, logcoefs: np.ndarray) -> _PronyLoss:
        return self._free if self.equilibrium(logcoefs) > 0 else self._clamped

    def fun(self, logcoefs: np.ndarray) -> float:
        """Loss, for scipy.optimize.minimize's fun=."""
        return self._loss(logcoefs).fun(logcoefs)

    def jac(self, logcoefs: np.ndarray) -> np.ndarray:
        """Gradient, for scipy.optimize.minimize's jac=."""
        return self._loss(logcoefs).jac(logcoefs)

    def hess(self, logcoefs: np.ndarray) -> np.ndarray:
        """Exact Hessian, for scipy.optimize.minimize's hess=."""
        return self._loss(logcoefs).hess(logcoefs)

    def coefficients(self, logcoefs: np.ndarray) -> np.ndarray:
        """Full coefficient vector, equilibrium term first."""
        return np.concatenate(([self.equilibrium(logcoefs)], np.exp(logcoefs)))


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
        std_scale: float = 1.0,
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
    the reduced problem is minimized by exact Newton in a trust region
    (scipy's trust-exact, fed _PronyLoss.fun / .jac / .hess) over the
    log-coefficients of the decaying terms, with the equilibrium modulus
    projected out in closed form — see _PlateauProjectedProblem. The seed is
    flat:
    every term at log(max(E_stor) / m).

    Why Newton, and why that seed. The penalty makes the Hessian's condition
    number ~1e12 at ordinary settings, and first-order and limited-memory
    methods cannot follow it: on a 324-case benchmark (four bundled master
    curves plus synthetic 12-40 decade ones, N from 20 to 150, smoothness
    1e-3 to 100) the previous L-BFGS-B solver stopped on its relative-f test
    with the gradient still O(1) in 70 cases — 10x to 100x above the optimum
    on every bundled file at N=100, smoothness=1 — and BFGS, trust-ncg and
    Newton-CG each stalled or overflowed somewhere. trust-exact from the flat
    seed matched the best objective found by any method in all 324 cases, in
    ~25 evaluations (vs ~3800), 10x faster overall. The NNLS solution is NOT
    used as the seed any more: its exact zeros clip into -7 log-unit spikes
    which the penalty turns into an enormous initial gradient, and from there
    trust-exact's subproblem solver was observed to loop without bound
    (an unbounded `while True` in scipy that maxiter cannot cap) while BFGS
    overflowed to NaN. Do not reintroduce it.

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
        smoothness (float): Strength of the smoothing prior on the
            log-coefficients. Pass 0 to disable. Normalized internally by
            sqrt(dof / h**3) (see _scaled_smoothness), h being the log-tau grid
            spacing, which makes it the exchange rate between the two numbers
            the fit-quality readout reports: V/dof = chi2_reduced +
            smoothness**2 * (log_range * curvature). A given value therefore
            produces comparable smoothing whether the file has 400 rows or
            40,000, whether it is fit with 20 terms or 100, and whether it
            covers 4 decades or 20.
        solid (bool): Whether to include an equilibrium-modulus term.
        return_fit_quality (bool): Append a _FitQuality to the return tuple.
            Off by default so existing two-value unpacking keeps working.
        std_scale (float): Uniform positive multiplier on both std arrays,
            equivalent to passing E_stor_std * std_scale but held out of the
            reduction so a caller that varies ONLY this factor — the
            relative-error widget — reuses one cached reduction across every
            value instead of redoing the O(rows) QR per move. See _prony_reduce.

    Returns:
        tuple: (tau_i, E_i) where tau_i is the 1-D relaxation-time grid of
        length N and E_i is the 1-D non-negative coefficient array of length
        N + bool(solid). Entries can be exactly zero (NNLS active set). With
        return_fit_quality, (tau_i, E_i, quality); quality.neg_log_posterior is
        None unless the fit converged to an INTERIOR minimum with smoothing on,
        since the Laplace approximation behind it assumes a stationary point
        (when the projected equilibrium modulus clamps at exactly zero the
        score is that of the N-term solid=False problem the solver actually
        converged on), and quality.curvature is None on the unsmoothed path,
        where the NNLS active set makes log-coefficients (and so their
        roughness) undefined.
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
    # Not merely "non-zero": a negative scale would flip the sign of every
    # weighted residual, and the route already rejects relative_error <= 0
    # and error_scale <= 0 (whichever feeds std_scale).
    assert std_scale > 0, "std_scale must be positive"

    tau_max = 1 / np.min(omega)
    tau_min = 1 / np.max(omega)
    tau_i = prony_relaxation_space(tau_min, tau_max, N)

    m = N + solid
    n_res = 2 * len(omega)
    dof = n_res - m

    R, z = _prony_reduce(
        omega, E_stor, E_loss, E_stor_std, E_loss_std, tau_i, solid, std_scale
    )
    # (R, z) carries the unreachable orthogonal residual as its last row, which
    # is what puts every score on the full-problem scale. nnls wants the full
    # norm. The Newton solver would be indifferent — a constant row changes
    # neither gradient nor Hessian, and trust-exact stops on the gradient, not
    # on a relative reduction of f the way L-BFGS-B did — so the slice is now
    # only about not carrying a dead row through every evaluation.
    R_fit, z_fit = R[:m], z[:m]

    # Reduced problem with smoothness == 0 is exactly non-negative least
    # squares — solve it directly (finite algorithm, no iteration budget).
    if smoothness == 0:
        E_nnls, rnorm = nnls(R, z)
        if not return_fit_quality:
            return tau_i, E_nnls
        # No penalty means no posterior over lam to report, but the misfit is
        # still meaningful — and nnls already handed us ||R c - z||, which the
        # reduction's residual row makes a full-problem quantity. Curvature is
        # genuinely undefined here, not merely unavailable: NNLS's active set
        # leaves coefficients EXACTLY zero, whose logs are -inf.
        return tau_i, E_nnls, _FitQuality(
            rnorm ** 2 / dof if dof > 0 else None, None, None,
        )

    # smoothness > 0: the second-difference penalty acts on log-coefficients,
    # so run Newton on the reduced system with the equilibrium term projected
    # out. Normalize the knob so it means the same thing on any upload; see
    # _scaled_smoothness, which _prony_fit_quality re-derives from the same
    # inputs so the reported score belongs to the fit that was actually run.
    log_range = np.log(tau_i[-1] / tau_i[0])
    smoothness_scaled = _scaled_smoothness(smoothness, N, dof, log_range)
    # No single Prony term above ~1000x the data maximum: the overflow guard
    # in _PronyLoss, same physical cap the old L-BFGS-B upper bound encoded.
    log_cap = np.log(E_stor.max()) + np.log(1e3)
    if solid:
        problem = _PlateauProjectedProblem(
            z_fit, R_fit, smoothness_scaled, log_cap)
    else:
        problem = _PronyLoss(z_fit, R_fit, smoothness_scaled, False, log_cap)
    # Flat seed, data-scaled: zero curvature, so the penalty contributes
    # nothing to the first step however large its weight.
    x0 = np.full(N, np.log(E_stor.max() / m))
    with np.errstate(over='ignore', invalid='ignore'):
        result = minimize(
            fun=problem.fun,
            x0=x0,
            jac=problem.jac,
            hess=problem.hess,
            method='trust-exact',
        )
    # result.success is deliberately not consulted: near the optimum the
    # trust radius can collapse on a precision-limited reduction ratio and
    # scipy reports "bad approximation" with the gradient already ~1e-5.
    E_i = problem.coefficients(result.x) if solid else np.exp(result.x)
    if not return_fit_quality:
        return tau_i, E_i

    if solid and E_i[0] == 0:
        # The projected equilibrium modulus clamped at zero, so in the full
        # parameterization the optimum sits on a coefficient boundary:
        # log(E_eq) = -inf and the Laplace expansion has no curvature in that
        # direction. What the solver actually converged on there is the
        # solid=False problem in the N decaying terms (see
        # _PlateauProjectedProblem),
        # and that problem's interior minimum IS this point — so score it as
        # that: the posterior given the active set, the same convention NNLS
        # uses for its exact zeros. n_resid is lowered by one so the dof
        # _prony_fit_quality derives — and hence the penalty weight it rebuilds
        # — stay exactly the fit's own: the pinned equilibrium term is still
        # one of the fit's m parameters.
        quality = _prony_fit_quality(
            result.x, z, R[:, 1:], smoothness, False,
            n_resid=n_res - 1,
            log_range=log_range,
        )
        return tau_i, E_i, quality

    quality = _prony_fit_quality(
        np.log(E_i), z, R, smoothness, solid,
        n_resid=n_res,
        log_range=log_range,
    )
    return tau_i, E_i, quality
