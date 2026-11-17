"""
Load the bundled, pinned QUDT unit vocabulary into Fuseki as its versioned
named graph, and drop the other versioned QUDT unit graphs.
"""
import hashlib
import re
from pathlib import Path
from typing import Any, Dict, List, Tuple
from urllib.parse import quote

import requests
from rdflib import Graph

from app.config import Config
from app.ontology.helpers.materialize import _fuseki_query

QUDT_VERSION = '3.5.3'
QUDT_UNITS_FILE = Path(__file__).resolve().parents[1] / 'data' / 'qudt-units-v3.5.3.ttl'
QUDT_UNITS_SHA256 = '5e84f3e10ae6a3c535e2e7616dc2affee09dd52bea5229822188730493fd4418'
QUDT_UNITS_GRAPH = 'http://qudt.org/3.5.3/vocab/unit'

VERSION_PLACEHOLDER = '$$QUDT_VERSION$$'
UNIT_GRAPH_PATTERN = re.compile(r'^http://qudt\.org/[^/]+/vocab/unit$')


class UnitFileError(Exception):
    """The bundled unit file is missing or does not match its pin."""


def _base_and_auth() -> Tuple[str, Any]:
    base = Config.FUSEKI_BASE_URL or 'http://host.docker.internal:3032'
    auth = (Config.FUSEKI_USER, Config.FUSEKI_PWD) if Config.FUSEKI_USER else None
    return f'{base}/{Config.FUSEKI_DATASET}/data', auth


def _graph_url(graph: str) -> str:
    endpoint, _ = _base_and_auth()
    return f"{endpoint}?graph={quote(graph, safe='')}"


def read_pinned_units() -> str:
    """Return the bundled file's text with the version filled in, after
    checking its SHA-256 against the pin."""
    path = Path(QUDT_UNITS_FILE)
    if not path.is_file():
        raise UnitFileError(f'QUDT unit file not found: {path}')
    raw = path.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    if digest != QUDT_UNITS_SHA256:
        raise UnitFileError(
            f'QUDT unit file {path} has SHA-256 {digest}, expected {QUDT_UNITS_SHA256}')
    return raw.decode('utf-8').replace(VERSION_PLACEHOLDER, QUDT_VERSION)


def put_units_graph(text: str, timeout: int = 300) -> Dict[str, Any]:
    """Replace the versioned unit graph in Fuseki with the given Turtle."""
    _, auth = _base_and_auth()
    try:
        r = requests.put(
            _graph_url(QUDT_UNITS_GRAPH),
            data=text.encode('utf-8'),
            headers={'Content-Type': 'text/turtle; charset=utf-8'},
            auth=auth,
            timeout=timeout,
        )
        ok = 200 <= r.status_code < 300
        return {'ok': ok, 'status': r.status_code, 'error': None if ok else r.text}
    except Exception as e:
        return {'ok': False, 'status': 0, 'error': str(e)}


def drop_other_unit_graphs() -> Tuple[List[str], List[Dict[str, Any]]]:
    """Delete every versioned QUDT unit graph other than the loaded one.
    Returns the graphs dropped and the errors met."""
    ok, result = _fuseki_query('SELECT DISTINCT ?g WHERE { GRAPH ?g { } }')
    if not ok:
        return [], [{'graph': None, 'error': str(result)}]
    graphs = [b['g']['value'] for b in result.get('results', {}).get('bindings', []) if 'g' in b]
    dropped, errors = [], []
    _, auth = _base_and_auth()
    for g in graphs:
        if g == QUDT_UNITS_GRAPH or not UNIT_GRAPH_PATTERN.match(g):
            continue
        try:
            r = requests.delete(_graph_url(g), auth=auth, timeout=120)
            if 200 <= r.status_code < 300:
                dropped.append(g)
            else:
                errors.append({'graph': g, 'status': r.status_code, 'error': r.text})
        except Exception as e:
            errors.append({'graph': g, 'status': 0, 'error': str(e)})
    return dropped, errors


def load_units() -> Tuple[Dict[str, Any], int]:
    """Load the pinned unit file, then drop the other unit versions.
    Returns the response body and HTTP status."""
    try:
        text = read_pinned_units()
    except UnitFileError as e:
        return {'message': str(e)}, 500
    triples = len(Graph().parse(data=text, format='turtle'))
    fuseki = put_units_graph(text)
    if not fuseki['ok']:
        return {'message': 'Fuseki did not accept the QUDT unit graph', 'fuseki': fuseki}, 502
    dropped, errors = drop_other_unit_graphs()
    body = {
        'graph': QUDT_UNITS_GRAPH,
        'version': QUDT_VERSION,
        'triples': triples,
        'fuseki': fuseki,
        'dropped': dropped,
    }
    if errors:
        body['drop_errors'] = errors
    return body, 200
