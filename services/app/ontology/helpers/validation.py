import re
from typing import Optional, Tuple, Dict, Any, List

import requests
from rdflib import Graph, URIRef
from rdflib.namespace import RDF, RDFS
from rdflib.util import guess_format

DEFAULT_ONTOLOGY_LINK = (
    "https://raw.githubusercontent.com/Duke-MatSci/mm-apps/refs/heads/main/ontology/%40mm.ttl"
)

# Regex for DOI literal and ORCID IRI validation
RE_DOI_LITERAL = re.compile(r"^10\.[0-9]{4,9}/[-._;()/:A-Z0-9]+$", re.I)
RE_DOI_IRI = re.compile(r"^https?://(dx\.)?doi\.org/10\.[0-9]{4,9}/[-._;()/:A-Z0-9]+$", re.I)
RE_ORCID_IRI = re.compile(r"^https://orcid\.org/\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$", re.I)

FREQ_UNITS = [
    "http://qudt.org/vocab/unit/HZ",
    "http://qudt.org/vocab/unit/KiloHZ",
    "http://qudt.org/vocab/unit/MegaHZ",
    "http://qudt.org/vocab/unit/GigaHZ",
]

def _http_get_text(url: str, timeout: int = 15) -> str:
    r = requests.get(url, timeout=timeout)
    r.raise_for_status()
    return r.text

def _load_graph_from_text_or_link(
    text: Optional[str],
    link: Optional[str],
    default_format: str = "turtle",
) -> Graph:
    g = Graph()
    if text and text.strip():
        g.parse(data=text, format=default_format)
        return g
    if link and link.strip():
        # Let rdflib guess by URL suffix; fall back to provided default_format
        fmt = guess_format(link) or default_format
        g.parse(link, format=fmt)
        return g
    raise ValueError("Neither inline text nor link provided for graph input.")

def _detect_mm_base_iri(ont: Graph) -> Optional[str]:
    # 1) Try the 'mm' prefix directly
    for prefix, ns in ont.namespaces():
        if prefix == "":
            iri = str(ns)
            return iri if iri.endswith(("#", "/")) else iri + "#"
    # 2) Try to infer by well-known class local names
    candidates = {
        "BandGapSize",
        "BandGapLocation",
        "Binary2DGeometry",
        "CondensedBinary2DGeometry",
        "CMatrixElement",
        "CMatrixIndexI",
        "CMatrixIndexJ",
        "CMatrixIndicesIJ",
        "CTensor",
        "CTensorIndexI",
        "CTensorIndexJ",
        "CTensorIndexK",
        "CTensorIndexL",
        "CTensorIndicesIJKL",
        "ConcretizedModel",
        "Property",
    }
    for s in ont.subjects(RDF.type, RDFS.Class):
        if isinstance(s, URIRef):
            uri = str(s)
            # crude localname split
            local = uri.rsplit("#", 1)[-1] if "#" in uri else uri.rsplit("/", 1)[-1]
            if local in candidates:
                base = uri[: -(len(local))]
                return base if base.endswith(("#", "/")) else base + "#"
    return None

