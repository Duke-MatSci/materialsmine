import numpy as np
import pandas as pd
from scipy.optimize import minimize
from scipy.signal import find_peaks

float_correction = 1e-7
R = 8.31446261815324  # J/(mol*K)


def prony_basis(freq, relaxations, solid):
    dt = dimensionless_time = np.outer(freq, relaxations)

    dt2 = dt * dt
    dt2p1 = dt2 + 1
    ep_basis = dt2 / dt2p1
    epp_basis = dt / dt2p1

    if solid:
        ep_basis=np.concatenate(
            (np.ones_like(ep_basis, shape=(len(ep_basis), 1)), ep_basis), axis=1
        )
        epp_basis=np.concatenate(
            (np.zeros_like(epp_basis, shape=(len(epp_basis), 1)), epp_basis), axis=1
        )

    return np.concatenate((ep_basis, epp_basis), axis=0)


def prony_relaxation_space(tau_min, tau_max, N):
    return np.logspace(np.log10(tau_min), np.log10(tau_max), N, endpoint=True)


def compute_complex(tau_i,E_i):
    """
    Compute the complex values of a given dataset.

    Parameters:
        tau_i (array-like): The time constants for each energy value.
        E_i (array-like): The energy values corresponding to each time constant.

    Returns:
        pandas.DataFrame: A DataFrame containing the computed frequency, real and imaginary values.
    """
    omega = np.logspace(-np.log10(np.max(tau_i)), -np.log10(np.min(tau_i)), 1000)
    basis = prony_basis(omega,tau_i, solid=not (len(E_i) == len(tau_i)))
    complex = basis @ E_i
    real, imag = complex.reshape(2,1000)

    return pd.DataFrame(data={"Frequency":omega, "E Storage":real, "E Loss":imag})


def compute_relaxation_modulus(tau_i,E_i):
    """
    Compute the relaxation modulus using the given parameters.

    Parameters:
        tau_i (array-like): The time constants for each energy value.
        E_i (array-like): The energy values corresponding to each time constant.

    Returns:
        pd.DataFrame: A DataFrame containing the computed relaxation curve with two columns: "Time" and "E".
    """
    t = np.logspace(np.log10(np.min(tau_i)), np.log10(np.max(tau_i)), 1000)
    dt = dimensionless_time = np.outer(t, 1/tau_i)
    solid = not (len(E_i) == len(tau_i))
    E = np.exp(-dt) @ E_i[solid:]
    return pd.DataFrame(data={"Time":t, "E":E})


def compute_relaxation_spectrum(tau_i,E_i):
    """
    Compute the relaxation spectrum of the given data.

    Parameters:
        tau_i (array-like): The time constants for each energy value.
        E_i (array-like): The energy values corresponding to each time constant.

    Returns:
        pd.DataFrame: A DataFrame containing the computed relaxation spectrum values with the
        following columns:
            - Time: The time values.
            - H: The computed relaxation spectrum values.
    """
    t = np.logspace(np.log10(np.min(tau_i)), np.log10(np.max(tau_i)), 1000)
    dt = dimensionless_time = np.outer(t, 1/tau_i)
    solid = not (len(E_i) == len(tau_i))
    H = (dt * np.exp(-dt)) @ E_i[solid:]
    return pd.DataFrame(data={"Time":t, "H":H})


def prony_objective(logcoefs, data, std, basis, smoothness, solid):
    coefs = np.exp(logcoefs)
    estimate = basis @ coefs
    resid = (data - estimate) / std
    loss = resid@resid
    if smoothness:
        curve = smoothness * np.diff(logcoefs[solid:], n=2)
        loss += curve@curve

    grad = -(basis.T @ (resid / std))

    # apply chain rule because these are functions of
    # coefs rather than logcoefs
    grad *= coefs

    if smoothness:
        diffs = smoothness * curve  # smoothness*np.diff(logcoefs[solid:], n=2)
        grad_slice = grad[solid:]
        grad_slice[:-2] += diffs
        grad_slice[1:-1] -= 2 * diffs
        grad_slice[2:] += diffs

    return loss, 2 * grad  # more chain rule (squared errors)


