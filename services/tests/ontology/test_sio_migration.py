"""
Tests for the SIO predicate migration, which rewrites the four named SIO
predicates in Fuseki's nanopub graphs, those under
http://materialsmine.org/np/, to their numbered forms. Fuseki is
faked by an rdflib Dataset that runs the SPARQL posted to it; no test
reaches the network.
"""
import datetime
import os
import sys
import unittest
from unittest.mock import patch
from urllib.parse import parse_qs, urlsplit

import jwt
import requests
from flask import Flask
from rdflib import BNode, Dataset, Literal, URIRef
from rdflib.namespace import RDFS, XSD

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.config import Config
from app.ontology.routes import ontology


SECRET = 'test-secret'
BASE = 'http://fuseki.test:3030'
DATASET = 'kgds'
QUERY = BASE + '/' + DATASET + '/query'
UPDATE = BASE + '/' + DATASET + '/update'
DEFAULT_GRAPH = URIRef('urn:x-rdflib:default')

SIO = 'http://semanticscience.org/resource/'
NAMED = {
    'hasAttribute': URIRef(SIO + 'hasAttribute'),
    'hasValue': URIRef(SIO + 'hasValue'),
    'hasUnit': URIRef(SIO + 'hasUnit'),
    'isAttributeOf': URIRef(SIO + 'isAttributeOf'),
}
NUMBERED = {
    NAMED['hasAttribute']: URIRef(SIO + 'SIO_000008'),
    NAMED['hasValue']: URIRef(SIO + 'SIO_000300'),
    NAMED['hasUnit']: URIRef(SIO + 'SIO_000221'),
    NAMED['isAttributeOf']: URIRef(SIO + 'SIO_000011'),
}
HAS_ROLE = URIRef(SIO + 'hasRole')
ZERO = {'hasAttribute': 0, 'hasValue': 0, 'hasUnit': 0, 'isAttributeOf': 0}

NP1 = URIRef('http://materialsmine.org/np/1/assertion')
NP2 = URIRef('http://materialsmine.org/np/2/assertion')
OTHER = URIRef('http://materialsmine.org/ontology')
LEGACY = URIRef('http://example.org/legacy/chart1')
LOOKALIKE = URIRef('https://materialsmine.org/np/x/assertion')
NPX = URIRef('http://materialsmine.org/npx/1')
UNIT_PA = URIRef('http://qudt.org/vocab/unit/PA')
UNIT_K = URIRef('http://qudt.org/vocab/unit/K')


def _u(name):
    return URIRef('http://materialsmine.org/sample/' + name)


BLANK = BNode()

# Named-graph quads. Named-predicate counts: hasAttribute 1, hasValue 2,
# hasUnit 3, isAttributeOf 4, so a swapped key shows in the counts.
FIXTURE = [
    # nanopub 1: every named predicate, each object term type
    (_u('s1'), NAMED['hasAttribute'], _u('a1'), NP1),
    (_u('a1'), NAMED['hasValue'], Literal('2.5', datatype=XSD.double), NP1),
    (_u('a1'), NAMED['hasUnit'], UNIT_PA, NP1),
    (_u('a1'), NAMED['isAttributeOf'], _u('s1'), NP1),
    (_u('a2'), NAMED['hasUnit'], BLANK, NP1),
    (_u('a2'), NAMED['isAttributeOf'], _u('s1'), NP1),
    # an already-numbered twin of a named triple in the same graph
    (_u('a1'), NUMBERED[NAMED['hasUnit']], UNIT_PA, NP1),
    # another sio: predicate, and a named IRI in object and subject position
    (_u('s1'), HAS_ROLE, _u('role1'), NP1),
    (_u('p1'), RDFS.seeAlso, NAMED['hasValue'], NP1),
    (NAMED['hasUnit'], RDFS.label, Literal('has unit', lang='en'), NP1),
    # nanopub 2: every named predicate again
    (_u('a3'), NAMED['hasValue'], Literal('300', datatype=XSD.integer), NP2),
    (_u('a3'), NAMED['hasUnit'], UNIT_K, NP2),
    (_u('a3'), NAMED['isAttributeOf'], _u('s2'), NP2),
    (_u('a4'), NAMED['isAttributeOf'], _u('s2'), NP2),
    (_u('s2'), HAS_ROLE, BNode(), NP2),
    # a graph with none of the four
    (_u('c1'), RDFS.label, Literal('a class'), OTHER),
    (_u('c1'), RDFS.subClassOf, _u('c0'), OTHER),
    # the default graph is outside the named graphs and is left alone
    (_u('d1'), NAMED['hasValue'], Literal('7', datatype=XSD.integer), DEFAULT_GRAPH),
]