def _build_mm_shapes(mm_base: str, allowed_unit_iris: Optional[List[str]] = None) -> str:
    """
    Tailored SHACL shapes for your ontology. We inline the shapes here and inject
    the detected mm: base IRI so targets match your classes.
    """
    if not mm_base.endswith(("#", "/")):
        mm_base += "#"   # <-- fix

    units_list = allowed_unit_iris or FREQ_UNITS
    units_ttl = " ".join(f"<{u}>" for u in units_list)

    return f'''
@prefix sh:     <http://www.w3.org/ns/shacl#> .
@prefix xsd:    <http://www.w3.org/2001/XMLSchema#> .
@prefix rdf:    <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs:   <http://www.w3.org/2000/01/rdf-schema#> .
@prefix sio:    <http://semanticscience.org/resource/> .
@prefix prov:   <http://www.w3.org/ns/prov#> .
@prefix schema: <http://schema.org/> .
@prefix qudt:   <http://qudt.org/schema/qudt/> .
@prefix unit:   <http://qudt.org/vocab/unit/> .
@prefix mm:     <{mm_base}> .

mm:BandGapSizeShape a sh:NodeShape ;
  sh:targetClass mm:BandGapSize ;
  sh:property [
    sh:path sio:SIO_000300 ;
    sh:datatype xsd:decimal ;
    sh:minExclusive 0 ;
    sh:maxCount 1 ;
    sh:message "BandGapSize must have exactly one positive decimal value (sio:has value)." ;
  ] ;
  sh:property [
    sh:path sio:SIO_000221 ;
    sh:nodeKind sh:IRI ;
    sh:minCount 1 ;
    sh:in ( {units_ttl} ) ;
    sh:message "BandGapSize must have a unit IRI (Hz/kHz/MHz/GHz or configured list)." ;
  ] .

mm:BandGapLocationShape a sh:NodeShape ;
  sh:targetClass mm:BandGapLocation ;
  sh:property [
    sh:path sio:SIO_000300 ;
    sh:datatype xsd:decimal ;
    sh:minInclusive 0 ;
    sh:message "BandGapLocation must have a non-negative decimal value." ;
  ] ;
  sh:property [
    sh:path sio:SIO_000221 ;
    sh:nodeKind sh:IRI ;
    sh:minCount 1 ;
    sh:in ( {units_ttl} ) ;
    sh:message "BandGapLocation must have a frequency unit." ;
  ] .

mm:Binary2DGeometryShape a sh:NodeShape ;
  sh:targetClass mm:Binary2DGeometry ;
  sh:property [
    sh:path sio:SIO_000300 ;
    sh:datatype xsd:string ;
    sh:pattern "^[01\\\\s]+$" ;      # <-- \s must be \\s in Turtle, so \\\\s in Python
    sh:minLength 1 ;
    sh:maxCount 1 ;
    sh:message "Binary2DGeometry must have a 0/1 string (optionally spaced) as its value." ;
  ] .

mm:CondensedBinary2DGeometryShape a sh:NodeShape ;
  sh:targetClass mm:CondensedBinary2DGeometry ;
  sh:property [
    sh:path sio:SIO_000300 ;
    sh:datatype xsd:string ;
    sh:pattern "^[01\\\\s]+$" ;      # <-- same here
    sh:minLength 1 ;
    sh:maxCount 1 ;
    sh:message "CondensedBinary2DGeometry must have a 0/1 string value." ;
  ] .

mm:CMatrixIndicesIJShape a sh:NodeShape ;
  sh:targetClass mm:CMatrixIndicesIJ ;
  sh:property [
    sh:path sio:SIO_000300 ; sh:datatype xsd:string ;
    sh:pattern "^[1-6]{{2}}$" ;
    sh:message "CMatrixIndicesIJ must be a two-digit string 1..6 each (Voigt IJ)." ;
  ] .

mm:CTensorIndicesIJKLShape a sh:NodeShape ;
  sh:targetClass mm:CTensorIndicesIJKL ;
  sh:property [
    sh:path sio:SIO_000300 ; sh:datatype xsd:string ;
    sh:pattern "^[1-3]{{4}}$" ;
    sh:message "CTensorIndicesIJKL must be a four-digit string, each 1..3." ;
  ] .

mm:PersonShape a sh:NodeShape ;
  sh:targetClass <http://schema.org/Person> ;
  sh:property [
    sh:path <http://schema.org/name> ; sh:datatype xsd:string ; sh:minCount 1 ; sh:maxCount 1 ;
    sh:message "Person needs exactly one schema:name." ;
  ] ;
  sh:property [
    sh:path <http://schema.org/sameAs> ; sh:nodeKind sh:IRI ;
    sh:pattern "^https://orcid\\\\.org/\\\\d{{4}}-\\\\d{{4}}-\\\\d{{4}}-\\\\d{{3}}[0-9X]$" ;  # <-- \\.
    sh:flags "i" ;
    sh:message "schema:sameAs should be a valid ORCID URL." ;
  ] .

mm:ArticleShape a sh:NodeShape ;
  sh:targetClass <http://schema.org/ScholarlyArticle> ;
  sh:property [
    sh:path <http://schema.org/author> ; sh:nodeKind sh:IRI ; sh:minCount 1 ;
    sh:message "Article should have >=1 IRI author." ;
  ] ;
  sh:property [
    sh:path <http://schema.org/identifier> ; sh:datatype xsd:string ;
    sh:pattern "^10\\\\.[0-9]{{4,9}}/[-._;()/:A-Z0-9]+$" ;   # <-- \\.
    sh:flags "i" ;
    sh:minCount 1 ;
    sh:message "Article must have a DOI literal (schema:identifier)." ;
  ] ;
  sh:property [
    sh:path <http://schema.org/sameAs> ; sh:nodeKind sh:IRI ;
    sh:pattern "^https://doi\\\\.org/10\\\\.[0-9]{{4,9}}/[-._;()/:A-Z0-9]+$" ;  # <-- \\.
    sh:flags "i" ;
    sh:message "If schema:sameAs is used, prefer the https://doi.org/... form." ;
  ] .

[] a sh:NodeShape ;
  sh:targetObjectsOf sio:SIO_000008 ;
  sh:property [
    sh:path sio:SIO_000300 ;
    sh:minCount 1 ;
    sh:message "Attributes must carry a sio:has value."
  ] .

[] a sh:NodeShape ;
  sh:targetClass rdfs:Class ;
  sh:property [
    sh:path rdfs:label ;
    sh:minCount 1 ;
    sh:severity sh:Warning ;
    sh:message "Class should have an rdfs:label."
  ] .
'''

