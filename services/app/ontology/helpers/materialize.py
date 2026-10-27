import threading
from typing import Any, Dict, Optional, Tuple

import requests
from rdflib import Graph
from rdflib.namespace import RDF, RDFS

from app.config import Config

INFERRED_GRAPH = "http://materialsmine.org/inferred"

SPARQL_PREFIXES = "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n"



def _fuseki_update(sparql: str, timeout: int = 120) -> Tuple[bool, Dict[str, Any]]:
    base = Config.FUSEKI_BASE_URL or "http://host.docker.internal:3032"
    dataset = Config.FUSEKI_DATASET
    auth = (Config.FUSEKI_USER, Config.FUSEKI_PWD) if Config.FUSEKI_USER else None
    endpoint = f"{base}/{dataset}/update"
    try:
        r = requests.post(
            endpoint,
            data=sparql.encode("utf-8"),
            headers={"Content-Type": "application/sparql-update; charset=utf-8"},
            auth=auth,
            timeout=timeout,
        )
        ok = 200 <= r.status_code < 300
        return ok, {"status": r.status_code, "error": None if ok else r.text}
    except Exception as e:
        return False, {"status": 0, "error": str(e)}


def _fuseki_query(sparql: str, timeout: int = 60) -> Tuple[bool, Any]:
    base = Config.FUSEKI_BASE_URL or "http://host.docker.internal:3032"
    dataset = Config.FUSEKI_DATASET
    auth = (Config.FUSEKI_USER, Config.FUSEKI_PWD) if Config.FUSEKI_USER else None
    endpoint = f"{base}/{dataset}/query"
    try:
        r = requests.post(
            endpoint,
            data={"query": sparql},
            headers={"Accept": "application/sparql-results+json"},
            auth=auth,
            timeout=timeout,
        )
        ok = 200 <= r.status_code < 300
        return ok, r.json() if ok else r.text
    except Exception as e:
        return False, str(e)


def get_materialize_status() -> Dict[str, Any]:
    """
    Return the current materialization status by querying Fuseki directly.
    This works across all gunicorn workers since it reads shared state from the KG.
    """
    count_ok, count_result = _fuseki_query(
        f"SELECT (COUNT(*) AS ?n) WHERE {{ GRAPH <{INFERRED_GRAPH}> {{ ?s ?p ?o }} }}"
    )
    if not count_ok:
        return {
            "state": "unknown",
            "inferred_triples": None,
            "error": f"Could not query Fuseki: {count_result}",
        }

    count = int(count_result["results"]["bindings"][0]["n"]["value"])
    if count > 0:
        return {
            "state": "completed",
            "inferred_triples": count,
            "graph": INFERRED_GRAPH,
            "error": None,
        }

    return {
        "state": "pending",
        "inferred_triples": 0,
        "graph": INFERRED_GRAPH,
        "error": None,
    }


def _run_materialize_all(logger=None):
    """Background worker that clears and rebuilds the inferred graph."""
    clear_sparql = f"CLEAR SILENT GRAPH <{INFERRED_GRAPH}>"
    ok, info = _fuseki_update(clear_sparql, timeout=30)
    if not ok:
        if logger:
            logger.error(f"[materialize] Failed to clear inferred graph: {info}")
        return

    insert_sparql = SPARQL_PREFIXES + f"""
    INSERT {{
        GRAPH <{INFERRED_GRAPH}> {{ ?x a ?super }}
    }}
    WHERE {{
        ?x a ?class .
        ?class rdfs:subClassOf+ ?super .
        FILTER (!isBlank(?super))
        FILTER NOT EXISTS {{ ?x a ?super }}
    }}
    """
    ok, info = _fuseki_update(insert_sparql, timeout=600)
    if not ok:
        if logger:
            logger.error(f"[materialize] Failed to rebuild inferred graph: {info}")
        return

    if logger:
        logger.info(f"[materialize] Rebuilt inferred graph <{INFERRED_GRAPH}>")

    count_ok, count_result = _fuseki_query(
        f"SELECT (COUNT(*) AS ?n) WHERE {{ GRAPH <{INFERRED_GRAPH}> {{ ?s ?p ?o }} }}"
    )
    if count_ok and "results" in count_result:
        count = int(count_result["results"]["bindings"][0]["n"]["value"])
        if logger:
            logger.info(f"[materialize] Inferred graph has {count} triples")


def materialize_all_types(logger=None) -> Tuple[bool, Dict[str, Any]]:
    """
    Rebuild the entire inferred graph after an ontology update.
    Runs in a background thread so the HTTP response is not blocked.
    """
    thread = threading.Thread(
        target=_run_materialize_all,
        kwargs={"logger": logger},
        daemon=True,
    )
    thread.start()
    return True, {
        "graph": INFERRED_GRAPH,
        "status": "started",
        "message": "Materialization running in background",
    }


def materialize_nanopub_types(jsonld_text: str, logger=None) -> Tuple[bool, Dict[str, Any]]:
    """
    After a nanopub is upserted, materialize inferred rdf:type triples
    for instances in that nanopub by walking rdfs:subClassOf+ chains.
    Only adds types not already asserted on each instance.
    """
    from rdflib import ConjunctiveGraph, URIRef

    cg = ConjunctiveGraph()
    cg.parse(data=jsonld_text, format="json-ld")

    instance_types = set()
    for s, p, o in cg.triples((None, RDF.type, None)):
        if isinstance(s, URIRef) and isinstance(o, URIRef):
            instance_types.add((str(s), str(o)))

    if not instance_types:
        return True, {"message": "No typed instances found", "inferred_triples": 0}

    values_clause = " ".join(
        f"(<{inst}> <{cls}>)" for inst, cls in instance_types
    )

    sparql = SPARQL_PREFIXES + f"""
    INSERT {{
        GRAPH <{INFERRED_GRAPH}> {{ ?x a ?super }}
    }}
    WHERE {{
        VALUES (?x ?class) {{ {values_clause} }}
        ?class rdfs:subClassOf+ ?super .
        FILTER (!isBlank(?super))
        FILTER NOT EXISTS {{ ?x a ?super }}
    }}
    """
    ok, info = _fuseki_update(sparql)
    if logger:
        if ok:
            logger.info(f"[materialize] Materialized types for {len(instance_types)} instances")
        else:
            logger.error(f"[materialize] Failed to materialize nanopub types: {info}")

    return ok, {**info, "instances_processed": len(instance_types)}


def cleanup_inferred_types(entity_uri: str, logger=None) -> Tuple[bool, Dict[str, Any]]:
    """
    After a nanopub is deleted, remove its inferred rdf:type triples
    from the inferred graph. Matches any subject that starts with the
    nanopub's entity URI (covers the base ID and all fragment paths).
    """
    sparql = f"""
    DELETE WHERE {{
        GRAPH <{INFERRED_GRAPH}> {{
            ?x a ?type .
            FILTER (STRSTARTS(STR(?x), "{entity_uri}"))
        }}
    }}
    """
    ok, info = _fuseki_update(sparql)
    if logger:
        if ok:
            logger.info(f"[materialize] Cleaned up inferred types for {entity_uri}")
        else:
            logger.error(f"[materialize] Failed to clean up inferred types: {info}")

    return ok, {**info, "entity_uri": entity_uri}
