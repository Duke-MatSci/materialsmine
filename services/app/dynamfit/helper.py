import numpy as np
import pandas as pd
from scipy.interpolate import interp1d
from sklearn import linear_model


def real_basis(omega,tau):
    """
	Calculates N(number of relaxation time units) real basis functions evaluated at M frequency points.

	Parameters:
	- omega: The frequency points. Shape (M,).
	- tau: The relaxation time units. Shape (N,).

	Returns:
	- result: The calculated real basis functions. Shape (M, N).
	"""
    omega = np.expand_dims(omega,axis=1)
    tau = np.expand_dims(tau,axis=0)
    return (omega**2*tau**2)/(1+omega**2*tau**2)

	
def imag_basis(omega,tau): ##calculates N imaginary basis functions evaluated at M frequency points
    """
	Calculates N imaginary basis functions evaluated at M frequency points.

	Parameters:
	- omega: 1-D array-like
		An array of shape (M,) representing the frequency points.
	- tau: 1-D array-like
		An array of shape (N,) representing the basis function parameters.

	Returns:
	- result: ndarray
		An array of shape (M,N) representing the calculated imaginary basis functions.

	"""
    omega = np.expand_dims(omega,axis=1) ##shape (M,1)
    tau = np.expand_dims(tau,axis=0) ##shape (1,N)
    return (omega*tau)/(1+omega**2*tau**2) ##shape (M,N)

def compute_prony2(data,tau,w):
    """
    Compute the Prony2 approximation for the given data.

    Parameters:
    - data: numpy array of shape (n, 2)
        The input data containing the frequency and complex amplitude values.
    - tau: float
        The time constant parameter for the Prony2 approximation.
    - w: numpy array of shape (m,)
        The weight vector for the Prony2 approximation.

    Returns:
    - approximation: numpy array of shape (n, 4)
        The Prony2 approximation of the input data, where each row contains the
        frequency, real approximation, imaginary approximation, and complex
        amplitude values.
    """
    omega = data[:,0]
    eps_inft = data[0,1]
    real_approximation = np.expand_dims(np.add(np.matmul(real_basis(omega,tau),w),eps_inft),axis=1)
    imag_approximation = np.expand_dims(np.matmul(imag_basis(omega,tau),w),axis=1)
    approximation = np.concatenate((np.expand_dims(omega,axis=1),real_approximation,imag_approximation),axis=1)
    return approximation

def compute_complex(data,tau,w):
    """
    Compute the complex values of a given dataset.

    Parameters:
        data (numpy.ndarray): The input data containing frequency and epsilon values.
        tau (float): The tau value used for computations.
        w (numpy.ndarray): The weight vector used for computations.

    Returns:
        pandas.DataFrame: A DataFrame containing the computed frequency, real and imaginary values.
    """
    omega = data[:,0]
    eps_inft = data[0,1]
    real = (real_basis(omega,tau) @ w) + eps_inft
    imag = (imag_basis(omega,tau) @ w)
    # return np.concatenate((omega, real, imag))
    return pd.DataFrame(data={"Frequency":omega, "E Storage":real, "E Loss":imag})

def compute_relax(tau_i,E_i):
    """
    Compute the relaxation curve using the given parameters.

    Parameters:
        tau_i (list): A list of relaxation times.
        E_i (list): A list of corresponding relaxation energies.

    Returns:
        pd.DataFrame: A DataFrame containing the computed relaxation curve with two columns: "Time" and "E".
    """
    t = np.logspace(np.log10(np.min(tau_i)), np.log10(np.max(tau_i)), 1000)

    E = 0
    for i , v in enumerate(E_i):
        E += E_i[i] * np.exp(-t/tau_i[i])
    return pd.DataFrame(data={"Time":t, "E":E})

def compute_rspectum(tau_i,E_i):
    """
    Compute the rspectum of the given data.

    Parameters:
        tau_i (array-like): The time constants for each energy value.
        E_i (array-like): The energy values corresponding to each time constant.

    Returns:
        pd.DataFrame: A DataFrame containing the computed rspectum values with the
        following columns:
            - Time: The time values.
            - H: The computed rspectum values.
    """
    t = np.logspace(np.log10(np.min(tau_i)), np.log10(np.max(tau_i)), 1000)

    H = 0
    for i , v in enumerate(E_i):
        H += (t/tau_i[i]) * E_i[i] * np.exp(-t/tau_i[i])
    return pd.DataFrame(data={"Time":t, "H":H})

def prony_linear_fit(df, N, model):
    """
    Perform a linear fit using the Prony method.
    
    Parameters:
    - df: pandas DataFrame
        The input DataFrame containing the training data.
    - N: int
        The number of points to generate in the logarithmic time grid.
    - model: str
        The type of linear regression model to use. Options are "Linear", "LASSO", and "Ridge".
    
    Returns:
    - tuple
        A tuple containing the following elements:
        - tau: ndarray
            The logarithmic time grid.
        - E: ndarray
            The fitted coefficients.
        - prony: ndarray
            The complex values calculated using the Prony method.
        - relax: ndarray
            The relaxation values calculated using the Prony method.
    """
    df.sort_values(by=[df.columns[0]], inplace=True)
    train_data = df.to_numpy()

    omega = train_data[:,0]
    eps_inft = train_data[0,1]
    eps_real = train_data[:,1]
    eps_imag = train_data[:,2]

    Tau_max = 1/train_data[0,0]
    Tau_min = 1/train_data[-1,0]

    tau = np.logspace(np.log10(Tau_min),np.log10(Tau_max),N,endpoint=True)

    model_dict = {
            "Linear":linear_model.LinearRegression(positive=True, fit_intercept=False),
            "LASSO":linear_model.Lasso(positive=True, fit_intercept=False),
            "Ridge":linear_model.Ridge(positive=True, fit_intercept=False),
            }
    clf = model_dict[model]
    # alpha = 1.0
    # clf = linear_model.LinearRegression(positive=True, fit_intercept=False)

    D_real = real_basis(omega,tau).T @ real_basis(omega,tau)
    D_imag = imag_basis(omega,tau).T @ imag_basis(omega,tau)

    y_real = real_basis(omega,tau).T @ (eps_real - eps_inft)
    y_imag = imag_basis(omega,tau).T @ eps_imag

    X = D_real + D_imag
    y = y_real + y_imag

    clf.fit(X, y)
    E = clf.coef_

    # print(f'Non-Zero Weights Used: {np.count_nonzero(W)}')
    prony = compute_complex(train_data,tau,E)
    relax = compute_relax(tau,E)
    
    return (tau, E, prony, relax)

def wlf_shift(T, T_ref, C1, C2):
    """Calculate shift factor a_T using the WLF equation."""
    return 10 ** (-C1 * (T - T_ref) / (C2 + (T - T_ref)))

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