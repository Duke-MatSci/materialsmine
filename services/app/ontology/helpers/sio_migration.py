"""
Rewrite the four named SIO predicates stored in Fuseki's nanopub graphs,
the named graphs whose IRI starts with NP_GRAPH_PREFIX, to their numbered
forms, in place, in one SPARQL Update request. Other named graphs and the
default graph are left alone; the named-predicate triples found in other
named graphs are reported as skipped.
"""
from typing import Any, Dict, Optional, Tuple

from app.ontology.helpers.materialize import _fuseki_query, _fuseki_update

SIO = 'http://semanticscience.org/resource/'
SIO_PREDICATE_MIGRATION = {
    SIO + 'hasAttribute': SIO + 'SIO_000008',
    SIO + 'hasValue': SIO + 'SIO_000300',
    SIO + 'hasUnit': SIO + 'SIO_000221',
    SIO + 'isAttributeOf': SIO + 'SIO_000011',
}

_NAMED_IRIS = ' '.join(f'<{named}>' for named in SIO_PREDICATE_MIGRATION)
_NAMED_TO_NUMBERED = ' '.join(
    f'(<{named}> <{numbered}>)'
    for named, numbered in SIO_PREDICATE_MIGRATION.items())

NP_GRAPH_PREFIX = 'http://materialsmine.org/np/'
_IN_SCOPE = f'STRSTARTS(STR(?g), "{NP_GRAPH_PREFIX}")'

COUNT_QUERY = (
    'SELECT ?named ?inScope (COUNT(*) AS ?n) WHERE { '
    f'VALUES ?named {{ {_NAMED_IRIS} }} '
    'GRAPH ?g { ?s ?named ?o } '
    f'BIND({_IN_SCOPE} AS ?inScope) }} GROUP BY ?named ?inScope'
)

MIGRATE_UPDATE = (
    'DELETE { GRAPH ?g { ?s ?named ?o } } '
    'INSERT { GRAPH ?g { ?s ?numbered ?o } } '
    f'WHERE {{ VALUES (?named ?numbered) {{ {_NAMED_TO_NUMBERED} }} '
    'GRAPH ?g { ?s ?named ?o } '
    f'FILTER({_IN_SCOPE}) }}'
)


def _local(iri: str) -> str:
    return iri[len(SIO):]


def count_named_predicates() -> Tuple[bool, Any]:
    """Count the named-predicate triples in named graphs, keyed by local
    name. On success the result is a pair of counts: graphs under
    NP_GRAPH_PREFIX, then all other named graphs."""
    ok, result = _fuseki_query(COUNT_QUERY)
    if not ok:
        return False, result
    in_scope = {_local(p): 0 for p in SIO_PREDICATE_MIGRATION}
    out_of_scope = dict(in_scope)
    try:
        for b in result.get('results', {}).get('bindings', []):
            if 'named' not in b or 'n' not in b:
                continue  # an empty group can come back as a row without bindings
            flag = b.get('inScope', {}).get('value', 'false')
            counts = in_scope if flag in ('true', '1') else out_of_scope
            counts[_local(b['named']['value'])] += int(b['n']['value'])
    except (KeyError, ValueError, AttributeError) as e:
        return False, f'unexpected count result: {e}'
    return True, (in_scope, out_of_scope)


def migrate_sio_predicates() -> Tuple[Dict[str, Any], int]:
    """Count, rewrite if anything needs it, and count again.
    Returns the response body and HTTP status."""
    ok, first = count_named_predicates()
    if not ok:
        return {'message': 'Fuseki did not answer the SIO predicate count',
                'fuseki': {'error': str(first)}}, 502
    migrated, skipped = first
    if any(migrated.values()):
        ok, fuseki = _fuseki_update(MIGRATE_UPDATE)
        if not ok:
            return {'message': 'Fuseki did not accept the SIO predicate migration',
                    'fuseki': fuseki}, 502
    ok, recount = count_named_predicates()
    body: Dict[str, Optional[Any]] = {
        'migrated': migrated, 'remaining': recount[0] if ok else None,
        'skipped': skipped}
    if not ok:
        body['count_error'] = str(recount)
    return body, 200
