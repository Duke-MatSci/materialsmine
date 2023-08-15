import dash
from dash import dcc
from dash import html
import dash_bootstrap_components as dbc
import plotly.express as px
import pandas as pd
import numpy as np
from sklearn import linear_model
import base64
import io

# Initialize the Dash app
external_stylesheets = ['https://codepen.io/chriddyp/pen/bWLwgP.css']
app = dash.Dash(__name__, external_stylesheets=external_stylesheets)
# app.scripts.config.serve_locally = False

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

def compute_prony(data,tau,w):
    omega = data[:,0]
    eps_inft = data[0,1]
    real = (real_basis(omega,tau) @ w) + eps_inft
    imag = (imag_basis(omega,tau) @ w)
    # return np.concatenate((omega, real, imag))
    return pd.DataFrame(data={"Frequency (Hz)":omega, "E Storage":real, "E Loss":imag})

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
    prony = compute_prony(train_data,tau,E)
    return (tau, E, prony)

def generate_table(dataframe, max_rows=5):
    return html.Table([
        html.Thead(
            html.Tr([html.Th(col) for col in dataframe.columns])
        ),
        html.Tbody([
            html.Tr([
                html.Td(dataframe.iloc[i][col]) for col in dataframe.columns
            ]) for i in range(min(len(dataframe), max_rows))
        ])
    ])

def default_settings_panel():
    return html.Div([
        html.Div(children=[
            html.Label('Dropdown'),
            dcc.Dropdown(['New York City', 'Montréal', 'San Francisco'], 'Montréal'),

            html.Br(),
            html.Label('Multi-Select Dropdown'),
            dcc.Dropdown(['New York City', 'Montréal', 'San Francisco'],
                        ['Montréal', 'San Francisco'],
                        multi=True),

            html.Br(),
            html.Label('Radio Items'),
            dcc.RadioItems(['New York City', 'Montréal', 'San Francisco'], 'Montréal'),
        ], style={'padding': 10, 'flex': 1}),

        html.Div(children=[
            html.Label('Checkboxes'),
            dcc.Checklist(['New York City', 'Montréal', 'San Francisco'],
                        ['Montréal', 'San Francisco']
            ),

            html.Br(),
            html.Label('Text Input'),
            dcc.Input(value='MTL', type='text'),

            html.Br(),
            html.Label('Slider'),
            dcc.Slider(
                min=0,
                max=9,
                marks={i: f'Label {i}' if i == 1 else str(i) for i in range(1, 6)},
                value=5,
            ),
        ], style={'padding': 10, 'flex': 1})
    ], style={'display': 'flex', 'flex-direction': 'row'})

# Define the layout of the app
app.layout = html.Div([
    html.H1(children='DynamFit 2.0', style = {'textAlign': 'center',}),
    html.Hr(),
    html.Div(children=['''
    DynamFit 2.0: A web application for fitting prony series to viscoelastic data.
    '''], style = {'textAlign': 'center',}),
    html.Br(),
    dcc.Upload(id='upload-data', children=html.Button('Upload File'), multiple=False),
    html.Div([
    html.Div(children=[
        # dcc.Upload(id='upload-data', children=html.Button('Upload File'), multiple=False),
        # dcc.Upload(
        #     id='upload-data',
        #     children=html.Div([
        #         'Drag and Drop or ',
        #         html.A('Select Files')
        #     ]),
        #     style={
        #         'width': '100%',
        #         # 'width': '100px',
        #         'height': '60px',
        #         'lineHeight': '60px',
        #         'borderWidth': '1px',
        #         'borderStyle': 'dashed',
        #         'borderRadius': '5px',
        #         'textAlign': 'center',
        #         'margin': '0px'
        #     },
        #     multiple=False
        # ),
        html.Div(id='output-data-upload'),
    ], style={'padding': 10, 'flex': 1,}),
    html.Div(children=[
    html.Div(id='scatter-plot'),
    ], style={'padding': 10, 'flex': 2,}),
    ], style={'display': 'flex', 'flex-direction': 'row'}),
    # default_settings_panel(),
    html.Div([
        html.Div(children=[
            html.Label('Fitting Model'),
            dcc.Dropdown(['Linear', 'LASSO', 'Ridge'], 'Linear', id='linear-model'),

            html.Br(),
            html.Label('Number of Prony Terms'),
            dcc.Input(id='N-terms', value=20, type='number', placeholder="N (0, 1000)", min=0, max=1000, step=1),
        ], style={'padding': 10, 'flex': 1}),
        html.Div(children=[
            html.Div(id='prony-terms'),
        ], style={'padding': 10, 'flex': 2}),
    ], style={'display': 'flex', 'flex-direction': 'row'}),
])

