from typing import Any, Dict, Optional, Tuple, List
import requests
from rdflib import ConjunctiveGraph, Graph, URIRef
from urllib.parse import quote
from app.config import Config
from app.ontology.helpers.extract import mime_for

# Push the ontology graph to a Fuseki triplestore
def push_to_fuseki(
    ontology_graph: Graph,
    ontology_format: str,
    graph_uri: Optional[str],
    replace: bool = True,
) -> Tuple[bool, Dict[str, Any]]:
    """
    Push the ontology into Fuseki using the Graph Store Protocol.
    If graph_uri is None, writes to the default graph.
    """
    # base = Config.FUSEKI_BASE_URL or "http://localhost:3030"
    base = "http://host.docker.internal:3030"
    dataset = Config.FUSEKI_DATASET
    user = Config.FUSEKI_USER
    pwd = Config.FUSEKI_PWD

    fmt = (ontology_format or "turtle").lower()
    payload = ontology_graph.serialize(format=fmt)
    if isinstance(payload, str):
        payload = payload.encode("utf-8")

    content_type = mime_for(fmt)
    auth = (user, pwd) if user and pwd else None

    gsp = "{}/{}/data".format(base.rstrip("/"), dataset)
    if graph_uri:
        url = "{}?graph={}".format(gsp, quote(graph_uri, safe=""))
        graph_label = graph_uri
    else:
        url = "{}?default".format(gsp)
        graph_label = "default"

    method = requests.put if replace else requests.post
    try:
        r = method(url, data=payload, headers={"Content-Type": content_type}, auth=auth, timeout=20)
        ok = 200 <= r.status_code < 300
        return ok, {
            # "endpoint": url,
            "method": "PUT" if replace else "POST",
            "status": r.status_code,
            "reason": r.reason,
            "bytes_sent": len(payload),
            "content_type": content_type,
            "graph": graph_label,
        }
    except Exception as e:
        return False, {
            # "endpoint": url,
            "method": "PUT" if replace else "POST",
            "error": str(e),
            "graph": graph_label,
        }

def list_named_graphs(jsonld_text: str) -> List[Tuple[str, int]]:
    cg = ConjunctiveGraph()
    cg.parse(data=jsonld_text, format="json-ld")
    out: List[Tuple[str, int]] = []
    for ctx in cg.contexts():
        if isinstance(ctx.identifier, URIRef):
            out.append((str(ctx.identifier), len(ctx)))
    return sorted(out, key=lambda x: x[0])

def _nt_for_context(ctx) -> str:
    g = Graph()
    for t in ctx.triples((None, None, None)):
        g.add(t)
    nt = g.serialize(format="nt")
    return nt.decode("utf-8") if isinstance(nt, bytes) else nt

def upsert_np_graphs_strict_transaction(
    jsonld_text: str,
    only_these_suffixes: Optional[List[str]] = None,  # e.g. ["#assertion", "#provenance", "#pubinfo", "#head"]
    timeout: int = 120,
) -> Tuple[bool, Dict[str, Any]]:
    """
    Build ONE SPARQL Update that clears and inserts all graphs in the nanopublication.
    Runs as a single transactional operation in Fuseki.
    Returns (ok, report).
    """
        # base = Config.FUSEKI_BASE_URL or "http://localhost:3030"
    base = ("http://host.docker.internal:3030").rstrip("/")
    dataset = Config.FUSEKI_DATASET
    user = Config.FUSEKI_USER
    pwd = Config.FUSEKI_PWD
    auth = (user, pwd) if user and pwd else None

    cg = ConjunctiveGraph()
    cg.parse(data=jsonld_text, format="json-ld")

    def _wanted(uri: str) -> bool:
        if not only_these_suffixes:
            return True
        return any(uri.endswith(suf) for suf in only_these_suffixes)

    # Build a single SPARQL UPDATE text
    updates = []
    graphs_summary: Dict[str, Any] = {}
    for ctx in cg.contexts():
        if not isinstance(ctx.identifier, URIRef):
            continue
        graph_uri = str(ctx.identifier)
        if not _wanted(graph_uri):
            continue

        nt = _nt_for_context(ctx).strip()
        # CLEAR GRAPH + INSERT DATA for this graph
        if nt:
            updates.append(f"CLEAR SILENT GRAPH <{graph_uri}> ; INSERT DATA {{ GRAPH <{graph_uri}> {{\n{nt}\n}} }}")
        else:
            # If empty graph, just clear it.
            updates.append(f"CLEAR SILENT GRAPH <{graph_uri}>")
        graphs_summary[graph_uri] = {"triples": nt.count("\n")}

    if not updates:
        return False, {"message": "No named graphs found in JSON-LD to persist."}

    update_body = ";\n".join(updates) + "\n"

    endpoint = f"{base}/{dataset}/update"
    headers = {"Content-Type": "application/sparql-update; charset=utf-8"}

    try:
        r = requests.post(endpoint, data=update_body.encode("utf-8"), headers=headers, auth=auth, timeout=timeout)
        ok = 200 <= r.status_code < 300
        report = {
            "status": r.status_code,
            "ok": ok,
            "graphs": graphs_summary,
            "bytes_sent": len(update_body.encode("utf-8")),
            "endpoint": endpoint,
            "error": None if ok else r.text,
        }
        return ok, report
    except Exception as e:
        return False, {
            "status": 0,
            "ok": False,
            "graphs": graphs_summary,
            "endpoint": endpoint,
            "error": str(e),
        }