# Named graphs outside http://materialsmine.org/np/, left alone. Their
# named-predicate counts: hasAttribute 3, hasValue 1, hasUnit 2,
# isAttributeOf 0.
OUT_OF_SCOPE = [
    (_u('c2'), NAMED['hasValue'], Literal('1.5', datatype=XSD.double), LEGACY),
    (_u('c2'), NAMED['hasAttribute'], _u('c3'), LEGACY),
    (_u('x1'), NAMED['hasUnit'], UNIT_PA, LOOKALIKE),
    (_u('x2'), NAMED['hasUnit'], UNIT_K, LOOKALIKE),
    (_u('x1'), NAMED['hasAttribute'], _u('x3'), LOOKALIKE),
    (_u('y1'), NAMED['hasAttribute'], _u('y2'), NPX),
]
FIXTURE = FIXTURE + OUT_OF_SCOPE
MIGRATED = {'hasAttribute': 1, 'hasValue': 2, 'hasUnit': 3, 'isAttributeOf': 4}
SKIPPED = {'hasAttribute': 3, 'hasValue': 1, 'hasUnit': 2, 'isAttributeOf': 0}


def expected_quads():
    """The fixture with each named predicate in a nanopub graph renumbered."""
    out = set()
    for s, p, o, g in FIXTURE:
        if str(g).startswith('http://materialsmine.org/np/'):
            p = NUMBERED.get(p, p)
        out.add((s, p, o, g))
    return out


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


def _endpoint(url):
    s = urlsplit(url)
    return '{}://{}{}'.format(s.scheme, s.netloc, s.path)


def _body_text(data):
    if hasattr(data, 'read'):
        data = data.read()
    if isinstance(data, bytes):
        data = data.decode('utf-8')
    return data


def _operation_text(url, kwargs, key):
    """The SPARQL text of a query (key 'query') or update (key 'update'),
    sent as a form field, a URL parameter or the raw request body."""
    data = kwargs.get('data')
    if isinstance(data, dict) and key in data:
        return data[key]
    params = kwargs.get('params') or {}
    if isinstance(params, dict) and key in params:
        return params[key]
    in_url = parse_qs(urlsplit(url).query).get(key)
    if in_url:
        return in_url[0]
    text = _body_text(data) or ''
    form = parse_qs(text).get(key) if text.startswith(key + '=') else None
    return form[0] if form else text


