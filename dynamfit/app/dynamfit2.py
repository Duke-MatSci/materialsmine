"""
****** Important! *******
If you run this app locally, un-comment line 113 to add the ThemeChangerAIO component to the layout
"""

from dash import Dash, dcc, html, dash_table, Input, Output, State, callback
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import dash_bootstrap_components as dbc
from dash_bootstrap_templates import ThemeChangerAIO, template_from_url
import dash_daq as daq

import base64
import io

import pandas as pd
import numpy as np

from .helper import prony_linear_fit, compute_rspectum

# stylesheet with the .dbc class
dbc_css = "https://cdn.jsdelivr.net/gh/AnnMarieW/dash-bootstrap-templates/dbc.min.css"
app = Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP, dbc_css])
app.title = 'DynamFit'

header = html.H4(
    "DynamFit 2.0", className="bg-primary text-white p-2 mb-2 text-left"
)

alert = html.Div(
    dbc.Alert(
    children="Hello! I am an alert!",
    id="upload-alert",
    # dismissable=True,
    is_open=False,
    # duration=4000,
),
)

# fitsettings = ["Smoothing", "Show Basis Functions"]
fitsettings = ["Show Basis Functions"]

checklist = html.Div(
    [
        dbc.Label("Additional Settings"),
        dbc.Checklist(
            id="fit-settings",
            options=[{"label": i, "value": i} for i in fitsettings],
            value=["Smoothing"],
            # inline=True,
        ),
    ],
    className="mb-4",
)

downloadbutton = html.Div(
    [
        dbc.Button(
            "Download Coefficients",
            # href="/static/data_file.txt",
            id="coef-download-button",
            # href="",
            # download="fit_coef.csv",
            # external_link=True,
            # color="primary",
        ),
        dcc.Download(id="download-coef-csv"),
    ]
)


uploadtable = html.Div(
    dash_table.DataTable(
        id="upload-table",
        columns=[{"name": i, "id": i, "deletable": False} for i in ["Frequency", "E Storage", "E Loss"]],
        data=[],
        page_size=10,
        # editable=True,
        cell_selectable=True,
        # filter_action="native",
        sort_action="native",
        style_table={"overflowX": "auto"},
        # row_selectable="multi",
    ),
    className="dbc-row-selectable",
)

mytable = html.Div(
    [dash_table.DataTable(
        id="mytable",
        columns=[{"name": i, "id": i, "deletable": False} for i in ['i', 'tau_i', 'E_i']],
        data=[],
        page_size=10,
        # editable=True,
        cell_selectable=True,
        # filter_action="native",
        sort_action="native",
        style_table={"overflowX": "auto"},
        # row_selectable="multi",
    ),
    downloadbutton,
    ],
    className="dbc-row-selectable",
)

uploadbutton = html.Div(
    [
        # dbc.Label("Upload Compatible Viscoelastic Data"),
        # dbc.Label("(accepted formats: '.csv', '.tsv')"),
        dbc.Label([html.Div("Upload Compatible Viscoelastic Data"), 
                #    html.Div("<i>accepted formats: '.csv', '.tsv'</i>")], 
                #    style={
                #         # 'marginLeft': 10, 'marginRight': 10, 'marginTop': 10, 'marginBottom': 10, 
                #         # 'backgroundColor':'#F7FBFE',
                #         'border': 'thin lightgrey dashed', 
                #         # 'padding': '6px 0px 0px 8px',
                #         },
                #    ),
                   html.Div(dcc.Markdown("*(accepted formats: '.csv', '.tsv')*", 
                    style={
                            'marginLeft': 0, 'marginRight': 0, 'marginTop': 0, 'marginBottom': -20, 
                            # 'backgroundColor':'#F7FBFE',
                            # 'border': 'thin lightgrey dashed', 
                            'padding': '0px 0px 0px 0px',
                            },
                                         ))]),
        dcc.Upload(id='upload-data', children=dbc.Button('Upload File')),
    ],
)

