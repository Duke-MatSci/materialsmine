import numpy as np
import pandas as pd
from sklearn import linear_model

# helper functions
def real_basis(omega,tau): ##calculates N(number of relaxation time units) real basis functions evaluated at M frequency points
    omega = np.expand_dims(omega,axis=1) ##shape (M,1)
    tau = np.expand_dims(tau,axis=0) ##shape (1,N)
    return (omega**2*tau**2)/(1+omega**2*tau**2) ##shape (M,N)

def imag_basis(omega,tau): ##calculates N imaginary basis functions evaluated at M frequency points
    omega = np.expand_dims(omega,axis=1) ##shape (M,1)
    tau = np.expand_dims(tau,axis=0) ##shape (1,N)
    return (omega*tau)/(1+omega**2*tau**2) ##shape (M,N)

def compute_prony2(data,tau,w):
    omega = data[:,0]
    eps_inft = data[0,1]
    real_approximation = np.expand_dims(np.add(np.matmul(real_basis(omega,tau),w),eps_inft),axis=1)
    imag_approximation = np.expand_dims(np.matmul(imag_basis(omega,tau),w),axis=1)
    approximation = np.concatenate((np.expand_dims(omega,axis=1),real_approximation,imag_approximation),axis=1)
    return approximation

def compute_complex(data,tau,w):
    omega = data[:,0]
    eps_inft = data[0,1]
    real = (real_basis(omega,tau) @ w) + eps_inft
    imag = (imag_basis(omega,tau) @ w)
    # return np.concatenate((omega, real, imag))
    return pd.DataFrame(data={"Frequency":omega, "E Storage":real, "E Loss":imag})

def compute_relax(tau_i,E_i):
    t = np.logspace(np.log10(np.min(tau_i)), np.log10(np.max(tau_i)), 1000)

    E = 0
    for i , v in enumerate(E_i):
        E += E_i[i] * np.exp(-t/tau_i[i])
    return pd.DataFrame(data={"Time":t, "E":E})

def compute_rspectum(tau_i,E_i):
    t = np.logspace(np.log10(np.min(tau_i)), np.log10(np.max(tau_i)), 1000)

    H = 0
    for i , v in enumerate(E_i):
        H += (t/tau_i[i]) * E_i[i] * np.exp(-t/tau_i[i])
    return pd.DataFrame(data={"Time":t, "H":H})

def prony_linear_fit(df, N, model):
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