def smooth_prony_fit(omega, E_stor, E_loss, N, smoothness, solid=True):
    """
    Perform a fit using the Prony method with coefficient smoothing.
    
    Parameters:
    - omega: ndarray
        The input array containing frequency data.
    - E_stor: ndarray
        The input array containing storage modulus data.
    - E_loss: ndarray
        The input array containing loss modulus data.
    - N: int
        The number of points to generate in the logarithmic time grid.
    - smoothness: float
        Amount of smoothing regularization to apply to the log-coefficients
    - solid: bool
        Whether to add an extra coefficient for solid-like behavior
    
    Returns:
    - tuple
        A tuple containing the following elements:
        - tau_i: ndarray
            The logarithmic time grid.
        - E_i: ndarray
            The fitted coefficients.
    """

    tau_max = 1 / np.min(omega)
    tau_min = 1 / np.max(omega)
    tau_i = prony_relaxation_space(tau_min, tau_max, N)

    basis = prony_basis(omega, tau_i, solid)

    y = np.concatenate((E_stor,E_loss))

    y_std = np.absolute(E_stor+1.0j*E_loss)
    y_std *= 0.2 # TODO: make this an input to the function
    y_std = np.concatenate((y_std, y_std))

    with np.errstate(over='ignore', invalid='ignore'):
        result = minimize(
            fun=prony_objective,
            x0=np.full(N+solid,7.) ,
            args=(y, y_std, basis, smoothness, solid),
            jac=True,
        )
    E_i = np.exp(result.x)
    
    return tau_i, E_i

# OLD Method
# def wlf_shift(T, T_ref, C1, C2):
#     """Calculate shift factor a_T using the WLF equation."""
#     print(f"T: {T}")
#     print(f"T_ref: {T_ref}")
#     print(f'C1: {C1}')
#     print(f'C2: {C2}')
#     return 10 ** (-C1 * (T - T_ref) / (C2 + (T - T_ref)))

# With error checking
def wlf_shift(T, T_ref, C1, C2):
    """
    Calculate shift factor a_T using the WLF equation with robust checks.

    Raises:
        ValueError: if a divide-by-zero, overflow, or non-finite result is detected.
    """
    # Ensure numeric numpy arrays (works for scalars too)
    T_arr = np.array(T, dtype=np.float64)
    T_ref = float(T_ref)
    C1 = float(C1)
    C2 = float(C2)

    # denom = C2 + (T - T_ref)
    denom = C2 + (T_arr - T_ref)

    # Check for exact zero in denom (handles scalars and arrays)
    # Use an absolute tolerance for floating point near-zero
    if np.any(np.isclose(denom, 0.0, atol=1e-12)):
        # Raise ValueError so Flask route will return the JSON message you asked for
        raise ValueError(
            "divide by zero detected when calculating WLF. Please adjust parameters or manually provide shift factors."
        )

    # Compute with error state catching to detect overflow/invalid results
    with np.errstate(divide='raise', invalid='raise', over='raise'):
        try:
            exponent = -C1 * (T_arr - T_ref) / denom
            a_T = np.power(10.0, exponent)

            # Ensure finite output
            if not np.all(np.isfinite(a_T)):
                raise FloatingPointError("Non-finite result in WLF computation")

            # If input was scalar, return scalar
            if a_T.size == 1:
                return float(a_T)
            return a_T

        except (FloatingPointError, ZeroDivisionError) as e:
            # Normalize all numeric errors to the ValueError your route expects
            raise ValueError(
                "divide by zero detected when calculating WLF. Please adjust parameters or manually provide shift factors."
            )

def arr_shift(T, T_ref, Ea):
    """Calculate shift factor a_T using the Arrhenius equation."""
    T_ref_K = T_ref + 273.15
    T_temp_arr_K = T + 273.15

    Ea_J_per_mol = Ea * 1000.0
    m = Ea_J_per_mol / (2.303 * R)
    a_T = 10 ** (m * ((1.0 / T_temp_arr_K) - (1.0 / T_ref_K)))
    return a_T

