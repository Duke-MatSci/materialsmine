"""
The orchestration layer between the route and the rest of the package: validate
an upload, put it in the frequency domain, fit it, and build every figure and
table the response carries.

This is the only module that knows the whole pipeline. Everything domain-
specific — which transform, which weights, which figures are even defined for a
given upload — is decided here so the modules below it stay single-purpose.
"""

import numpy as np
import pandas as pd
import plotly.graph_objects as go

from app.utils.util import log_errors

from .prony import prony_terms_for_span
from .fit import smooth_prony_fit
from .reduction import (
    _fit_grid_gauss_newton_terms, prony_rank_limit, prony_resolution)
from .tts import (MAX_ABS_LOG10_SHIFT, tts_frequency_to_temperature_V2,
                  tts_temperature_to_frequency_V2, wlf_window)
from .figures import (
    _annotate_decimation,
    _annotate_fit_quality,
    _annotate_grid_suggestion,
    _build_coef_records,
    _build_complex_figures,
    _build_relaxation_figures,
    _build_shift_figure,
    _build_temperature_figures,
    _decimate_for_plot,
    _mark_cutoffs,
    _stamp_notice,
)


EXPECTED_DOMAIN_COLUMNS = {
    'frequency':   ('Frequency', 'E Storage', 'E Loss'),
    'temperature': ('Temperature', 'E Storage', 'E Loss'),
}

# Largest factor by which the fit's exact-to-Gauss-Newton ratio may raise the
# probe grid's Gauss-Newton count in the grid suggestion: step 2 of the rule
# set out in the grid-suggestion comment in update_line_chart. Empirical,
# chosen on the sweeps in tests/trive/test_grid_suggestion_recall.py, where
# 1.4 cost about two points of recall and 1.6 raised the low-smoothness false
# fires from 1 to 8 of 1092.
_MAX_GAUSS_NEWTON_CORRECTION = 1.5


class _ChartResult(tuple):
    """update_line_chart's result tuple, carrying the grid size the fit ran
    with as number_of_prony (None when no fit ran)."""

    def __new__(cls, items, number_of_prony):
        result = super().__new__(cls, items)
        result.number_of_prony = number_of_prony
        return result


