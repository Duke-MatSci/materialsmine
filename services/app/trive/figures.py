"""
Everything that turns fit results into the payload the browser renders: the
plotly figures, the captions stamped on them, the thinning that keeps a
41k-row upload from bloating the response, and the coefficient table that
accompanies the figures.

Presentation only — nothing here changes a number the fit produced. `chart`
orchestrates the calls; the figures go out as JSON via the route.
"""

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

from .prony import compute_complex, compute_relaxation_modulus
from .shift import hybrid_shift, wlf_log10_shift
from .tts import MAX_ABS_LOG10_SHIFT


# Experiment traces with more rows than this are thinned before plotting —
# broadband uploads (e.g. 41k-row chirp master curves) otherwise bloat the
# response JSON and bog down browser-side plotly rendering. This affects the
# FIGURES ONLY: the Prony fit and the coefficient table always use every row.
# ~2000 points per trace is far denser than any screen resolves.
_PLOT_MAX_POINTS = 2000

# Figure notices — the decimation warning and the fit-quality readout — are gray
# right-aligned captions in paper coordinates above the plot, one per row. They
# cannot share a row: each runs 85-100 characters, so even anchored to opposite
# edges they collided in the middle at every width the frontend renders at. Row
# 0 sits at _NOTICE_BASE_Y nearest the plot; every row above it needs
# _NOTICE_ROW_MARGIN more headroom than the _NOTICE_TOP_MARGIN plotly express
# leaves on these faceted figures.
_NOTICE_BASE_Y = 1.06
_NOTICE_ROW_STEP = 0.065
_NOTICE_TOP_MARGIN = 60
_NOTICE_ROW_MARGIN = 22
_NOTICE_NAME = 'figure-notice'


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


def _stamp_notice(figs, text: str) -> None:
    """
    Caption each figure above the plot area, on the next free row.

    Notices stack upward in call order: each counts the notices already on the
    figure and takes the row above them, so two long captions never share a
    line while a solitary caption still sits on the bottom row. The top margin
    grows to match, since a stacked row would otherwise be clipped.

    All captions are right-aligned — ragged left, flush right. The fit-quality
    readout's numbers change width from one fit to the next, and anchoring the
    right edge keeps that from shifting the whole block sideways as a user drags
    the sliders.

    The captions ride inside the figures, so to_json carries them to the browser
    with no frontend work. The MARGIN does need help getting there: PlotlyView
    imposes its own layout on every chart, so it merges the server's margin over
    its defaults specifically to let the headroom below survive the trip.

    Each caption is tagged with a name so the row count sees only these: plotly
    express has already put the facet titles in layout.annotations.

    Parameters:
        figs: Iterable of plotly Figures to caption.
        text (str): Caption text.
    """
    for fig in figs:
        row = sum(1 for a in fig.layout.annotations if a.name == _NOTICE_NAME)
        fig.add_annotation(
            name=_NOTICE_NAME, text=text,
            xref='paper', yref='paper',
            x=1.0, y=_NOTICE_BASE_Y + row * _NOTICE_ROW_STEP,
            xanchor='right', yanchor='bottom', showarrow=False,
            font=dict(size=11, color='gray'),
        )
        fig.update_layout(margin_t=max(
            fig.layout.margin.t or _NOTICE_TOP_MARGIN,
            _NOTICE_TOP_MARGIN + row * _NOTICE_ROW_MARGIN,
        ))


def _annotate_decimation(figs, percent) -> None:
    """
    Stamp a decimation notice onto each figure when plot thinning occurred.

    No-op when percent is None. Stamped after the fit-quality readout, so on
    the figures that carry both this one takes the upper row: it says the same
    thing on every slider move, where the readout is the number being watched.

    Parameters:
        figs: Iterable of plotly Figures to annotate.
        percent: Integer percentage of experiment rows dropped, or None.
    """
    if percent is None:
        return
    _stamp_notice(figs, (
        f"too many data points, plot traces decimated by {percent}% for speed"
        " (the fit uses all points)"
    ))