class FakeFuseki:
    """A Fuseki dataset that runs posted SPARQL on an rdflib Dataset and
    records every call. Anything but a POST to /query or /update is 404."""

    def __init__(self, quads):
        self.dataset = Dataset()
        for s, p, o, g in quads:
            self.dataset.graph(g).add((s, p, o))
        self.calls = []
        self.updated = False
        self.fail_queries = None
        self.fail_queries_after_update = None
        self.fail_update = None

    def quads(self):
        return set(self.dataset.quads((None, None, None, None)))

    def handler(self, method):
        def call(url, *args, **kwargs):
            if args:
                kwargs = dict(kwargs, data=args[0])
            self.calls.append((method, url, kwargs))
            return self.answer(method, url, kwargs)
        return call

    @staticmethod
    def _failure(failure):
        if isinstance(failure, BaseException):
            raise failure
        return _response(failure, b'fake Fuseki failure')

    def answer(self, method, url, kwargs):
        endpoint = _endpoint(url)
        if method == 'POST' and endpoint == QUERY:
            if self.fail_queries is not None:
                return self._failure(self.fail_queries)
            if self.updated and self.fail_queries_after_update is not None:
                return self._failure(self.fail_queries_after_update)
            try:
                result = self.dataset.query(_operation_text(url, kwargs, 'query'))
            except Exception as e:
                return _response(400, str(e).encode('utf-8'))
            return _response(200, result.serialize(format='json'), 'application/sparql-results+json')
        if method == 'POST' and endpoint == UPDATE:
            if self.fail_update is not None:
                return self._failure(self.fail_update)
            try:
                self.dataset.update(_operation_text(url, kwargs, 'update'))
            except Exception as e:
                return _response(400, str(e).encode('utf-8'))
            self.updated = True
            return _response(204)
        return _response(404)

    def to(self, endpoint):
        return [c for c in self.calls if c[0] == 'POST' and _endpoint(c[1]) == endpoint]


class MigrationCase(unittest.TestCase):
    """Starts a fake Fuseki holding QUADS and fixed settings per test."""

    QUADS = FIXTURE

    def setUp(self):
        self.fuseki = FakeFuseki(self.QUADS)
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

    def post_migrate(self, token=None):
        headers = {'Content-Type': 'application/json'}
        if token is None:
            token = make_token()
        if token:
            headers['Authorization'] = 'Bearer ' + token
        return self.client.post('/ontology/migrate-sio/', data='{}', headers=headers)

    def assert_only_sparql_posts(self):
        for method, url, _ in self.fuseki.calls:
            self.assertEqual(method, 'POST', url)
            self.assertIn(_endpoint(url), (QUERY, UPDATE))


class TestMigrateSioPredicates(MigrationCase):
    """A successful run renumbers the four predicates in nanopub graphs only."""

    def test_rewrites_named_predicates_in_named_graphs_and_reports_counts(self):
        """One update renumbers every named-predicate triple in its own
        nanopub graph, leaves all else as it was, other named graphs
        included, and reports the counts per local name."""
        resp = self.post_migrate()
        self.assertEqual(resp.status_code, 200, resp.get_data(as_text=True))

        self.assertEqual(self.fuseki.quads(), expected_quads())
        self.assertEqual(len(self.fuseki.to(UPDATE)), 1)
        self.assert_only_sparql_posts()

        body = resp.get_json()
        self.assertEqual(body['migrated'], MIGRATED)
        self.assertEqual(body['remaining'], ZERO)
        self.assertEqual(body.get('skipped'), SKIPPED)

    def test_second_run_finds_nothing_and_sends_no_update(self):
        """Run again, the migration reports zero migrated and remaining and
        the same skipped counts, sends no update
        and leaves the dataset as the first run left it."""
        first = self.post_migrate()
        self.assertEqual(first.status_code, 200, first.get_data(as_text=True))
        updates_before = len(self.fuseki.to(UPDATE))

        resp = self.post_migrate()
        self.assertEqual(resp.status_code, 200, resp.get_data(as_text=True))
        self.assertEqual(len(self.fuseki.to(UPDATE)), updates_before)
        self.assertEqual(self.fuseki.quads(), expected_quads())

        body = resp.get_json()
        self.assertEqual(body['migrated'], ZERO)
        self.assertEqual(body['remaining'], ZERO)
        self.assertEqual(body.get('skipped'), SKIPPED)

    def test_function_migrates_without_a_request(self):
        """migrate_sio_predicates(), called with no Flask app or token,
        does the same rewrite and returns the body with status 200."""
        from app.ontology.helpers.sio_migration import migrate_sio_predicates

        body, status = migrate_sio_predicates()
        self.assertEqual(status, 200, body)
        self.assertEqual(self.fuseki.quads(), expected_quads())
        self.assertEqual(body['migrated'], MIGRATED)
        self.assertEqual(body['remaining'], ZERO)
        self.assertEqual(body.get('skipped'), SKIPPED)


