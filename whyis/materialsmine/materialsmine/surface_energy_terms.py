import numpy as np
import pandas as pd
import json
# from pathlib import Path
import os

FILEDIR = os.path.dirname(os.path.abspath(__file__))

# print('Absolute path of file:     ',
#       os.path.abspath(__file__))
# print('Absolute directoryname: ',
#       os.path.dirname(os.path.abspath(__file__)))

# print("Running Path:" + str(Path.cwd()))

# dict pretty printer
def pprint(text):
    print(json.dumps(text, indent=4))
    return

# search for matching Mat, PST and return raw SE terms
def find_gamma(mat, fil, refdf):
    if fil is None:
        fil = "no surface treatment"
    component = refdf['Component']
    # print(f'component: {component}')
    gamma_d = refdf['Dispersive surface energy']
    gamma_p = refdf['Polar surface energy']
    g_d_m , g_d_f =0 , 0
    for k , cpt in enumerate(component):
        # print(f'cpt: {cpt}')
        if mat in cpt:
            g_d_m , g_p_m = gamma_d[k] , gamma_p[k]
        if fil in cpt:
            g_d_f , g_p_f = gamma_d[k] , gamma_p[k]

    if g_d_m != 0 and g_d_f != 0:
        return g_d_m , g_p_m ,g_d_f , g_p_f
    else:
        return False

# Calculate the SE work terms
def calc_work_terms(Gamma_d_matrix, Gamma_p_matrix, Gamma_d_filler, Gamma_p_filler):
    # Calculate SE Values
    Gamma_F = Gamma_d_filler + Gamma_p_filler
    Gamma_P = Gamma_d_matrix + Gamma_p_matrix

    # Fowkes Estimation of interaction energy
    Wpf = 2*((Gamma_d_filler*Gamma_d_matrix)**0.5 + (Gamma_p_filler*Gamma_p_matrix)**0.5)
    Wff = 2*Gamma_F
    Wpp = 2*Gamma_P

    # Work of adhesion, spreading
    Wa = Wff + Wpp - 2*Wpf
    Ws = Wpf - Wpp

    # Wetting angle
    Costheta = 2*Wpf/Wff -1
    for k , c in enumerate(Costheta):
        if c>1:
            Costheta[k] = 1
    return Wa, Ws, Costheta

def surface_energy_terms(Matrix, PST):
    # Import reference file
    # filename = FILEDIR + '/SE_raw_ref.xlsx'
    # df = pd.read_excel(filename)
    filename = FILEDIR + '/SE_raw_ref.csv'
    df = pd.read_csv(filename)
    # print("file read successful")

    # Find Raw SE vals (if match occurs)
    G = find_gamma(Matrix, PST, df)
    if G is False:
        return False

    Gamma_d_matrix = G[0]
    Gamma_p_matrix = G[1]
    Gamma_d_filler = G[2]
    Gamma_p_filler = G[3]
    Gamma_d_matrix = np.array([Gamma_d_matrix])
    Gamma_p_matrix = np.array([Gamma_p_matrix])
    Gamma_d_filler = np.array([Gamma_d_filler])
    Gamma_p_filler = np.array([Gamma_p_filler])
    # Calculate Work Terms
    Wa, Ws, Costheta = calc_work_terms(Gamma_d_matrix, Gamma_p_matrix, Gamma_d_filler, Gamma_p_filler)

    # Format and otput as nested dict
    raw_terms = {
        "matrix dispersive surface energy": Gamma_d_matrix[0],
        "matrix polar surface energy": Gamma_p_matrix[0],
        "filler dispersive surface energy": Gamma_d_filler[0],
        "filler polar surface energy": Gamma_p_filler[0],
    }
    work_terms = {
        "WorkOfAdhesion": Wa[0],
        "WorkOfSpreading":Ws[0],
        "DegreeOfWetting": Costheta[0]
    }
    SE_terms = {
        "Work Terms": work_terms,
        "Raw Terms": raw_terms
    }
    return SE_terms

if __name__ == "__main__":
    Matrix = "poly(methyl methacrylate)"
    PST = "3-methacryloxypropyldimethylchlorosilane"

    d = surface_energy_terms(Matrix, PST)
    pprint(d)
