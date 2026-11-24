"""
Shared readers for Tri-VE figure JSON (test_update_line_chart,
test_routes_e2e). Underscore-prefixed so it is never collected as a test
module.

They read the JSON a client receives, so a figure built by update_line_chart
goes through json.loads(fig.to_json()) first.
"""
import base64
import json
import re

import numpy as np


NOTICE_NAME = 'figure-notice'


def figure_json(fig):
    """The JSON a client receives for a plotly Figure."""
    return json.loads(fig.to_json())


def _values(v):
    """A serialized array: a plain list or plotly's base64 typed array."""
    if v is None:
        return np.array([])
    if isinstance(v, dict):
        return np.frombuffer(base64.b64decode(v['bdata']),
                             dtype=np.dtype(v['dtype'])).astype(float)
    return np.array([np.nan if x is None else x for x in v], dtype=float)


def trace_x(trace):
    """A trace's x values as floats."""
    return _values(trace.get('x'))


def facet_axes(fig_json):
    """The x axes the figure's traces are drawn on, one per facet."""
    return {t.get('xaxis') or 'x' for t in fig_json['data']}


def vertical_lines(fig_json):
    """
    Every vertical line drawn on a data x axis, as (axis, x) pairs.

    A line counts however it is drawn: a layout shape with x0 equal to x1 on
    an axis reference, or a trace whose points all share one x. Positions are
    data values on log axes too, which is where plotly places shapes.
    """
    lines = []
    for s in fig_json.get('layout', {}).get('shapes', None) or []:
        xref = s.get('xref', 'x')
        if xref == 'paper' or xref.endswith('domain'):
            continue
        x0, x1 = s.get('x0'), s.get('x1')
        if x0 is not None and x0 == x1:
            lines.append((xref, float(x0)))
    for t in fig_json['data']:
        x = trace_x(t)
        if len(x) >= 2 and np.all(np.isfinite(x)) and np.all(x == x[0]):
            lines.append((t.get('xaxis') or 'x', float(x[0])))
    return lines


def notices(fig_json):
    """The text of every caption stamped above the plot."""
    return [a.get('text', '') for a in
            fig_json.get('layout', {}).get('annotations', None) or []
            if a.get('name') == NOTICE_NAME]


def numbers_in(text):
    """Every decimal number written in text, either minus sign accepted."""
    return [float(m.replace('−', '-'))
            for m in re.findall(r'[-−]?\d+(?:\.\d+)?', text)]


def names_number(text, value, tol=0.06):
    """True when text writes value, to one decimal place or better."""
    return any(abs(n - value) <= tol for n in numbers_in(text))