@log_errors
def update_line_chart(uploadData, number_of_prony, smoothness, fit_settings, domain,
                      Tg=None, C1=None, C2=None, Ea=None, TC=None, shift_model=None, shiftData=None,
                      relative_error=0.2, error_scale=1.0, a_T_ref=None,
                      shift_chi2_reduced=None, shift_reference=None):
    """
    Update the Tri-VE figures and Prony coefficient table for an uploaded dataset.

    Parameters:
        uploadData (dict[str, np.ndarray]): Output of upload_init() for the
            chosen domain. Keys must be ('Frequency', 'E Storage', 'E Loss')
            for frequency domain or ('Temperature', 'E Storage', 'E Loss') for
            temperature domain.
        number_of_prony (int or None): Number of terms in the Prony series,
            used as given. None sizes the grid from the span of the curve
            the fit sees (prony_terms_for_span), in either domain.
        smoothness (float): Smoothing regularization for the fit.
        fit_settings (bool): If True, overlay the basis scatter on the
            relaxation modulus and spectrum figures.
        domain (str): 'frequency' or 'temperature'.
        Tg, C1, C2, Ea, TC: Shift-model parameters. In the temperature domain
            they drive the temperature→frequency transform that feeds the Prony
            fit; in the frequency domain they (and shiftData) drive the
            frequency→temperature visualization only (manual/WLF/hybrid).
        shift_model (str): 'WLF', 'hybrid', 'manual', or 'none'/None for no
            transform at all. 'none' is not merely "no usable parameters" — it
            means the caller did not ask for a transform, and in the frequency
            domain it suppresses the temperature figures rather than falling
            back to the universal-WLF view.
        shiftData: Optional precomputed shift factors {'Temperature': ..., 'a_T': ...}.
            Supplying one counts as requesting a transform even under 'none'.
        relative_error (float): Fractional uncertainty used to synthesize the
            per-point sigma (relative_error * |E*|) when the upload carries no
            error columns. Ignored when it does.
        error_scale (float): Uniform multiplier on the upload's own error
            columns when present; 1.0 uses them as supplied. Ignored when the
            upload has none. Kept separate from relative_error so each widget
            mode has a wire field the other mode cannot corrupt.
        a_T_ref (float): Vertical offset for the model curve on the shift
            figure (from fit_hybrid_coefficients via /fit-shift/). Display
            only — the transform itself never reads it.
        shift_chi2_reduced (float): Fit-time reduced chi-squared of the shift
            fit, stamped on the shift figure when present. Display only; see
            _build_shift_figure for why it is not recomputed here.
        shift_reference: Optional measured shift factors
            {'Temperature': ..., 'a_T': ...} drawn as the shift figure's
            Experiment markers WITHOUT driving the transform — the comparison
            case for a WLF/hybrid model, where supplying shiftData instead
            would make the transform apply the table. Ignored when shiftData
            is present (shiftData already supplies the markers).

    Returns:
        fig1 (plotly.graph_objects.Figure): The line chart.
        fig11 (plotly.graph_objects.Figure): The updated line chart.
        fig2 (plotly.graph_objects.Figure): The scatter plot.
        fig3 (plotly.graph_objects.Figure): The updated scatter plot.
            When the fit reports a covariance (smoothed fits), fig1, fig11
            and fig2 carry 1-sigma credible ribbons and fig3 error bars,
            plus a band on its long-term-modulus line when the covariance
            carries the equilibrium row;
            fig1 and fig11 also carry 1-sigma prediction ribbons. The Prony
            curves and ribbons on fig1, fig11 and fig2 run past the data
            window (see figures._DRAW_EXTENSION_DECADES). fig1 and fig11
            are captioned with the fit-quality readout, a decimation notice
            when the traces were thinned, and a suggested relaxation grid
            size when the data resolves more terms than the grid the fit ran
            with (figures._annotate_grid_suggestion).
        fig4 (plotly.graph_objects.Figure): The temperature line chart. Empty in
            the frequency domain when no transform was requested (see shift_model).
        fig41 (plotly.graph_objects.Figure): The tandelta temperature updated line chart.
            Empty under the same condition as fig4.
        coef_df (List[Dict[str, Union[float, int]]]): The coefficients
            (see _build_coef_records); with a covariance each row also
            carries its 1-sigma bounds, 'E_i_lower' and 'E_i_upper'.
        fig5 (plotly.graph_objects.Figure): The shift-factor figure (a_T vs
            Temperature): uploaded shift factors as markers and/or the
            WLF/hybrid model curve. Empty when no transform was requested or
            nothing is drawable (see _build_shift_figure).
        shift_records (list): The table behind fig5; [] when fig5 is empty.
        max_prony (int or None): reduction.prony_rank_limit on the master
            curve the fit consumed; None on the temperature preview.
        warnings (list of str): Notices for the user from the transform;
            empty unless a temperature-domain WLF transform dropped rows,
            in which case every figure also marks each cutoff (_wlf_drop).
        The tuple also carries number_of_prony as an attribute: the grid
        size the fit ran with, len(tau_i); None on the temperature preview.

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

    # The shift figure only exists when a transform is in play; both branches
    # overwrite this pair on their transform paths.
    shift_fig, shift_records = go.Figure(), []
    # Set by a temperature-domain WLF transform that drops rows (_wlf_drop).
    wlf_drop = None

    if domain == "frequency":
        if np.any(df['Frequency'].to_numpy() <= 0):
            raise ValueError(
                "All Frequency values in the uploaded file must be positive. "
                "Remove rows with zero or negative frequencies."
            )
        freq_sweep_data = df.rename(columns={'E Storage': "E'", 'E Loss': "E''"})
        # Counterpart of the temperature branch's has_shift_params guard below,
        # but an *intent* test rather than a capability one: the temperature
        # axis is a transform of the upload, not the upload itself, so it is
        # only drawn when a transform was actually requested. Once requested,
        # unusable inputs RAISE out of V2 (incomplete or singular WLF/hybrid,
        # uninvertible shift table) and surface as the route's 400 snackbar —
        # the silent universal-WLF fallback is gone.
        if shift_model in (None, 'none') and shiftData is None:
            fig4 = go.Figure()
            fig41 = go.Figure()
        else:
            temp_sweep_data = tts_frequency_to_temperature_V2(
                freq_sweep_data, shift_model,
                Tg=Tg, TC=TC, C1=C1, C2=C2, Ea=Ea, shiftData=shiftData,
            )
            plot_temp, temp_decimation = _decimate_for_plot(temp_sweep_data)
            fig4, fig41 = _build_temperature_figures(plot_temp)
            _annotate_decimation((fig4, fig41), temp_decimation)
            # Label the provenance: this axis is synthesized, not measured,
            # and the user should see which inverse produced it.
            if shiftData:
                _stamp_notice((fig4, fig41), (
                    "temperature view inverted from the uploaded shift factors "
                    "(visualization only — the fit uses the frequency data)"
                ))
            elif shift_model == 'hybrid':
                _stamp_notice((fig4, fig41), (
                    f"temperature view via inverse hybrid at Tc = {TC:g} °C "
                    "(visualization only — the fit uses the frequency data)"
                ))
            else:
                _stamp_notice((fig4, fig41), (
                    f"temperature view via inverse WLF at Tg = {Tg:g} °C "
                    "(visualization only — the fit uses the frequency data)"
                ))
            T_derived = temp_sweep_data['Temperature'].to_numpy()
            shift_fig, shift_records = _build_shift_figure(
                shiftData or shift_reference,
                shift_model, Tg, TC, C1, C2, Ea, a_T_ref,
                (float(T_derived.min()), float(T_derived.max())),
                shift_chi2_reduced,
            )

    elif domain == "temperature":
        temp_sweep_data = df.rename(columns={'E Storage': "E'", 'E Loss': "E''"})
        plot_temp, temp_decimation = _decimate_for_plot(temp_sweep_data)
        fig4, fig41 = _build_temperature_figures(plot_temp)
        _annotate_decimation((fig4, fig41), temp_decimation)

        # `is not None` rather than truthy checks: Tg = 0 °C is a valid
        # reference, and the route default-fills numeric estimates that may
        # legitimately be zero. Tg is required only for WLF (used as T_ref);
        # hybrid_shift uses TC as the WLF/Arrhenius crossover and never reads Tg.
        has_shift_params = (
            shiftData is not None
            or (shift_model == "WLF"
                and Tg is not None and C1 is not None and C2 is not None)
            or (shift_model == "hybrid"
                and TC is not None and C1 is not None and C2 is not None
                and Ea is not None)
        )
        if not has_shift_params:
            # No way to bring temperature data onto a master curve, so the
            # frequency-domain figures and coefficient table are not produced
            # (and there is no shift model to draw).
            empty = go.Figure()
            return _ChartResult((
                empty, empty, empty, empty, fig4, fig41,
                pd.DataFrame(columns=["tau_i", "E_i"]).to_dict("records"),
                shift_fig, shift_records, None, [],
            ), None)

        freq_sweep_data = tts_temperature_to_frequency_V2(
            temp_sweep_data, shift_model,
            Tg=Tg, TC=TC, C1=C1, C2=C2, Ea=Ea, shiftData=shiftData,
        )

        # Built after the transform so tts_temperature_to_frequency_V2 keeps
        # sole ownership of shiftData validation (missing 'a_T', positional
        # row-count mismatches). The legacy positional shift form has no
        # temperature column of its own; its a_T align row-for-row with the
        # upload sorted by Temperature ascending — the same reading the
        # transform just applied — so synthesize that pairing for the markers.
        T_upload = temp_sweep_data['Temperature'].to_numpy()
        marker_data = shiftData or shift_reference
        if marker_data and 'Temperature' not in pd.DataFrame(marker_data).columns:
            marker_data = {'Temperature': np.sort(T_upload),
                           'a_T': pd.DataFrame(marker_data)['a_T'].to_numpy()}
        shift_fig, shift_records = _build_shift_figure(
            marker_data, shift_model, Tg, TC, C1, C2, Ea, a_T_ref,
            (float(T_upload.min()), float(T_upload.max())),
            shift_chi2_reduced,
        )
        if shift_model == 'WLF' and not shiftData:
            wlf_drop = _wlf_drop(temp_sweep_data, Tg, C1, C2)
        df = freq_sweep_data.rename(
            columns={"E'": 'E Storage', "E''": 'E Loss'},
        )

    E_stor_arr = df['E Storage'].to_numpy()
    E_loss_arr = df['E Loss'].to_numpy()
    mag = np.abs(E_stor_arr + 1.0j * E_loss_arr)
    # std_scale carries relative_error/error_scale INSTEAD of baking either
    # into the array. The sigma array is then identical on every move of the
    # error widget, so all of them share one cached reduction; folding the
    # factor in here would make each move a different array and cost a full
    # QR over every row. The fit is the same either way (see _prony_reduce).
    if 'E Storage Error' in df.columns and 'E Loss Error' in df.columns:
        E_stor_std = df['E Storage Error'].to_numpy()
        E_loss_std = df['E Loss Error'].to_numpy()
        std_scale = error_scale
    elif 'Error' in df.columns:
        E_stor_std = df['Error'].to_numpy()
        E_loss_std = E_stor_std
        std_scale = error_scale
    else:
        E_stor_std = mag
        E_loss_std = E_stor_std
        std_scale = relative_error
    omega_arr = df['Frequency'].to_numpy()
    # An omitted size is sized here, where the curve the fit sees exists;
    # for a temperature upload that is the master curve after the transform.
    if number_of_prony is None:
        number_of_prony = prony_terms_for_span(omega_arr)
    max_prony = prony_rank_limit(omega_arr, E_stor_arr, E_loss_arr,
                                 E_stor_std, E_loss_std, std_scale=std_scale)
    tau_i, E_i, fit_quality = smooth_prony_fit(
        omega=omega_arr,
        E_stor=E_stor_arr,
        E_loss=E_loss_arr,
        E_stor_std=E_stor_std,
        E_loss_std=E_loss_std,
        N=number_of_prony, smoothness=smoothness,
        return_fit_quality=True, std_scale=std_scale,
    )
    # Decaying terms only. The equilibrium coefficient is a separate parameter,
    # not a relaxation mode: it has no tau_i, it is excluded from the smoothness
    # penalty, the coefficient table gives it its own 'inf' row, and fig3 draws
    # it as its own long-term-modulus trace. Counting it would label a 23-point
    # grid 24 terms on the smoothed path, where exp(logcoefs) is never zero.
    N_nz = np.count_nonzero(E_i[len(E_i) - len(tau_i):])

    # Downstream figure builders assume df's first three columns are
    # exactly (Frequency, E Storage, E Loss); drop any extras now that
    # the std arrays have been pulled out. The plot frame may be thinned
    # (figures only — the fit above already consumed every row).
    df = df[['Frequency', 'E Storage', 'E Loss']]
    plot_df, freq_decimation = _decimate_for_plot(df)
    noise = (omega_arr, E_stor_std * std_scale / mag,
             E_loss_std * std_scale / mag)
    fig1, fig11 = _build_complex_figures(
        plot_df, tau_i, E_i, N_nz, fit_quality.covariance, noise)
    # The grid-size suggestion, in four steps; the other code involved points
    # back here.
    # 1. Probe count: reduction.prony_resolution, the Gauss-Newton effective
    #    terms on the probe grid (reduction._RANK_PROBE_TERMS nodes) at the
    #    fit resampled onto that grid; with no smoothing, the probe NNLS
    #    active-set size. Unlike the fit's own count it is not bounded by the
    #    grid the fit ran with, which is what lets it ask for more terms.
    # 2. Correction: Gauss-Newton drops the residual-curvature part of the
    #    exact Hessian and so undercounts, most at low smoothness. The fit's
    #    exact quality.effective_terms over the Gauss-Newton count on the
    #    same grid (reduction._fit_grid_gauss_newton_terms) measures the
    #    undercount on this upload; the probe count is scaled by that ratio,
    #    capped at _MAX_GAUSS_NEWTON_CORRECTION, past which the ratio
    #    overstates the probe count. When either count is None (no smoothing,
    #    a Hessian that is not positive definite) the probe count stands.
    # 3. Fire (figures._annotate_grid_suggestion): rounded, the corrected
    #    count is compared with len(tau_i), the grid the fit ran with, which
    #    the server sized from the span if the request sent none; a grid that
    #    meets it gets no suggestion.
    # 4. Size (same function): min(max_prony, ceil(1.5 * count)), and none
    #    when that leaves nothing to raise. This 1.5 allows nodes around each
    #    resolved term and is unrelated to the correction's cap.
    # Nothing here computes an exact Hessian on the probe grid. The exact
    # probe count the suggestion is scored against is test-only:
    # tests/trive/_resolution_oracle.py, swept by
    # tests/trive/test_grid_suggestion_recall.py.
    resolution = prony_resolution(
        omega_arr, E_stor_arr, E_loss_arr, E_stor_std, E_loss_std,
        tau_i, E_i, smoothness, std_scale=std_scale)
    effective_terms = fit_quality.effective_terms
    if resolution is not None and effective_terms is not None:
        gn_fit = _fit_grid_gauss_newton_terms(
            omega_arr, E_stor_arr, E_loss_arr, E_stor_std, E_loss_std,
            tau_i, E_i, smoothness, std_scale=std_scale)
        if gn_fit is not None:
            resolution *= min(_MAX_GAUSS_NEWTON_CORRECTION,
                              effective_terms / gn_fit)
    # Order sets the rows: the readout takes the one nearest the plot, the
    # decimation notice stacks above it and the grid suggestion above both.
    # See _stamp_notice.
    _annotate_fit_quality((fig1, fig11), fit_quality)
    _annotate_decimation((fig1, fig11), freq_decimation)
    _annotate_grid_suggestion((fig1, fig11), len(tau_i), resolution,
                              max_prony)
    fig2, fig3 = _build_relaxation_figures(
        tau_i, E_i, N_nz, fit_settings, fit_quality.covariance)
    coef_records = _build_coef_records(tau_i, E_i, fit_quality.covariance)
    warnings = []
    if wlf_drop:
        omegas = wlf_drop['frequencies']
        for figs, xs in (((fig4, fig41, shift_fig), wlf_drop['temperatures']),
                         ((fig1, fig11), omegas),
                         ((fig2, fig3), [1.0 / w for w in omegas])):
            for fig in figs:
                _mark_cutoffs(fig, xs)
        _stamp_notice((fig1, fig11, fig2, fig3, fig4, fig41, shift_fig),
                      wlf_drop['notice'])
        warnings.append(wlf_drop['warning'])

    return _ChartResult((fig1, fig11, fig2, fig3, fig4, fig41, coef_records,
                         shift_fig, shift_records, max_prony, warnings),
                        len(tau_i))


def _wlf_drop(temp_sweep_data, Tg, C1, C2):
    """
    What a temperature-domain WLF transform dropped, or None if nothing.

    Returns a dict with the user-facing 'warning', the figure 'notice', and
    the cutoff of each window edge rows were dropped past: 'temperatures'
    for the temperature axes and 'frequencies' for the master curve. An
    edge's frequency is 10**(+-MAX_ABS_LOG10_SHIFT) times the source
    frequency of the kept row nearest it (1.0 without a Frequency column).
    """
    df = temp_sweep_data.sort_values('Temperature')
    T = df['Temperature'].to_numpy()
    keep = wlf_window(T, Tg, C1, C2)
    n_dropped = int(np.count_nonzero(~keep))
    if n_dropped == 0 or not np.any(keep):
        return None
    omega = (df['Frequency'].to_numpy() if 'Frequency' in df.columns
             else np.ones(len(T)))
    kept = np.flatnonzero(keep)
    bound = MAX_ABS_LOG10_SHIFT
    temperatures, frequencies, phrases = [], [], []
    if np.any(~keep & (T < Tg)):
        cold = Tg - bound * C2 / (C1 + bound)
        temperatures.append(cold)
        frequencies.append(10.0 ** bound * omega[kept[0]])
        phrases.append(f"below {cold:.1f} °C")
    if np.any(~keep & (T > Tg)):
        hot = Tg + bound * C2 / (C1 - bound)
        temperatures.append(hot)
        frequencies.append(10.0 ** -bound * omega[kept[-1]])
        phrases.append(f"above {hot:.1f} °C")
    cut = ' and '.join(phrases)
    return {
        'warning': (
            f"WLF shift: dropped {n_dropped} of {len(T)} rows {cut}, where "
            f"|log10 a_T| > {bound:g} or the row is at or below the WLF "
            f"pole at {Tg - C2:.1f} °C (Tg − C2)."
        ),
        'notice': (f"{n_dropped} of {len(T)} rows dropped {cut} "
                   f"(vertical dashed line{'s' if len(phrases) > 1 else ''})"),
        'temperatures': temperatures,
        'frequencies': frequencies,
    }