mydropdown = html.Div(
    [
        dbc.Label("Select Fitting Method"),
        dcc.Dropdown(
            ['Linear', 'LASSO', 'Ridge'],
            'Linear',
            # ["gdpPercap", "lifeExp", "pop"],
            # "pop",
            id="linear-model",
            clearable=False,
        ),
    ],
    className="mb-4",
)

myinput = html.Div(
    [
        dbc.Label("Enter Number of Prony Terms"),
        dbc.Input(
            id="N-terms",
            type='number',
            min=0, max=10, step=1,
            placeholder=20,
            # inline=True,
        ),
    ],
    className="mb-4",
)

myslider = html.Div(
    [
        dbc.Label("Select Number of Prony Terms"),
        dcc.Slider(
            0,
            100,
            1,
            id="prony_term_number",
            marks=None,
            tooltip={"placement": "bottom", "always_visible": True},
            value=1000,
            className="p-0",
        ),
    ],
    className="mb-4",
)

theme_colors = [
    "primary",
    "secondary",
    "success",
    "warning",
    "danger",
    "info",
    "light",
    "dark",
    "link",
]
colors = html.Div(
    [dbc.Button(f"{color}", color=f"{color}", size="sm") for color in theme_colors]
)
colors = html.Div(["Theme Colors:", colors], className="mt-2")

mycontrols = dbc.Card(
    [uploadbutton, alert, mydropdown, myslider, checklist],
    body=True,
)

mytab1 = dbc.Tab([dcc.Graph(id="complex-chart")], label="Complex, E*(iω)")
mytab1a = dbc.Tab([dcc.Graph(id="complex-tand-chart")], label="E'(ω), tan(δ)")
# mytab2 = dbc.Tab([dcc.Graph(id="loss-chart")], label="Loss Chart")
mytab2 = dbc.Tab([dcc.Graph(id="relaxation-chart")], label="Relaxation, E(t)")
mytab3 = dbc.Tab([dcc.Graph(id="relaxation-spectrum-chart")], label="R Spectrum, H(t)")
mytab4 = dbc.Tab([uploadtable], label="Upload Data", className="p-4")
mytab5 = dbc.Tab([mytable], label="Prony Coeff", className="p-4")
mytabs = dbc.Card(dbc.Tabs([mytab1, mytab1a, mytab2, mytab3, mytab4, mytab5]))


app.layout = dbc.Container(
    [
        header,
        dbc.Row(
            [
                dbc.Col(
                    [
                        mycontrols,
                        # controls,
                        # !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                        # When running this app locally, un-comment this line:
                        ThemeChangerAIO(aio_id="theme")
                    ],
                    width=4,
                ),
                dbc.Col([mytabs, colors], width=8),
            ]
        ),
    ],
    fluid=True,
    className="dbc",
)

@callback(
    Output("download-coef-csv", "data"),
    Input("coef-download-button", "n_clicks"),
    prevent_initial_call=True,
)
def func(n_clicks):
    # df = pd.read_csv(".data/fit-coef.csv")
    # return dcc.send_data_frame(df.to_csv, "mydf.csv")
    return dcc.send_file("./data/fit_coef.csv")

# Check for new data
@app.callback(
    Output('upload-table', 'data'),
    Output('upload-alert', 'children'),
    Output('upload-alert', 'color'),
    Output('upload-alert', 'is_open'),
    Input('upload-data', 'contents'),
    # State("upload-alert", "is_open"),
    prevent_initial_call=True,
)
def update_upload_data(contents):
    # test = [
    #     contents == 0,
    #     contents == None,
    #     # contents is 0,
    #     contents is None,
    # ]
    # print(test)
    if contents is not None:
        content_type, content_string = contents.split(',')
        decoded = base64.b64decode(content_string)
        df = pd.read_csv(io.StringIO(decoded.decode('utf-8')), header=None, sep = ",|\s+\t+|\t+")
        # print(df.shape)
        # if len(df.columns) != 3:
        # df.columns =['Frequency', 'E Storage', 'E Loss']
        # print(df)
        # err_dict = {
        #     "True": {
        #         "alert_message":"Upload Unsuccessful",
        #         "alert_color": "warning",
        #     },
        #     "False": {
        #         "alert_message":"Upload Successful!",
        #         "alert_color": "success",
        #     }
        # }
        # error = "False"
        is_open = True
        if (df is not None) and (len(df.columns) == 3):
            alert_message = "Upload Successful!"
            alert_color = "success"
            df.columns =['Frequency', 'E Storage', 'E Loss']
        else:
            alert_message = "Upload Unsuccessful"
            alert_color = "danger"

        return df.to_dict("records"), alert_message, alert_color, is_open