def hybrid_shift(T, T_ref, C1, C2, Ea, ascending = True):
    # temperature values must be ordered!
    # WLF
    print('before mask')
    mask_temp_wlf = (
        np.isfinite(T) &
        (T > (T_ref + float_correction))
    )
    print('before mask 2')
    print(f'T = {T}')
    print(f'mask = {mask_temp_wlf}')
    T_wlf = T[mask_temp_wlf]
    print(f'T_wlf: {T_wlf}')
    print("before WLF_shift")
    a_T_wlf = wlf_shift(T_wlf, T_ref, C1, C2)
    print("after WLF_shift")

    # Arrhenius
    mask_temp_arr = (
        np.isfinite(T) &
        (T <= (T_ref + float_correction))
    )
    T_arr = T[mask_temp_arr]
    print(f'T_arr: {T_wlf}')
    print("before arr_shift")
    a_T_arr = arr_shift(T_arr, T_ref, Ea)
    print("after arr_shift")

    # determine which order to concatenate models based on ascending or descending order of temperature values
    if ascending:
        a_T = np.concatenate((a_T_arr, a_T_wlf))
    else:
        a_T = np.concatenate((a_T_wlf, a_T_arr))

    return a_T

def inverse_wlf_shift(a_T, T_ref, C1, C2):
    """calculate the shifted temperature given a shift factor"""
    return (np.log10(a_T)*(T_ref-C2)+C1*T_ref)/(np.log10(a_T)+C1)

def tts_temperature_to_frequency(temp_sweep_data, T_ref, C1, C2, calcShifts=True):
    """
    Convert temperature sweep viscoelastic data to frequency sweep data using TTS.

    Parameters:
        temp_sweep_data (pd.DataFrame): Data with columns ['Temperature', 'Frequency', "E'", "E''"].
        T_ref (float): Reference temperature for shifting.
        C1 (float): WLF equation parameter 1.
        C2 (float): WLF equation parameter 2.

    Returns:
        pd.DataFrame: Frequency sweep data at T_ref.
    """
    shifted_data = []
    i = 0

    for T, group in temp_sweep_data.groupby('Temperature'):
        if not calcShifts:
            a_T = group['a_T']
        else:
            a_T = wlf_shift(T, T_ref, C1, C2)

        shifted_freq = group['Frequency'] * a_T
        shifted_data.append(pd.DataFrame({
            'Frequency': shifted_freq,
            'Temperature': T_ref,
            "E'": group["E'"],
            "E''": group["E''"]
        }))
        i = i+1

    combined_data = pd.concat(shifted_data).sort_values('Frequency')

    return combined_data

def tts_temperature_to_frequency_V2(temp_sweep_data, T_ref, C1, C2, Ea, shift_model, shiftData):
    """
    Convert temperature sweep viscoelastic data to frequency sweep data using TTS.

    Parameters:
        temp_sweep_data (pd.DataFrame): Data with columns ['Temperature', 'Frequency', "E'", "E''"].
        T_ref (float): Reference temperature for shifting.
        C1 (float): WLF equation parameter 1.
        C2 (float): WLF equation parameter 2.

    Returns:
        pd.DataFrame: Frequency sweep data at T_ref.
    """
    # sort T ascending:
    temp_sweep_data = temp_sweep_data.sort_values('Temperature')

    shifted_data = []
    i = 0

    T = temp_sweep_data['Temperature']
    if not shiftData:
        if shift_model == 'WLF':
            print("before WLF_shift 1")
            a_T = wlf_shift(T, T_ref, C1, C2)
            print("after WLF_shift 1")
        elif shift_model == 'hybrid':
            print("before hybrid_shift")
            a_T = hybrid_shift(T, T_ref, C1, C2, Ea)
            print("after hybrid_shift")
    else:
        # use manual shift values
        # DONE: replace with shiftData['a_T']
        # a_T = group['a_T']
        # possible TODO: offer to use interpolated shift factor values when file is provided
        sd_df = pd.DataFrame(shiftData)
        a_T = sd_df['a_T']

    temp_sweep_data['a_T'] = a_T

    for T, group in temp_sweep_data.groupby('Temperature'):
        print(f'group: {group}')
        # moved out of grouping so a_T can be calculated by batch
        # if not shiftData:
        #     if shift_model == 'WLF':
        #         print("before WLF_shift")
        #         a_T = wlf_shift(T, T_ref, C1, C2)
        #         print("after WLF_shift")
        #     elif shift_model == 'hybrid':
        #         print("before hybrid_shift")
        #         a_T = hybrid_shift(T, T_ref, C1, C2, Ea)
        #         print("after hybrid_shift")
        # else:
        #     # use manual shift values
        #     # DONE: replace with shiftData['a_T']
        #     # a_T = group['a_T']
        #     # possible TODO: offer to use interpolated shift factor values when file is provided
        #     sd_df = pd.DataFrame(shiftData)
        #     a_T = sd_df['a_T']

        # shifted_freq = group['Frequency'] * a_T
        shifted_freq = group['Frequency'] * group['a_T']
        shifted_data.append(pd.DataFrame({
            'Frequency': shifted_freq,
            'Temperature': T_ref,
            "E'": group["E'"],
            "E''": group["E''"]
        }))
        i = i+1

    combined_data = pd.concat(shifted_data).sort_values('Frequency')

    return combined_data