# Define the callback function to read the uploaded CSV file and display the scatter plot
@app.callback(
    dash.dependencies.Output('output-data-upload', 'children'),
    dash.dependencies.Input('upload-data', 'contents'),
    dash.dependencies.State('upload-data', 'filename'),
)
def update_output(contents, filename):
    if contents is not None:
        # Read the uploaded CSV file
        # print(contents[-1])
        content_type, content_string = contents.split(',')
        decoded = base64.b64decode(content_string)
        # decoded = base64.b64decode(contents[-1])
        # print(decoded)
        df = pd.read_csv(io.StringIO(decoded.decode('utf-8')), delimiter='\t')
        # df = pd.read_csv(contents[0], delimiter=',')
        # if np.any(df.columns is None):
        df.columns =['Frequency', 'E Storage', 'E Loss']

        # Display the first 10 rows of the uploaded data
        return html.Div([
            html.H5(f'Uploaded file: {filename}'),
            html.H6('Preview:'),
            generate_table(df),
            # html.Table([
            #     html.Thead(html.Tr([html.Th(col) for col in df.columns])),
            #     html.Tbody([
            #         html.Tr([
            #             html.Td(df.iloc[i][col]) for col in df.columns
            #         ]) for i in range(min(len(df), 10))
            #     ])
            # ])
        ])
    else:
        return None

@app.callback(
    dash.dependencies.Output('scatter-plot', 'children'),
    dash.dependencies.Output('prony-terms', 'children'),
    dash.dependencies.Input('upload-data', 'contents'),
    dash.dependencies.Input('N-terms', 'value'),
    dash.dependencies.Input('linear-model', 'value'),
)
def update_scatter_plot(contents, N, model):
    if contents is not None:
        # print(model)
    
        # print(N)
        # N = 340 ## terms in prony series
        # Read the uploaded CSV file
        # df = pd.read_csv(contents[0], delimiter=',')
        # print(contents[-1])
        content_type, content_string = contents.split(',')
        decoded = base64.b64decode(content_string)
        df = pd.read_csv(io.StringIO(decoded.decode('utf-8')), delimiter='\t')
        # print(df.shape)
        # if len(df.columns) != 3:
        df.columns =['Frequency (Hz)', 'E Storage', 'E Loss']

        tau, E, prony = prony_linear_fit(df, N, model)
        N_nz = np.count_nonzero(E)

        # Get the column names of the first two columns as x and y
        x_column_name = df.columns[0]
        y_column_name = df.columns[1]
        z_column_name = df.columns[2]

        df_melt = pd.melt(df, id_vars=[x_column_name], 
                     value_vars=[y_column_name, z_column_name], 
                     var_name='Modulus', value_name="Young's Modulus (MPa)")
        df_melt["Type"] = "Experiment"

        x_column_name = prony.columns[0]
        y_column_name = prony.columns[1]
        z_column_name = prony.columns[2]

        prony_melt = pd.melt(prony, id_vars=[x_column_name], 
                        value_vars=[y_column_name, z_column_name], 
                        var_name='Modulus', value_name="Young's Modulus (MPa)")
        prony_melt["Type"] = f"{N_nz}-Term Prony"

        df_concat = pd.concat([df_melt, prony_melt])

        fig = px.line(df_concat, x=x_column_name, y="Young's Modulus (MPa)", 
              log_x=True, 
              log_y=True, 
              facet_col='Modulus',
              color="Type", line_dash="Type",
              line_dash_map={"Experiment":"solid", f"{N_nz}-Term Prony":"dash"},)
        
        coef = {"tau":tau, "E":E,}
        coef_df = pd.DataFrame(coef)
        coef_df = coef_df[coef_df.E != 0].reset_index(drop=True)

        # Create a scatter plot using Plotly
        # fig = px.scatter(df, x=x_column_name, y="Young's Modulus (MPa)", log_x=True, log_y=True, facet_col='Modulus')

        # Return the scatter plot as a Dash component
        # return html.Div(children=[dcc.Graph(figure=fig),], style={'padding': 10, 'flex': 1, 'border': '10px solid #000000', 'box-shadow': '12px 12px 2px 1px rgba(0, 0, 255, .2)',})
        return (html.Div(children=[dcc.Graph(figure=fig)]),
                html.Div(children=[
                    html.Div(children=[html.Label('Prony Coefficients'), generate_table(coef_df)], style={'padding': 10, 'flex': 1}),
                    html.Div(children=[html.Button("Download CSV", id="btn_csv"), dcc.Download(id="download-dataframe-csv"),], style={'padding': 10, 'flex': 1}),
                ], style={'display': 'flex', 'flex-direction': 'row', 'flex':4}))
    else:
        return (None, None)

if __name__ == '__main__':
    app.run_server(port='5000', debug=True)
