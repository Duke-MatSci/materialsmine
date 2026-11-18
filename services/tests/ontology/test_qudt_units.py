"""
Route tests for POST /ontology/units/, which loads the bundled QUDT unit
vocabulary into Fuseki. Fuseki is faked by patching the requests functions;
no test reaches the network.
"""
import datetime
import hashlib
import json
import os
import shutil
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.parse import parse_qs, urlsplit

import jwt
import requests
from flask import Flask
from rdflib import BNode, Dataset, Graph, URIRef
from rdflib.namespace import OWL, RDF

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.config import Config
from app.ontology.routes import ontology


SECRET = 'test-secret'
BASE = 'http://fuseki.test:3030'
DATASET = 'unitds'
GSP = BASE + '/' + DATASET + '/data'
UNIT_GRAPH = 'http://qudt.org/3.5.3/vocab/unit'
PIN = 'app.ontology.helpers.qudt_units.'
BUNDLED_FILE = Path(__file__).resolve().parents[2] / 'app' / 'ontology' / 'data' / 'qudt-units-v3.5.3.ttl'
PLACEHOLDER = '$$QUDT_VERSION$$'

# A small unit file in the bundled file's form: 4 triples, two placeholders.
SMALL_TTL = """\
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix unit: <http://qudt.org/vocab/unit/> .

<http://qudt.org/$$QUDT_VERSION$$/vocab/unit> a owl:Ontology ;
    rdfs:label "Units Release $$QUDT_VERSION$$" .

unit:M rdfs:label "Metre"@en ;
    rdfs:isDefinedBy <http://qudt.org/$$QUDT_VERSION$$/vocab/unit> .
"""
SMALL_TRIPLES = 4

RDF_FORMATS = {
    'text/turtle': 'turtle',
    'application/x-turtle': 'turtle',
    'application/n-triples': 'nt',
    'application/rdf+xml': 'xml',
    'application/ld+json': 'json-ld',
    'application/n-quads': 'nquads',
    'application/trig': 'trig',
}


def make_app():
    """A bare Flask app with only the ontology blueprint registered."""
    app = Flask(__name__)
    app.config['TESTING'] = True
    app.register_blueprint(ontology)
    return app


def make_token(secret=SECRET, req_id='test-req-id'):
    """A JWT carrying the reqId claim that token_required expects."""
    payload = {
        'reqId': req_id,
        'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=600),
    }
    return jwt.encode(payload, secret, algorithm='HS256')


def _response(status, body=b'', content_type='text/plain'):
    r = requests.Response()
    r.status_code = status
    r.reason = 'OK' if 200 <= status < 300 else 'Error'
    r._content = body
    r.headers['Content-Type'] = content_type
    r.encoding = 'utf-8'
    return r


def _graph_param(url, kwargs):
    """The decoded `graph` parameter of a Graph Store Protocol call."""
    found = parse_qs(urlsplit(url).query).get('graph', [])
    params = kwargs.get('params') or {}
    if isinstance(params, dict) and 'graph' in params:
        found.append(params['graph'])
    return found[0] if found else None


def _endpoint(url):
    s = urlsplit(url)
    return '{}://{}{}'.format(s.scheme, s.netloc, s.path)


def _body_text(data):
    if hasattr(data, 'read'):
        data = data.read()
    if isinstance(data, bytes):
        data = data.decode('utf-8')
    return data


def _query_text(url, kwargs):
    data = kwargs.get('data')
    if isinstance(data, dict) and 'query' in data:
        return data['query']
    params = kwargs.get('params') or {}
    if isinstance(params, dict) and 'query' in params:
        return params['query']
    in_url = parse_qs(urlsplit(url).query).get('query')
    if in_url:
        return in_url[0]
    text = _body_text(data) or ''
    form = parse_qs(text).get('query') if text.startswith('query=') else None
    return form[0] if form else text


