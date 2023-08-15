import dash
from dash.dependencies import Input, Output
from dash import dash_table
from dash import html


def init_dashboard(server):
    """Create a Plotly Dash dashboard."""
    dash_app = dash.Dash(
        server=server,
        routes_pathname_prefix='/dashapp/',
        external_stylesheets=[
            '/static/dist/css/styles.css',
        ]
    )

    # Create Dash Layout
    dash_app.layout = html.Div(id='dash-container')
    
    # Initialize callbacks after our app is loaded
    # Pass dash_app as a parameter
    init_callbacks(dash_app)

    return dash_app.server


def init_callbacks(app):
    @app.callback(
    # Callback input/output
    # ...
    )
    def update_graph(rows):
        # Callback logic
        # ...