def _build_shapes_graph(mm_base: str, allowed_unit_iris: Optional[List[str]] = None) -> Graph:
    ttl = _build_mm_shapes(mm_base, allowed_unit_iris)
    g = Graph()
    g.parse(data=ttl, format="turtle")
    return g

def _serialize_shacl_results(results_graph: Graph) -> List[Dict[str, Any]]:
    """
    Extract a compact list of violations from sh:ValidationReport graph.
    """
    SH = "http://www.w3.org/ns/shacl#"
    sh_result = URIRef(SH + "ValidationResult")
    out = []
    for r in results_graph.subjects(RDF.type, sh_result):
        entry = {}
        for p, k in [
            (SH + "focusNode", "focusNode"),
            (SH + "resultPath", "resultPath"),
            (SH + "resultSeverity", "severity"),
            (SH + "resultMessage", "message"),
            (SH + "value", "value"),
            (SH + "sourceConstraintComponent", "sourceConstraint"),
            (SH + "sourceShape", "sourceShape"),
        ]:
            v = list(results_graph.objects(r, URIRef(p)))
            if v:
                # flatten literals/URIs to strings
                entry[k] = [str(x) for x in v] if len(v) > 1 else str(v[0])
        out.append(entry)
    return out

def _collect_resolvable_urls(data_graph: Graph) -> List[str]:
    """
    Collect ORCID/DOI URLs to check via HTTP HEAD.
    - schema:sameAs IRIs that look like ORCID/DOI
    - schema:identifier DOI literals -> converted to doi.org URLs
    """
    SCHEMA_SAMEAS = URIRef("http://schema.org/sameAs")
    SCHEMA_IDENTIFIER = URIRef("http://schema.org/identifier")

    urls = set()

    for _, _, same in data_graph.triples((None, SCHEMA_SAMEAS, None)):
        s = str(same)
        if RE_ORCID_IRI.match(s) or RE_DOI_IRI.match(s):
            urls.add(s)

    for _, _, idlit in data_graph.triples((None, SCHEMA_IDENTIFIER, None)):
        s = str(idlit)
        if RE_DOI_LITERAL.match(s):
            urls.add(f"https://doi.org/{s}")

    return sorted(urls)

def _head_check(url: str, timeout: int = 8) -> Tuple[str, Any, bool]:
    try:
        r = requests.head(url, allow_redirects=True, timeout=timeout)
        ok = 200 <= r.status_code < 400
        return url, r.status_code, ok
    except Exception as e:
        return url, str(e), False