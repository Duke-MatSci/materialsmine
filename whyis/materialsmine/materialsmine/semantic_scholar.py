from whyis import autonomic
from rdflib import URIRef, BNode, RDF, Literal, Namespace
from slugify import slugify
from whyis import nanopub
from .surface_energy_terms import surface_energy_terms, pprint
import requests
import json

from whyis.namespace import sioc_types, sioc, sio, dc, prov, whyis

mm = Namespace("http://materialsmine.org/ns/")

semantic_scholar_api_endpoint = 'https://api.semanticscholar.org/graph/v1/paper/'

def get_paper_info(doi, fields):
    url = doi.replace('http://dx.doi.org/',semantic_scholar_api_endpoint)
    return requests.get(url, params={'fields':','.join(fields)}).json()

class AbstractAnnotator(autonomic.GlobalChangeService):
    activity_class = mm.SemanticScholarAbstractAnnotation

    def getInputClass(self):
        return mm.ResearchArticle

    def getOutputClass(self):
        return mm.ResearchArticleWithAbstract

    # This is redundant when we have input and output classes.
    def get_query(self):
            return '''select ?resource where {
        ?resource rdf:type/rdfs:subClassOf* <http://materialsmine.org/ns/ResearchArticle>.
        filter not exists { ?resource rdf:type/rdfs:subClassOf* <http://materialsmine.org/ns/ResearchArticleWithAbstract>. }
    }'''

    def process(self, i, o):
        info = get_paper_info(i.identifier, ['abstract'])
        if info.get('abstract',None) is not None:
            o.add(dc.abstract, Literal(info['abstract']))
