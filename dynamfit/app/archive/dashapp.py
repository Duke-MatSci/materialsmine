from dash import Dash, html, dcc
import plotly.express as px
import pandas as pd
from dash.dependencies import Output, Input

app = Dash(__name__)
df = pd.read_csv('https://raw.githubusercontent.com/plotly/datasets/master/gapminderDataFiveYear.csv')

#if you are extracting data from your own machine, then put the data inside the 'data' folder in this repo
# and access the data using the following code
# df = pd.read_csv('../data/bank_loan.csv')

app.layout = html.Div([
    dcc.Graph(id='graph1'),
    dcc.Slider(
        df['year'].min(),
        df['year'].max(),
        step=None,
        value=df['year'].min(),
        marks={str(year): str(year) for year in df['year'].unique()},
        id='year-slider'
    )
])


@app.callback(
Output('graph1', 'figure'),
Input('year-slider', 'value'))
def update_figure(selected_year):
    filtered_df = df[df.year == selected_year]
    fig = px.scatter(filtered_df, 
                    x="gdpPercap", 
                    y="lifeExp",
                    size="pop", 
                    color="continent", 
                    hover_name="country",
                    log_x=True, size_max=55
                    )
    fig.update_layout(transition_duration=500)
    return fig
  
if __name__ == '__main__':
    app.run_server(debug=True)