def _annotate_fit_quality(figs, quality) -> None:
    """
    Stamp the fit-quality readout onto each figure that overlays fit on data.

    Stamped before the decimation notice so it takes the bottom row, nearest
    the plot — see _stamp_notice. Sharing one row with that notice was not
    enough: both strings are long enough to cross the middle of the plot.

    All three numbers are "lower is better". Fields that are None are omitted,
    so an unsmoothed fit shows the misfit alone (with no smoothing there is
    neither a posterior over the smoothing weight nor a defined roughness).
    Curvature sits in the middle, next to chi-squared: those two are the L-curve
    coordinates a user trades off when sweeping the smoothness slider.

    Parameters:
        figs: Iterable of plotly Figures to annotate.
        quality (_FitQuality): Scores from smooth_prony_fit, or None to no-op.
    """
    if quality is None:
        return
    parts = []
    if quality.chi2_reduced is not None:
        parts.append(f"misfit (χ²/ν) = {quality.chi2_reduced:.3g}")
    if quality.curvature is not None:
        parts.append(f"curvature (⟨H″²⟩) = {quality.curvature:.3g}")
    if quality.neg_log_posterior is not None:
        parts.append(
            f"surprisal (−log π(λ)) = {quality.neg_log_posterior:.4g}"
        )
    if not parts:
        return
    _stamp_notice(figs, " | ".join(parts + ["lower is better"]))


