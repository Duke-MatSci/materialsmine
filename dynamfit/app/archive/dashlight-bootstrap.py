"""
****** Important! *******
If you run this app locally, un-comment line 113 to add the ThemeChangerAIO component to the layout
"""

from dash import Dash, dcc, html, dash_table, Input, Output, callback
import plotly.express as px
import dash_bootstrap_components as dbc
from dash_bootstrap_templates import ThemeChangerAIO, template_from_url
import dash_daq as daq

import pandas as pd

mydf = pd.read_csv("data/PMMA_shifted_R10_data.txt", sep="\t", names=["Frequency", "E Storage", "E Loss"])
# mydf = pd.melt(mydf, id_vars=["Frequency"], 
#                 value_vars=["E Storage", "E Loss"], 
#                 var_name='Modulus', value_name="Young's Modulus (MPa)")
# mydf_stor = mydf[["Frequency", "E Storage"]]
# mydf_stor = mydf[["Frequency", "E Loss"]]

# tau, E, prony = prony_linear_fit(df, N, model)

# coef = {"tau":tau, "E":E,}
# coef_df = pd.DataFrame(coef)
# coef_df = coef_df[coef_df.E != 0].reset_index(drop=True)

df = px.data.gapminder()
years = df.year.unique()
continents = df.continent.unique()

# stylesheet with the .dbc class
dbc_css = "https://cdn.jsdelivr.net/gh/AnnMarieW/dash-bootstrap-templates/dbc.min.css"
app = Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP, dbc_css])

header = html.H4(
    "DynamFit 2.0", className="bg-primary text-white p-2 mb-2 text-center"
)

table = html.Div(
    dash_table.DataTable(
        id="table",
        columns=[{"name": i, "id": i, "deletable": True} for i in df.columns],
        data=df.to_dict("records"),
        page_size=10,
        editable=True,
        cell_selectable=True,
        filter_action="native",
        sort_action="native",
        style_table={"overflowX": "auto"},
        row_selectable="multi",
    ),
    className="dbc-row-selectable",
)

# mytable = html.Div(
#     dash_table.DataTable(
#         id="mytable",
#         columns=[{"name": i, "id": i, "deletable": True} for i in df.columns],
#         data=coef_df.to_dict("records"),
#         page_size=10,
#         editable=True,
#         cell_selectable=True,
#         filter_action="native",
#         sort_action="native",
#         style_table={"overflowX": "auto"},
#         row_selectable="multi",
#     ),
#     className="dbc-row-selectable",
# )


uploadbutton = html.Div(
    [
        dbc.Label("Upload Compatible Viscoelastic Data"),
        dcc.Upload(id='upload-data', children=dbc.Button('Upload File')),
    ],
)

dropdown = html.Div(
    [
        dbc.Label("Select indicator (y-axis)"),
        dcc.Dropdown(
            # ['Linear', 'LASSO', 'Ridge'],
            # 'Linear',
            ["gdpPercap", "lifeExp", "pop"],
            "pop",
            id="indicator",
            clearable=False,
        ),
    ],
    className="mb-4",
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

checklist = html.Div(
    [
        dbc.Label("Select Continents"),
        dbc.Checklist(
            id="continents",
            options=[{"label": i, "value": i} for i in continents],
            value=continents,
            inline=True,
        ),
    ],
    className="mb-4",
)

slider = html.Div(
    [
        dbc.Label("Select Years"),
        dcc.RangeSlider(
            years[0],
            years[-1],
            5,
            id="years",
            marks=None,
            tooltip={"placement": "bottom", "always_visible": True},
            value=[years[2], years[-2]],
            className="p-0",
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
            value=0,
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


controls = dbc.Card(
    [dropdown, checklist, slider],
    body=True,
)

mycontrols = dbc.Card(
    [uploadbutton, mydropdown, myslider],
    body=True,
)

tab1 = dbc.Tab([dcc.Graph(id="line-chart")], label="Line Chart")
tab2 = dbc.Tab([dcc.Graph(id="scatter-chart")], label="Scatter Chart")
tab3 = dbc.Tab([table], label="Table", className="p-4")
tabs = dbc.Card(dbc.Tabs([tab1, tab2, tab3]))

mytab1 = dbc.Tab([dcc.Graph(id="storage-chart")], label="Storage Chart")
mytab2 = dbc.Tab([dcc.Graph(id="loss-chart")], label="Loss Chart")
# mytab3 = dbc.Tab([uploadtable], label="Uploaded Data", className="p-4")
mytab3 = dbc.Tab([table], label="Coefficients", className="p-4")
mytabs = dbc.Card(dbc.Tabs([mytab1, mytab2, mytab3]))


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
    Output("line-chart", "figure"),
    Output("scatter-chart", "figure"),
    Output("table", "data"),
    Input("indicator", "value"),
    Input("continents", "value"),
    Input("years", "value"),
    Input(ThemeChangerAIO.ids.radio("theme"), "value"),
)
def update_line_chart(indicator, continent, yrs, theme):
    if continent == [] or indicator is None:
        return {}, {}, []

    dff = df[df.year.between(yrs[0], yrs[1])]
    dff = dff[dff.continent.isin(continent)]
    data = dff.to_dict("records")

    fig = px.line(
        dff,
        x="year",
        y=indicator,
        color="continent",
        line_group="country",
        template=template_from_url(theme),
    )

    fig_scatter = px.scatter(
        df.query(f"year=={yrs[1]} & continent=={continent}"),
        x="gdpPercap",
        y="lifeExp",
        size="pop",
        color="continent",
        log_x=True,
        size_max=60,
        template=template_from_url(theme),
        title="Gapminder %s: %s theme" % (yrs[1], template_from_url(theme)),
    )

    return fig, fig_scatter, data


if __name__ == "__main__":
    app.run_server(debug=True)