class FakeFuseki:
    """Records every call and answers like a Fuseki dataset of named graphs."""

    def __init__(self, graphs=()):
        self.graphs = set(graphs)
        self.calls = []
        self.put_status = 201
        self.put_error = None
        self.delete_status = {}

    def handler(self, method):
        def call(url, *args, **kwargs):
            if args:
                kwargs = dict(kwargs, data=args[0])
            self.calls.append((method, url, kwargs))
            return self.answer(method, url, kwargs)
        return call

    def answer(self, method, url, kwargs):
        endpoint = _endpoint(url)
        graph = _graph_param(url, kwargs)
        if method == 'PUT' and endpoint == GSP and graph:
            if self.put_error is not None:
                raise self.put_error
            if 200 <= self.put_status < 300:
                self.graphs.add(graph)
            return _response(self.put_status)
        if method == 'DELETE' and endpoint == GSP and graph:
            status = self.delete_status.get(graph, 204)
            if graph not in self.graphs:
                status = 404
            if 200 <= status < 300:
                self.graphs.discard(graph)
            return _response(status)
        if endpoint in (BASE + '/' + DATASET + '/query', BASE + '/' + DATASET + '/sparql'):
            ds = Dataset()
            marker = (URIRef('urn:s'), URIRef('urn:p'), URIRef('urn:o'))
            for g in self.graphs:
                ds.graph(URIRef(g)).add(marker)
            try:
                result = ds.query(_query_text(url, kwargs))
            except Exception as e:
                return _response(400, str(e).encode('utf-8'))
            return _response(200, result.serialize(format='json'), 'application/sparql-results+json')
        return _response(404)

    def of(self, method):
        return [(url, kwargs) for m, url, kwargs in self.calls if m == method]

    def queries(self):
        return [c for c in self.calls if _endpoint(c[1]).endswith(('/query', '/sparql'))]

    def put_payload_graph(self, test):
        """Parse the single PUT's payload as the RDF its Content-Type names."""
        puts = self.of('PUT')
        test.assertEqual(len(puts), 1)
        url, kwargs = puts[0]
        headers = {k.lower(): v for k, v in (kwargs.get('headers') or {}).items()}
        mime = headers.get('content-type', '').split(';')[0].strip()
        test.assertIn(mime, RDF_FORMATS)
        text = _body_text(kwargs.get('data'))
        fmt = RDF_FORMATS[mime]
        if fmt in ('nquads', 'trig'):
            ds = Dataset()
            ds.parse(data=text, format=fmt)
            g = Graph()
            for s, p, o, _ in ds.quads((None, None, None, None)):
                g.add((s, p, o))
            return text, g
        return text, Graph().parse(data=text, format=fmt)


class UnitsRouteCase(unittest.TestCase):
    """Starts a fake Fuseki and fixed Fuseki settings around each test."""

    graphs = ()

    def setUp(self):
        self.fuseki = FakeFuseki(self.graphs)
        patches = [
            patch.object(Config, 'SECRET_KEY', SECRET),
            patch.object(Config, 'FUSEKI_BASE_URL', BASE),
            patch.object(Config, 'FUSEKI_DATASET', DATASET),
        ]
        for method in ('put', 'post', 'get', 'delete'):
            patches.append(patch('requests.' + method, side_effect=self.fuseki.handler(method.upper())))
        for p in patches:
            p.start()
            self.addCleanup(p.stop)
        self.client = make_app().test_client()

    def use_small_file(self, text=SMALL_TTL, pin_digest=True):
        """Point the pin at a small temporary file, pinned to its own digest."""
        tmp = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, tmp)
        path = Path(tmp) / 'units.ttl'
        path.write_text(text, encoding='utf-8')
        file_patch = patch(PIN + 'QUDT_UNITS_FILE', path)
        file_patch.start()
        self.addCleanup(file_patch.stop)
        if pin_digest:
            digest = hashlib.sha256(path.read_bytes()).hexdigest()
            sha_patch = patch(PIN + 'QUDT_UNITS_SHA256', digest)
            sha_patch.start()
            self.addCleanup(sha_patch.stop)
        return path

    def post_units(self, token=True):
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = 'Bearer ' + make_token()
        return self.client.post('/ontology/units/', data='{}', headers=headers)


class TestLoadBundledUnits(UnitsRouteCase):
    """The intact bundled file goes to Fuseki as the 3.5.3 unit graph."""

    def test_loads_bundled_file_as_versioned_unit_graph_with_placeholders_filled(self):
        """One PUT replaces the 3.5.3 unit graph with the bundled file's
        triples, every version placeholder filled in as 3.5.3."""
        resp = self.post_units()
        self.assertEqual(resp.status_code, 200, resp.get_data(as_text=True))

        puts = self.fuseki.of('PUT')
        self.assertEqual(len(puts), 1)
        url, kwargs = puts[0]
        self.assertEqual(_endpoint(url), GSP)
        self.assertEqual(_graph_param(url, kwargs), UNIT_GRAPH)

        text, sent = self.fuseki.put_payload_graph(self)
        self.assertNotIn(PLACEHOLDER, text)
        self.assertEqual(len(sent), 60642)
        self.assertIn((URIRef(UNIT_GRAPH), RDF.type, OWL.Ontology), sent)

        expected = Graph().parse(
            data=BUNDLED_FILE.read_text(encoding='utf-8').replace(PLACEHOLDER, '3.5.3'),
            format='turtle',
        )

        def ground(g):
            return {t for t in g if not any(isinstance(x, BNode) for x in t)}

        self.assertEqual(ground(sent), ground(expected))

        body = resp.get_json()
        self.assertEqual(body['graph'], UNIT_GRAPH)
        self.assertEqual(body['version'], '3.5.3')
        self.assertEqual(body['triples'], 60642)
        self.assertIs(body['fuseki']['ok'], True)
        self.assertEqual(body['fuseki']['status'], 201)
        self.assertEqual(body['dropped'], [])

    def test_refuses_without_token_and_sends_nothing(self):
        """A request with no Bearer token is refused before Fuseki is reached."""
        resp = self.post_units(token=False)
        self.assertEqual(resp.status_code, 401)
        self.assertEqual(self.fuseki.calls, [])


