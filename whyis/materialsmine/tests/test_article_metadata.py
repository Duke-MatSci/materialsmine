import rdflib

from . import template

SKOS = rdflib.Namespace("http://www.w3.org/2004/02/skos/core#")

class TestArticleMetadata(template.IngestTest):

    data = '''<?xml version="1.0" encoding="UTF-8"?>
    <PolymerNanocomposite>
      <ID>L101_S3_Dang_2007</ID>
      <Control_ID>L101_S1_Dang_2007</Control_ID>
      <SchemaVersion>PNC_schema_010720</SchemaVersion>
      <SchemaID>5e496fa88aba2cf1302d73e3</SchemaID>
      <DatasetID>5e4c1081c941bb7a1270dd9d</DatasetID>
  <DATA_SOURCE>
    <Citation>
      <CommonFields>
        <CitationType>research article</CitationType>
        <Publication>Composites Science and Technology</Publication>
        <Title>Study on microstructure and dielectric property of the BaTiO3/epoxy resin composites</Title>
        <Author>Dang, Zhi-Min</Author>
        <Author>Yu, Yan-Fei</Author>
        <Author>Xu, Hai-Ping</Author>
        <Author>Bai, Jinbo</Author>
        <Keyword>Dielectric properties</Keyword>
        <Keyword>Microstructure</Keyword>
        <Keyword>Silane coupling agent</Keyword>
        <Keyword>BaTiO3</Keyword>
        <Publisher>Elsevier</Publisher>
        <PublicationYear>2008</PublicationYear>
        <DOI>10.1016/j.compscitech.2007.05.021</DOI>
        <Volume>68</Volume>
        <URL>https://www.sciencedirect.com/science/article/pii/S0266353807002199?via%3Dihub</URL>
        <Language>English</Language>
        <Location>Key Laboratory of Beijing City on Preparation and Processing of Novel Polymer Materials and Key Laboratory of the Ministry of Education on Nanomaterials, Beijing University of Chemical Technology, Beijing 100029, PR China</Location>
        <DateOfCitation>2015-07-24</DateOfCitation>
      </CommonFields>
      <CitationType>
        <Journal>
          <ISSN>0266-3538</ISSN>
          <Issue>1</Issue>
        </Journal>
      </CitationType>
    </Citation>
  </DATA_SOURCE>
    </PolymerNanocomposite>
'''

    def test_author_list(self):
        first_author = set(self.app.db.query('''select distinct ?firstAuthor where {
                ?pub bibo:authorList/rdf:first ?firstAuthor.
            }''', initNs={"bibo": rdflib.URIRef('http://purl.org/ontology/bibo/'), 'rdf': rdflib.RDF}))
        print ("First Author:")
        print ('\n'.join(['\t'.join(x) for x in first_author]))
        self.assertIn((rdflib.URIRef('http://nanomine.org/author/bai-jinbo'),), first_author)
        last_author = set(self.app.db.query('''select distinct ?lastAuthor where {
                ?pub bibo:authorList/rdf:rest* [rdf:first ?lastAuthor; rdf:rest rdf:nil].
            }''', initNs={"bibo": rdflib.URIRef('http://purl.org/ontology/bibo/'), 'rdf': rdflib.RDF}))
        print ("Last Author:")
        print ('\n'.join(['\t'.join(x) for x in last_author]))
        self.assertIn((rdflib.URIRef('http://nanomine.org/author/dang-zhi-min'),), last_author)