def tts_frequency_to_temperature(freq_sweep_data, omega_ref, C1, C2, calcShifts=True):
    """
    Convert temperature sweep viscoelastic data to frequency sweep data using TTS.

    Parameters:
        freq_sweep_data (pd.DataFrame): Data with columns ['Temperature', 'Frequency', "E'", "E''"].
        omega_ref (float): Reference frequency for shifting.
        C1 (float): WLF equation parameter 1.
        C2 (float): WLF equation parameter 2.

    Returns:
        pd.DataFrame: Temperature sweep data at omega_ref.
    """
    shifted_data = []
    i = 0

    for omega, group in freq_sweep_data.groupby('Frequency'):
        a_T = omega/omega_ref
        T_ref = group["Temperature"]

        if not calcShifts:
            print("not implemented error")
            # not implemented but would need shift temps
            # a_T = group['a_T']
        else:
            # a_T = wlf_shift(T, T_ref, C1, C2)
            shifted_T = inverse_wlf_shift(a_T, T_ref, C1, C2)

        # shifted_freq = group['Frequency'] * a_T
        shifted_data.append(pd.DataFrame({
            'Frequency': omega_ref,
            'Temperature': shifted_T,
            "E'": group["E'"],
            "E''": group["E''"]
        }))
        i = i+1

    combined_data = pd.concat(shifted_data).sort_values('Temperature')

    return combined_data

def estimate_Tg(uploadData, domain):
    # --- Compute tan delta ---
    # df = uploadData.copy()
    df = pd.DataFrame(uploadData)
    print(df)
    # df["tan_delta"] = df["E''"] / df["E'"]
    df["tan_delta"] = df["E Loss"] / df["E Storage"]

    # --- Use scipy.signal.find_peaks for robust peak detection ---
    peaks, properties = find_peaks(df["tan_delta"], prominence=0.01)  # adjust 'prominence' if needed

    if len(peaks) == 0:
        raise ValueError("No tanδ peaks found to estimate Tg. Try lowering the prominence parameter or enter Tg manually.")

    # Pick the most prominent (highest tan delta) peak
    peak_idx = peaks[np.argmax(df["tan_delta"].iloc[peaks])]
    if domain == "temperature":
        Tg = df.loc[peak_idx, "Temperature"]
    elif domain == "frequency":
        Tg = df.loc[peak_idx, "Frequency"]
    tan_delta_peak = df.loc[peak_idx, "tan_delta"]
    return Tg

def estimate_TL(uploadData, domain):
    # df = uploadData.copy()
    df = pd.DataFrame(uploadData)
    # --- Use scipy.signal.find_peaks for robust peak detection on loss curve---
    # peaks, properties = find_peaks(df["E''"], prominence=0.01)  # adjust 'prominence' if needed
    peaks, properties = find_peaks(df["E Loss"], prominence=0.01)  # adjust 'prominence' if needed

    if len(peaks) == 0:
        raise ValueError("No Loss peaks found to estimate TL. Try lowering the prominence parameter or enter TL manually.")

    # Pick the most prominent (highest tan delta) peak
    # peak_idx = peaks[np.argmax(df["E''"].iloc[peaks])]
    peak_idx = peaks[np.argmax(df["E Loss"].iloc[peaks])]
    if domain == "temperature":
        TL = df.loc[peak_idx, "Temperature"]
    elif domain == "frequency":
        TL = df.loc[peak_idx, "Frequency"]
    # loss_peak = df.loc[peak_idx, "E''"]
    loss_peak = df.loc[peak_idx, "E Loss"]
    return TL