class TestDropOtherUnitVersions(UnitsRouteCase):
    """After a good load, other versioned QUDT unit graphs are dropped."""

    graphs = (
        UNIT_GRAPH,
        'http://qudt.org/3.5.2/vocab/unit',
        'http://qudt.org/2.1/vocab/unit',
        'http://qudt.org/vocab/unit',
        'http://qudt.org/3.5.2/vocab/quantitykind',
        'http://materialsmine.org/ontology',
    )
    other_versions = {'http://qudt.org/3.5.2/vocab/unit', 'http://qudt.org/2.1/vocab/unit'}

    def test_drops_only_other_versioned_unit_graphs_after_the_load(self):
        """Each other http://qudt.org/<version>/vocab/unit graph is deleted
        after the PUT, and the response lists them; nothing else is deleted."""
        self.use_small_file()
        resp = self.post_units()
        self.assertEqual(resp.status_code, 200, resp.get_data(as_text=True))

        deleted = {_graph_param(url, kw) for url, kw in self.fuseki.of('DELETE')}
        self.assertEqual(len(self.fuseki.of('DELETE')), 2)
        self.assertEqual(deleted, self.other_versions)
        for url, _ in self.fuseki.of('DELETE'):
            self.assertEqual(_endpoint(url), GSP)

        methods = [m for m, _, _ in self.fuseki.calls]
        first_delete = methods.index('DELETE')
        self.assertEqual(methods[0], 'PUT')
        self.assertTrue(any(c in self.fuseki.queries() for c in self.fuseki.calls[1:first_delete]))

        body = resp.get_json()
        self.assertEqual(set(body['dropped']), self.other_versions)
        self.assertEqual(len(body['dropped']), 2)
        self.assertEqual(body['triples'], SMALL_TRIPLES)
        self.assertEqual(
            self.fuseki.graphs,
            {UNIT_GRAPH, 'http://qudt.org/vocab/unit',
             'http://qudt.org/3.5.2/vocab/quantitykind', 'http://materialsmine.org/ontology'},
        )

    def test_failed_drop_is_reported_and_left_out_of_dropped(self):
        """A drop Fuseki rejects after a good load still gives 200; dropped
        names only the graph actually deleted, and the body names the other."""
        failing = 'http://qudt.org/2.1/vocab/unit'
        self.fuseki.delete_status[failing] = 500
        self.use_small_file()
        resp = self.post_units()
        self.assertEqual(resp.status_code, 200, resp.get_data(as_text=True))

        body = resp.get_json()
        self.assertEqual(body['dropped'], ['http://qudt.org/3.5.2/vocab/unit'])
        rest = {k: v for k, v in body.items() if k != 'dropped'}
        self.assertIn(failing, json.dumps(rest))


class TestRefusedFile(UnitsRouteCase):
    """A file that fails the pin, or is missing, never reaches Fuseki."""

    graphs = ('http://qudt.org/3.5.2/vocab/unit',)

    def test_checksum_mismatch_is_refused_and_nothing_is_sent(self):
        """A unit file whose SHA-256 differs from the pin gives 500 and no
        call of any kind to Fuseki."""
        self.use_small_file(pin_digest=False)
        resp = self.post_units()
        self.assertEqual(resp.status_code, 500, resp.get_data(as_text=True))
        self.assertTrue(resp.get_json()['message'])
        self.assertEqual(self.fuseki.calls, [])

    def test_missing_file_is_refused_and_nothing_is_sent(self):
        """A missing unit file gives 500 and no call of any kind to Fuseki."""
        tmp = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, tmp)
        p = patch(PIN + 'QUDT_UNITS_FILE', Path(tmp) / 'absent.ttl')
        p.start()
        self.addCleanup(p.stop)
        resp = self.post_units()
        self.assertEqual(resp.status_code, 500, resp.get_data(as_text=True))
        self.assertTrue(resp.get_json()['message'])
        self.assertEqual(self.fuseki.calls, [])


class TestLoadFailure(UnitsRouteCase):
    """A load Fuseki does not accept gives 502 and drops nothing."""

    graphs = ('http://qudt.org/3.5.2/vocab/unit',)

    def check_load_failure(self):
        self.use_small_file()
        resp = self.post_units()
        self.assertEqual(resp.status_code, 502, resp.get_data(as_text=True))
        body = resp.get_json()
        self.assertTrue(body['message'])
        self.assertIs(body['fuseki']['ok'], False)
        self.assertEqual(len(self.fuseki.of('PUT')), 1)
        self.assertEqual(self.fuseki.queries(), [])
        self.assertEqual(self.fuseki.of('DELETE'), [])

    def test_rejected_load_gives_502_and_no_drops(self):
        """A non-2xx answer to the PUT gives 502 with fuseki.ok false."""
        self.fuseki.put_status = 500
        self.check_load_failure()

    def test_unreachable_fuseki_gives_502_and_no_drops(self):
        """A connection error on the PUT gives 502 with fuseki.ok false."""
        self.fuseki.put_error = requests.ConnectionError('refused')
        self.check_load_failure()


if __name__ == '__main__':
    unittest.main()