def _place_tan_delta_axis(fig) -> None:
    """
    Keep the tan delta facet's tick labels clear of both neighbors.

    tan delta is dimensionless and cannot share the modulus panel's scale, so
    its facet needs tick labels of its own. On the default left side they sit
    in the narrow gap between the facets and overlap the plot to their left, so
    they go on the outside edge instead — the only place they fit without
    taking width from the plots.

    That lands them where the legend sits: plotly's automargin reserves room on
    the right for the legend but not for tick labels, so the two are drawn over
    each other. Nudging the legend past its 1.02 default clears the labels, and
    automargin widens the margin to match, so nothing runs off the figure.

    The offset can only be given in paper units — a fraction of the plot width —
    while the labels it has to clear are a fixed pixel width, so the gap closes
    as the figure narrows. 1.10 keeps them apart down to roughly a 500px figure,
    which covers every width PlotlyView asks for on a desktop viewport.

    Parameters:
        fig: Two-facet Figure whose second column is tan delta.
    """
    fig.update_yaxes(side='right', col=2)
    fig.update_layout(legend_x=1.10)


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
        value_name="Modulus (Pa)",
    )
    df_melt["Type"] = "Experiment"

    fig4 = px.line(
        df_melt, x="Temperature", y="Modulus (Pa)",
        log_y=True,
        facet_col='Modulus',
        color="Type", line_dash="Type",
        labels={"Temperature": "Temperature (C)"},
    )

    df41_concat = df_melt.copy()
    df41_tand = pd.DataFrame()
    df41_tand["Temperature"] = df41_concat[df41_concat["Modulus"] == "E''"]["Temperature"]
    df41_tand["Type"] = df41_concat[df41_concat["Modulus"] == "E''"]["Type"]
    df41_tand["Modulus (Pa)"] = (
        df41_concat[df41_concat["Modulus"] == "E''"]["Modulus (Pa)"].to_numpy() /
        df41_concat[df41_concat["Modulus"] == "E'"]["Modulus (Pa)"].to_numpy()
    )
    df41_tand['Modulus'] = 'tan delta'
    df41_concat = pd.concat([df41_concat, df41_tand], ignore_index=True)

    fig41 = px.line(
        df41_concat[df41_concat['Modulus'] != "E''"],
        x="Temperature", y="Modulus (Pa)",
        facet_col='Modulus',
        color="Type", line_dash="Type",
        labels={"Temperature": "Temperature (C)"},
    )
    fig41.update_yaxes(matches=None, showticklabels=True)
    fig41.update_yaxes(type="log", col=1)
    _place_tan_delta_axis(fig41)
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
        N_nz (int): Number of nonzero DECAYING Prony coefficients, i.e. the
            equilibrium term excluded; used in trace names. Matches the row
            count of the coefficient table _build_coef_records returns.

    Returns:
        tuple: (fig1, fig11) where fig1 is E' / E'' vs Frequency and fig11 is
        E' / tan-delta vs Frequency.
    """
    complex_df = compute_complex(tau_i, E_i)
    x_col, y_col, z_col = df.columns[0], df.columns[1], df.columns[2]
    df_melt = pd.melt(
        df, id_vars=[x_col], value_vars=[y_col, z_col],
        var_name='Modulus', value_name="Modulus (Pa)",
    )
    df_melt["Type"] = "Experiment"

    cx_x, cx_y, cx_z = complex_df.columns[0], complex_df.columns[1], complex_df.columns[2]
    complex_melt = pd.melt(
        complex_df, id_vars=[cx_x], value_vars=[cx_y, cx_z],
        var_name='Modulus', value_name="Modulus (Pa)",
    )
    complex_melt["Type"] = f"{N_nz}-Term Prony"

    df_concat = pd.concat([df_melt, complex_melt], ignore_index=True)

    fig1 = px.line(
        df_concat, x=cx_x, y="Modulus (Pa)",
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
    df11_tand["Modulus (Pa)"] = (
        df11_concat[df11_concat["Modulus"] == "E Loss"]["Modulus (Pa)"].to_numpy() /
        df11_concat[df11_concat["Modulus"] == "E Storage"]["Modulus (Pa)"].to_numpy()
    )
    df11_tand['Modulus'] = 'tan delta'
    df11_concat = pd.concat([df11_concat, df11_tand], ignore_index=True)

    fig11 = px.line(
        df11_concat[df11_concat['Modulus'] != "E Loss"],
        x="Frequency", y="Modulus (Pa)",
        log_x=True,
        facet_col='Modulus',
        color="Type", line_dash="Type",
        line_dash_map={"Experiment": "solid", f"{N_nz}-Term Prony": "dash"},
        labels={"Frequency": "Frequency (Hz)"},
    )
    fig11.update_yaxes(matches=None, showticklabels=True)
    fig11.update_yaxes(type="log", col=1)
    _place_tan_delta_axis(fig11)
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
        N_nz (int): Number of nonzero DECAYING Prony coefficients, i.e. the
            equilibrium term excluded; used in trace names. fig3 splits that
            term into its own long-term-modulus trace, so the same count labels
            both figures.
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
    spectrum_df = pd.DataFrame({
        "Time": tau_i,
        "E": E_i[solid:],
        "Type": f"{N_nz}-Term Prony",
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


# Rows in the model-only shift table (no measured temperatures to anchor to,
# so the dense evaluation grid is thinned to a CSV-friendly size).
_SHIFT_TABLE_MAX_ROWS = 50


def _build_shift_figure(shiftData, shift_model, Tg, TC, C1, C2, Ea, a_T_ref,
                        data_T_range, chi2_reduced) -> tuple:
    """
    Build the shift-factor figure (a_T vs Temperature, log-y) and its table.

    Draws the uploaded shift factors as markers ("Experiment") when a shift
    file is present, and the WLF or hybrid model as a dashed curve when its
    parameters are complete — either alone is enough for a figure. The curve
    is evaluated on a dense grid spanning the union of the shift file's and
    the viscoelastic data's temperature ranges, and masked to the same
    |log10 a_T| <= MAX_ABS_LOG10_SHIFT window the transform applies, so a
    nearby WLF pole shows as a gap instead of distorting the axis (or, for
    hybrid, raising — see below).

    Parameters:
        shiftData: Optional {'Temperature': ..., 'a_T': ...} mapping from
            upload_init(..., 'shift'); falsy for none.
        shift_model (str): 'WLF', 'hybrid', 'manual', or 'none'/None. Only
            'WLF' and 'hybrid' can draw a model curve.
        Tg, TC, C1, C2, Ea: Shift-model parameters; the curve is skipped
            unless its model's full set is present (Tg/C1/C2 for WLF,
            TC/C1/C2/Ea for hybrid).
        a_T_ref (float): Vertical offset for the model curve — the data's
            shift factor at the model's anchor, co-fitted by
            fit_wlf_coefficients (at Tg) or fit_hybrid_coefficients (at TC).
            None falls back to 1.0, which is right when no shift file was
            fitted (the model is then its own reference) and wrong for a file
            referenced anywhere else.
        data_T_range (tuple): (min, max) temperature of the viscoelastic
            data, or None when no temperature axis exists.
        chi2_reduced (float): Fit-time reduced chi-squared to stamp on the
            figure, or None for no stamp. Passed through from the client
            because only the fit (in /fit-shift/) knows how many parameters
            were free; recomputing here would use a different dof convention.

    Returns:
        tuple: (fig, records) — the figure (empty go.Figure() when neither
        markers nor curve are drawable, matching the other conditional
        figures) and the table rows behind it: at the measured temperatures
        ({'Temperature', 'a_T (measured)', 'a_T (model)'}) when a shift file
        is present, else the masked model grid thinned to
        _SHIFT_TABLE_MAX_ROWS rows of {'Temperature', 'a_T (model)'}. All
        values are Python floats (the route serializes with stdlib json,
        which rejects numpy scalars); 'a_T (model)' is None where the model
        is absent or outside the valid window.
    """
    T_meas = a_meas = None
    if shiftData:
        shift_df = pd.DataFrame(shiftData)
        # The legacy positional shift form has no Temperature column; without
        # one there is nowhere on the T axis to put the markers, so only the
        # model curve (if any) is drawn. The temperature branch synthesizes
        # the pairing before calling, so its positional markers still appear.
        if 'Temperature' in shift_df.columns:
            T_meas = shift_df['Temperature'].to_numpy(dtype=float)
            a_meas = shift_df['a_T'].to_numpy(dtype=float)

    curve_ready = (
        (shift_model == 'WLF'
         and Tg is not None and C1 is not None and C2 is not None)
        or (shift_model == 'hybrid'
            and TC is not None and C1 is not None and C2 is not None
            and Ea is not None)
    )

    def eval_log10(T_arr):
        """log10(a_T) of the model at T_arr; non-finite/out-of-window -> nan."""
        if shift_model == 'WLF':
            with np.errstate(divide='ignore', invalid='ignore'):
                log10_a = wlf_log10_shift(
                    T_arr, Tg, C1, C2,
                    a_T_ref if a_T_ref is not None else 1.0,
                )
        else:
            # hybrid_shift raises ValueError at a hand-entered pole (fitted
            # parameters cannot reach one: C2 is floored at 1 and its WLF
            # branch only sees T > TC). No curve is better than a 500.
            try:
                log10_a = np.log10(hybrid_shift(
                    T_arr, TC, C1, C2, Ea,
                    a_T_ref if a_T_ref is not None else 1.0, True,
                ))
            except ValueError:
                return np.full_like(T_arr, np.nan)
        return np.where(
            np.isfinite(log10_a) & (np.abs(log10_a) <= MAX_ABS_LOG10_SHIFT),
            log10_a, np.nan,
        )

    frames = []
    if T_meas is not None:
        frames.append(pd.DataFrame({
            'Temperature': T_meas, 'a_T': a_meas, 'Type': 'Experiment',
        }))
    model_label = f"{shift_model} fit"
    grid_log10 = None
    if curve_ready:
        spans = [(float(np.min(T_meas)), float(np.max(T_meas)))] \
            if T_meas is not None else []
        if data_T_range is not None:
            spans.append((float(data_T_range[0]), float(data_T_range[1])))
        if spans:
            grid = np.linspace(min(lo for lo, _ in spans),
                               max(hi for _, hi in spans), 200)
            grid_log10 = eval_log10(grid)
            keep = np.isfinite(grid_log10)
            if np.any(keep):
                frames.append(pd.DataFrame({
                    'Temperature': grid[keep],
                    'a_T': 10.0 ** grid_log10[keep],
                    'Type': model_label,
                }))
            else:
                grid_log10 = None

    if not frames:
        return go.Figure(), []

    fig = px.line(
        pd.concat(frames, ignore_index=True),
        x='Temperature', y='a_T',
        log_y=True,
        color='Type', line_dash='Type',
        line_dash_map={'Experiment': 'solid', model_label: 'dash'},
        labels={'Temperature': 'Temperature (C)',
                # Plotly renders HTML in axis titles, so the subscript can be
                # a real capital T (the tab label makes do with Unicode ₜ).
                'a_T': 'Shift Factor, a<sub>T</sub>'},
    )
    fig.update_traces(mode='markers', selector=dict(name='Experiment'))
    fig.update_layout(
        autosize=False, margin=dict(l=80, r=60, t=60, b=80),
        legend_title='Type',
    )
    fig.update_yaxes(exponentformat='power')
    if chi2_reduced is not None:
        _stamp_notice((fig,), f"misfit (χ²/ν) = {chi2_reduced:.3g} | lower is better")

    if T_meas is not None:
        model_at_meas = eval_log10(T_meas) if curve_ready \
            else np.full_like(T_meas, np.nan)
        records = [
            {'Temperature': float(t), 'a_T (measured)': float(m),
             'a_T (model)': None if np.isnan(v) else float(10.0 ** v)}
            for t, m, v in zip(T_meas, a_meas, model_at_meas)
        ]
    else:
        keep = np.isfinite(grid_log10)
        step = max(1, int(np.ceil(np.count_nonzero(keep) / _SHIFT_TABLE_MAX_ROWS)))
        records = [
            {'Temperature': float(t), 'a_T (model)': float(10.0 ** v)}
            for t, v in zip(grid[keep][::step], grid_log10[keep][::step])
        ]
    return fig, records