class TestMigrateSioOutOfScopeOnly(MigrationCase):
    """A dataset whose named predicates all lie outside the nanopub graphs."""

    QUADS = [q for q in FIXTURE if q[3] not in (NP1, NP2)]

    def test_sends_no_update_and_reports_them_as_skipped(self):
        """With nothing under http://materialsmine.org/np/ to migrate, the
        run sends no update, changes nothing and reports the named
        predicates of the other graphs as skipped."""
        resp = self.post_migrate()
        self.assertEqual(resp.status_code, 200, resp.get_data(as_text=True))
        self.assertEqual(self.fuseki.to(UPDATE), [])
        self.assertEqual(self.fuseki.quads(), set(self.QUADS))

        body = resp.get_json()
        self.assertEqual(body['migrated'], ZERO)
        self.assertEqual(body['remaining'], ZERO)
        self.assertEqual(body.get('skipped'), SKIPPED)


class TestMigrateSioAuth(MigrationCase):
    """Without a valid token nothing reaches Fuseki."""

    def test_refuses_without_token_and_sends_nothing(self):
        """A request with no Bearer token gets 401 and no Fuseki call."""
        resp = self.post_migrate(token='')
        self.assertEqual(resp.status_code, 401)
        self.assertEqual(self.fuseki.calls, [])

    def test_refuses_token_with_wrong_secret_and_sends_nothing(self):
        """A token signed with another secret gets 401 and no Fuseki call."""
        resp = self.post_migrate(token=make_token(secret='not-the-secret'))
        self.assertEqual(resp.status_code, 401)
        self.assertEqual(self.fuseki.calls, [])


class TestMigrateSioFailures(MigrationCase):
    """Fuseki failures give 502 before the rewrite stands, 200 after."""

    def check_count_failure(self, failure):
        self.fuseki.fail_queries = failure
        resp = self.post_migrate()
        self.assertEqual(resp.status_code, 502, resp.get_data(as_text=True))
        body = resp.get_json()
        self.assertTrue(body['message'])
        self.assertIn('fuseki', body)
        self.assertEqual(self.fuseki.to(UPDATE), [])
        self.assertEqual(self.fuseki.quads(), set(FIXTURE))

    def test_rejected_first_count_gives_502_and_no_update(self):
        """A count Fuseki answers with 500 gives 502 with message and
        fuseki, sends no update and changes nothing."""
        self.check_count_failure(500)

    def test_unreachable_first_count_gives_502_and_no_update(self):
        """A count that raises a connection error gives 502 with message
        and fuseki, sends no update and changes nothing."""
        self.check_count_failure(requests.ConnectionError('refused'))

    def test_failed_update_gives_502_with_fuseki_status_and_error(self):
        """An update Fuseki rejects gives 502 whose fuseki part carries the
        status and error, and the dataset is unchanged."""
        self.fuseki.fail_update = 500
        resp = self.post_migrate()
        self.assertEqual(resp.status_code, 502, resp.get_data(as_text=True))
        body = resp.get_json()
        self.assertTrue(body['message'])
        self.assertEqual(body['fuseki']['status'], 500)
        self.assertTrue(body['fuseki']['error'])
        self.assertEqual(len(self.fuseki.to(UPDATE)), 1)
        self.assertEqual(self.fuseki.quads(), set(FIXTURE))

    def test_failed_recount_still_gives_200_with_remaining_null(self):
        """A recount that fails after the update stood gives 200 with the
        migrated and skipped counts, remaining null and a count_error."""
        self.fuseki.fail_queries_after_update = 500
        resp = self.post_migrate()
        self.assertEqual(resp.status_code, 200, resp.get_data(as_text=True))
        self.assertEqual(self.fuseki.quads(), expected_quads())
        body = resp.get_json()
        self.assertEqual(body['migrated'], MIGRATED)
        self.assertIsNone(body['remaining'])
        self.assertTrue(body['count_error'])
        self.assertEqual(body.get('skipped'), SKIPPED)


if __name__ == '__main__':
    unittest.main()
