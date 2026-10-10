"""
Time-temperature superposition applied to a data frame: collapsing a
temperature sweep onto a frequency master curve, and scattering a master curve
back across a temperature axis.

`shift` supplies a_T(T); this module decides which rows survive it, how an
uploaded shift table is interpolated, and — for the reverse direction, which is
visualization only — what to fall back to when no usable model exists.
"""

import numpy as np
import pandas as pd
from scipy.interpolate import interp1d

from .shift import hybrid_shift, inverse_hybrid_shift, inverse_wlf_shift, wlf_shift


# Drop master-curve rows whose |log10(a_T)| exceeds this; near the WLF
# singularity (T → T_ref − C2) shift factors blow up and overflow the Prony fit.
MAX_ABS_LOG10_SHIFT = 15.0

# Reference frequency / temperature for the frequency-domain visualization's
# inverse-WLF scatter; arbitrary but stable so the temperature axis stays
# comparable across uploads.
VIS_REF_FREQUENCY_HZ = 1.0


def tts_temperature_to_frequency_V2(temp_sweep_data, shift_model, *,
                                    Tg=None, TC=None, C1=None, C2=None, Ea=None,
                                    shiftData=None):
    """
    Convert temperature-sweep viscoelastic data to frequency-sweep data via TTS.

    Computes a shift factor a_T per row and returns a new DataFrame at the
    reference temperature with shifted frequencies (Frequency * a_T). Rows are
    sorted by Temperature ascending before the shift is applied.

    The reference temperature is selected from shift_model: 'WLF' uses Tg
    (glass transition); 'hybrid' uses TC (WLF/Arrhenius crossover).

    Parameters:
        temp_sweep_data (pd.DataFrame): Input data with columns
            ['Temperature', "E'", "E''"], optionally including 'Frequency'
            for the per-row measurement frequency. If 'Frequency' is absent,
            1.0 Hz is assumed (typical for a fixed-frequency DMA temperature sweep).
        shift_model (str): Which shift function to apply. 'WLF' uses
            wlf_shift across all temperatures; 'hybrid' uses hybrid_shift
            (Arrhenius at or below TC, WLF above); 'manual' requires
            shiftData and uses it directly.
        Tg (float): WLF reference temperature (used when shift_model == 'WLF').
        TC (float): Hybrid WLF/Arrhenius crossover temperature (used when
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
        a_T = hybrid_shift(T, TC, C1, C2, Ea)
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

    T_ref = {'WLF': Tg, 'hybrid': TC}.get(shift_model)  # None for 'manual'

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


def tts_frequency_to_temperature_hybrid(
        freq_sweep_data: pd.DataFrame,
        omega_ref: float,
        TC: float,
        C1: float,
        C2: float,
        Ea: float,
) -> pd.DataFrame:
    """
    Convert frequency-sweep viscoelastic data to temperature-sweep data via
    inverse hybrid TTS.

    The hybrid analog of tts_frequency_to_temperature: for each row computes
    a_T = Frequency / omega_ref and inverts the hybrid Arrhenius/WLF model
    about TC (inverse_hybrid_shift) to find the temperature that would
    produce that shift factor. The returned DataFrame is at the reference
    frequency omega_ref.

    Parameters:
        freq_sweep_data (pd.DataFrame): Input data with columns
            ['Frequency', "E'", "E''"].
        omega_ref (float): Reference frequency for shifting.
        TC (float): WLF/Arrhenius crossover temperature in °C.
        C1 (float): WLF parameter C1.
        C2 (float): WLF parameter C2.
        Ea (float): Arrhenius activation energy in kJ/mol.

    Returns:
        pd.DataFrame: Temperature-sweep data at omega_ref with columns
        ['Frequency', 'Temperature', "E'", "E''"], sorted by Temperature with a
        fresh 0..N-1 index. Input freq_sweep_data is not mutated.

    Raises:
        ValueError: If the inverse-hybrid computation hits a singularity or a
            frequency lies beyond the model's WLF horizon (see
            inverse_hybrid_shift).
    """
    omega = freq_sweep_data['Frequency'].to_numpy()
    a_T = omega / omega_ref
    shifted_T = inverse_hybrid_shift(a_T, TC, C1, C2, Ea)

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
                                    Tg=None, TC=None, C1=None, C2=None, Ea=None,
                                    shiftData=None,
                                    omega_ref: float = VIS_REF_FREQUENCY_HZ) -> pd.DataFrame:
    """
    Convert a frequency master curve to a temperature sweep via inverse TTS.

    Mirror image of tts_temperature_to_frequency_V2, used to build the
    temperature-axis visualization for a frequency-domain upload. Selection of
    the inverse-shift model (shiftData wins, matching the forward V2):

        1. manual — shiftData present → invert the shift table
           (_freq_to_temp_via_shift_table).
        2. WLF    — shift_model == 'WLF' with Tg, C1, C2 all supplied →
           analytic inverse WLF (tts_frequency_to_temperature / inverse_wlf_shift).
        3. hybrid — shift_model == 'hybrid' with TC, C1, C2, Ea all supplied →
           analytic inverse hybrid (tts_frequency_to_temperature_hybrid /
           inverse_hybrid_shift).

    Anything else raises. This used to degrade silently to a universal-WLF
    view (the pre-V2 hardcoded behavior) because the conversion is
    visualization-only and there was no way to warn without failing the whole
    /extract/ response; that left users looking at curves synthesized from
    constants they never chose, with no signal. Unusable inputs are the
    user's to fix, so they now surface as the route's normal 400-with-message:

        - WLF or hybrid with an incomplete parameter set names what is
          missing — the anchor (Tg or TC) is required in this domain, it
          cannot be estimated from a master curve,
        - a WLF/hybrid singularity, a frequency beyond the hybrid's WLF
          horizon, or an uninvertible shift table propagates instead of
          being papered over.

    Parameters:
        freq_sweep_data (pd.DataFrame): Master curve with columns
            ['Frequency', "E'", "E''"].
        shift_model (str): 'WLF', 'hybrid', or 'manual'.
        Tg (float): WLF reference temperature (used when shift_model == 'WLF').
        TC (float): WLF/Arrhenius crossover temperature (used when
            shift_model == 'hybrid').
        C1 (float): WLF parameter C1 (used for 'WLF' and 'hybrid').
        C2 (float): WLF parameter C2 (used for 'WLF' and 'hybrid').
        Ea (float): Arrhenius activation energy in kJ/mol (used when
            shift_model == 'hybrid').
        shiftData: Optional shift-factor table {'Temperature': ..., 'a_T': ...};
            when usable it takes priority (manual path).
        omega_ref (float): Reference (physical) frequency; a_T == 1 there.

    Returns:
        pd.DataFrame: Temperature-sweep data at omega_ref with columns
        ['Frequency', 'Temperature', "E'", "E''"], sorted by Temperature.

    Raises:
        ValueError: If the shift table cannot be inverted, WLF or hybrid
            parameters are incomplete, or the inverse WLF/hybrid hits a
            singularity or the hybrid's WLF horizon.
    """
    if shiftData:
        try:
            return _freq_to_temp_via_shift_table(freq_sweep_data, shiftData, omega_ref)
        except (ValueError, KeyError, AssertionError) as exc:
            raise ValueError(
                "The uploaded shift-factor table could not be inverted to build "
                f"the temperature view ({exc}). Clean or replace the shift file, "
                "or switch to the WLF model."
            ) from exc
    if shift_model == 'manual':
        # Mirrors the forward transform's contract (which also raises here).
        raise ValueError(
            "Manual shift model selected but no shift-factor file was provided. "
            "Upload a shift-factor file or pick 'WLF'."
        )
    if shift_model == 'hybrid':
        missing = [name for name, val in
                   (('Tc', TC), ('C1', C1), ('C2', C2), ('Ea', Ea))
                   if val is None]
        if missing:
            raise ValueError(
                f"Hybrid needs {', '.join(missing)} to build the temperature "
                "view for frequency-domain data. Tc cannot be estimated from "
                "a master curve — enter it directly."
            )
        return tts_frequency_to_temperature_hybrid(
            freq_sweep_data, omega_ref, TC, C1, C2, Ea)
    if shift_model == 'WLF':
        missing = [name for name, val in
                   (('Tg', Tg), ('C1', C1), ('C2', C2)) if val is None]
        if missing:
            raise ValueError(
                f"WLF needs {', '.join(missing)} to build the temperature view "
                "for frequency-domain data. Tg cannot be estimated from a "
                "master curve — enter it directly."
            )
        return tts_frequency_to_temperature(freq_sweep_data, omega_ref, Tg, C1, C2)
    assert False, (
        f"Unreachable shift_model {shift_model!r}: update_line_chart's intent "
        "gate admits only a requested transform here."
    )