@callback(
    Output("complex-chart", "figure"),
    Output("complex-tand-chart", "figure"),
    Output("relaxation-chart", "figure"),
    Output("relaxation-spectrum-chart", "figure"),
    Output("mytable", "data"),

    Input("linear-model", "value"),
    Input("prony_term_number", "value"),
    Input(ThemeChangerAIO.ids.radio("theme"), "value"),
    Input("upload-table", "data"),
    Input("fit-settings", "value"),
    prevent_initial_call=True,
)
def update_line_chart(model, N, theme, dfl, fit_settings):
    if dfl is not None:
        print(N)
        print(fit_settings)
        df = pd.DataFrame(dfl)
        # print(df.columns)

        tau, E, complex, relax = prony_linear_fit(df, N, model)
        N_nz = np.count_nonzero(E)

        # Get the column names of the first two columns as x and y
        x_column_name = df.columns[0]
        y_column_name = df.columns[1]
        z_column_name = df.columns[2]

        df_melt = pd.melt(df, id_vars=[x_column_name], 
                        value_vars=[y_column_name, z_column_name], 
                        var_name='Modulus', value_name="Young's Modulus (MPa)")
        df_melt["Type"] = "Experiment"

        x_column_name = complex.columns[0]
        y_column_name = complex.columns[1]
        z_column_name = complex.columns[2]

        complex_melt = pd.melt(complex, id_vars=[x_column_name], 
                        value_vars=[y_column_name, z_column_name], 
                        var_name='Modulus', value_name="Young's Modulus (MPa)")
        complex_melt["Type"] = f"{N_nz}-Term Prony"

        df_concat = pd.concat([df_melt, complex_melt], ignore_index=True)

        fig1 = px.line(df_concat, x=x_column_name, y="Young's Modulus (MPa)", 
                log_x=True, 
                log_y=True, 
                facet_col='Modulus',
                color="Type", line_dash="Type",
                line_dash_map={"Experiment":"solid", f"{N_nz}-Term Prony":"dash"},
                template=template_from_url(theme),
                labels={
                    "Frequency": "Frequency (Hz)",
                },
                )
        
        # df11 = df.copy()
        # df11["tan delta"] = df['E Loss']/df['E Storage']
        df11_concat = df_concat.copy()
        df11_tand = pd.DataFrame()
        df11_tand["Frequency"] = df11_concat[df11_concat["Modulus"] == "E Loss"]["Frequency"]
        df11_tand["Type"] = df11_concat[df11_concat["Modulus"] == "E Loss"]["Type"]
        # print(df11_tand.head(5))
        # print(df11_concat[df11_concat["Modulus"] == "E Loss"]["Young's Modulus (MPa)"].head(5))
        # print("Storage")
        # print(df11_concat.head(5))
        # print(df11_concat[df11_concat["Modulus"] == "E Storage"].head(5))
        # print(df11_concat[df11_concat["Modulus"] == "E Storage"]["Young's Modulus (MPa)"].head(5))

        # print("Loss")
        # print(df11_concat.head(5))
        # print(df11_concat[df11_concat["Modulus"] == "E Loss"].head(5))
        # print(df11_concat[df11_concat["Modulus"] == "E Loss"]["Young's Modulus (MPa)"].head(5))

        # print('tandelta')
        # tandelta = df11_concat[df11_concat["Modulus"] == "E Loss"]["Young's Modulus (MPa)"] / df11_concat[df11_concat["Modulus"] == "E Storage"]["Young's Modulus (MPa)"]
        # print(tandelta.head(5))
        # print('tandelta 2')
        # loss = df11_concat[df11_concat["Modulus"] == "E Loss"]["Young's Modulus (MPa)"]
        # storage = df11_concat[df11_concat["Modulus"] == "E Storage"]["Young's Modulus (MPa)"]
        # tandelta2 = np.divide(loss.to_numpy(), storage.to_numpy())
        # print(tandelta2)

        df11_tand["Young's Modulus (MPa)"] = df11_concat[df11_concat["Modulus"] == "E Loss"]["Young's Modulus (MPa)"].to_numpy() / df11_concat[df11_concat["Modulus"] == "E Storage"]["Young's Modulus (MPa)"].to_numpy()
        # print(df11_tand.head(5))
        df11_tand['Modulus'] = 'tan delta'
        # print(df11_tand.head(5))
        df11_concat = pd.concat([df11_concat, df11_tand], ignore_index=True)

        print(df11_tand.head(5))
        print(df11_concat)

        fig11 = px.line(df11_concat[df11_concat['Modulus']!="E Loss"], x="Frequency", y="Young's Modulus (MPa)", 
                log_x=True, 
                # log_y=True, 
                facet_col='Modulus',
                color="Type", line_dash="Type",
                line_dash_map={"Experiment":"solid", f"{N_nz}-Term Prony":"dash"},
                template=template_from_url(theme),
                labels={
                    "Frequency": "Frequency (Hz)",
                },
                )
        fig11.update_yaxes(matches=None, showticklabels=True)
        fig11.update_yaxes(type="log", col=1)
        

        # fig11 = make_subplots(rows=1, cols=2)
        # fig11.add_trace(
        #     go.Scatter(x=df["Frequency"], y=df['E Storage'], 
        #         marker=dict(color=2),
        #         # log_x=True, 
        #         # log_y=True, 
        #         # facet_col='Modulus',
        #         # color="Type", line_dash="Type",
        #         # line_dash_map={"Experiment":"solid", f"{N_nz}-Term Prony":"dash"},
        #         ),
        #     row=1, col=1
        #     )

        # fig11.add_trace(
        #     go.Scatter(x=df["Frequency"], y=df['E Loss']/df['E Storage'], 
        #         # log_x=True, 
        #         # log_y=True, 
        #         # facet_col='Modulus',
        #         # color="Type", line_dash="Type",
        #         # line_dash_map={"Experiment":"solid", f"{N_nz}-Term Prony":"dash"},
        #         ),
        #     row=1, col=2
        #     )

        # fig11.update_layout(
        #     template=template_from_url(theme),
        #     autosize=False,
        #     width=800,
        #     height=450,
        #     margin=dict(l=80, r=60, t=60, b=80),
        # )

        # fig11.update_xaxes(title_text="Frequency (Hz)", type="log", row=1, col=1)
        # fig11.update_yaxes(title_text="Storage Modulus (MPa)", type="log", row=1, col=1)

        # fig11.update_xaxes(title_text="Frequency (Hz)", type="log", row=1, col=2)
        # fig11.update_yaxes(title_text="tan(δ)", row=1, col=2)
        
        # full_fig = fig1.full_figure_for_development()
        # axs = full_fig.axes
        # print(axs)
        # for ax in fig1.axes_dict.values():
        #     # ax.lineplot(mat['frequency'], mat['tandelta'])
        #     sns.lineplot(mat, x='frequency', y='tan delta', ax=ax, legend=False, alpha=0.2)
        #     # ax.axline((0, 0), slope=.2, c=".2", ls="--", zorder=0)
        
        relax["Type"] = f"{N_nz}-Term Prony"
        fig2a = px.line(relax, x="Time", y="E", 
                log_x=True, 
                log_y=True, 
                # facet_col='Modulus',
                color="Type", line_dash="Type",
                line_dash_map={"Basis":"solid", f"{N_nz}-Term Prony":"dash"},
                template=template_from_url(theme),
                # width=800, height=450,
                labels={
                    "Time": "Time (s)",
                    "E": "Relaxation Modulus (MPa)",
                },
                )
        fig2a.update_layout(
            autosize=False,
            width=800,
            height=450,
            margin=dict(l=80, r=60, t=60, b=80),
            )
        
        basis_df = pd.DataFrame()
        basis_df["Time"] = tau
        basis_df["E"] = E
        basis_df["Type"] = f"{N_nz}-Term Basis"
        # basis_df["Modulus"] = "E Storage"

        fig2b = px.scatter(basis_df, x="Time", y="E",
                log_x=True, 
                log_y=True,
                symbol= "Type",
                # label="Type",
                # facet_col='Modulus',
                # color="Type", line_dash="Type",
                # line_dash_map={"Basis":"solid", f"{N_nz}-Term Prony":"dash"},
                # scatter_marker_map={"Basis":"solid", f"{N_nz}-Term Prony":"dash"},
                template=template_from_url(theme),
                labels={
                    "Time": "Time (s)",
                    "E": "Relaxation Modulus (MPa)",
                },
                )
        fig2 = go.Figure(data = fig2a.data + fig2b.data,
                        #  layout_xaxis_range=["auto",4],
                         )
        fig2.update_xaxes(type="log")
        fig2.update_yaxes(type="log")

        fig2.update_layout(
                        autosize=False,
                        margin=dict(l=80, r=60, t=60, b=80),
                        # width=800, height=550,
                        xaxis_title="Time (s)",
                        yaxis_title="Relaxation Modulus (MPa)",
                        legend_title="Type",
                        template=template_from_url(theme),
        )


        rspectrum = compute_rspectum(tau, E)

        rspectrum["Type"] = f"{N_nz}-Term Prony"
        fig3a = px.line(rspectrum, x="Time", y="H", 
                log_x=True, 
                log_y=True, 
                # facet_col='Modulus',
                color="Type", line_dash="Type",
                line_dash_map={"Basis":"solid", f"{N_nz}-Term Prony":"dash"},
                template=template_from_url(theme),
                # width=800, height=450,
                labels={
                    "Time": "Time (s)",
                    "H": "Relaxation Spectrum (MPa)",
                },
                )
        fig3a.update_layout(
            autosize=False,
            width=800,
            height=450,
            margin=dict(l=80, r=60, t=60, b=80),
            )


        fig3 = go.Figure(data = fig3a.data + fig2b.data,
                        #  layout_xaxis_range=["auto",4],
                         )
        fig3.update_xaxes(type="log")
        fig3.update_yaxes(type="log")

        fig3.update_layout(
                        autosize=False,
                        margin=dict(l=80, r=60, t=60, b=80),
                        # width=800, height=550,
                        xaxis_title="Time (s)",
                        yaxis_title="Relaxation Spectrum (MPa)",
                        legend_title="Type",
                        template=template_from_url(theme),
        )

        if "Show Basis Functions" in fit_settings:
            fig2 = fig2
            fig3 = fig3
        else:
            fig2 = fig2a
            fig3 = fig3a


        coef = {"tau_i":tau, "E_i":E,}
        coef_df = pd.DataFrame(coef)
        coef_df = coef_df[coef_df.E_i != 0].reset_index(drop=False)
        # df.reset_index(inplace=True)
        coef_df = coef_df.rename(columns = {'index':'i'})
        coef_file = "./data/fit_coef.csv"
        coef_df.to_csv(coef_file, index=False)

        return fig1, fig11, fig2, fig3, coef_df.to_dict("records")


if __name__ == "__main__":
    app.run_server(port='5001', debug=True)