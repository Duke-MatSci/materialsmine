"""
Rewrite the four named SIO predicates stored in Fuseki's named graphs to
their numbered forms, in place, in one SPARQL Update request.
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

_VALUES = ' '.join(f'(<{named}> <{numbered}>)' for named, numbered in SIO_PREDICATE_MIGRATION.items())

COUNT_QUERY = (
    'SELECT ?named (COUNT(*) AS ?n) WHERE { '
    f'VALUES ?named {{ {" ".join(f"<{p}>" for p in SIO_PREDICATE_MIGRATION)} }} '
    'GRAPH ?g { ?s ?named ?o } } GROUP BY ?named'
)

MIGRATE_UPDATE = (
    'DELETE { GRAPH ?g { ?s ?named ?o } } '
    'INSERT { GRAPH ?g { ?s ?numbered ?o } } '
    f'WHERE {{ VALUES (?named ?numbered) {{ {_VALUES} }} GRAPH ?g {{ ?s ?named ?o }} }}'
)


def _local(iri: str) -> str:
    return iri[len(SIO):]


def count_named_predicates() -> Tuple[bool, Any]:
    """Count the named-predicate triples in named graphs, keyed by local name."""
    ok, result = _fuseki_query(COUNT_QUERY)
    if not ok:
        return False, result
    counts = {_local(p): 0 for p in SIO_PREDICATE_MIGRATION}
    try:
        for b in result.get('results', {}).get('bindings', []):
            if 'named' not in b or 'n' not in b:
                continue  # an empty group can come back as a row without bindings
            counts[_local(b['named']['value'])] = int(b['n']['value'])
    except (KeyError, ValueError, AttributeError) as e:
        return False, f'unexpected count result: {e}'
    return True, counts


def migrate_sio_predicates() -> Tuple[Dict[str, Any], int]:
    """Count, rewrite if anything needs it, and count again.
    Returns the response body and HTTP status."""
    ok, migrated = count_named_predicates()
    if not ok:
        return {'message': 'Fuseki did not answer the SIO predicate count', 'fuseki': {'error': str(migrated)}}, 502
    if any(migrated.values()):
        ok, fuseki = _fuseki_update(MIGRATE_UPDATE)
        if not ok:
            return {'message': 'Fuseki did not accept the SIO predicate migration', 'fuseki': fuseki}, 502
    ok, remaining = count_named_predicates()
    body: Dict[str, Optional[Any]] = {'migrated': migrated, 'remaining': remaining if ok else None}
    if not ok:
        body['count_error'] = str(remaining)
    return body, 200
