import rdflib

from whyis.test.agent_unit_test_case import AgentUnitTestCase
from base64 import b64encode
import autonomic
from . import template

SKOS = rdflib.Namespace("http://www.w3.org/2004/02/skos/core#")

class TestChemicalNames(template.IngestTest):

    data = '''<?xml version="1.0" encoding="UTF-8"?>
    <PolymerNanocomposite>
      <ID>L101_S3_Dang_2007</ID>
      <MATERIALS>
        <Matrix>
          <MatrixComponent>
            <ChemicalName>bisphenol A</ChemicalName>
            <PubChemRef>6623</PubChemRef>
            <uSMILES>CC(C)(C1=CC=C(OCC2CO2)C=C1)C3=CC=C(OCC4CO4)C=C3</uSMILES>
            <Abbreviation>BPA</Abbreviation>
            <ManufacturerOrSourceName>Dow chemical</ManufacturerOrSourceName>
            <TradeName>DER661</TradeName>
          </MatrixComponent>
        </Matrix>
        <Filler>
          <FillerComponent>
            <ChemicalName>barium titanate</ChemicalName>
            <StdChemicalName>Barium titanate</StdChemicalName>
            <Abbreviation>BaTiO3</Abbreviation>
            <ManufacturerOrSourceName>Guoteng electronic ceramic company</ManufacturerOrSourceName>
            <ParticleSurfaceTreatment>
              <ChemicalName>silane coupling agent</ChemicalName>
              <Abbreviation>KH550</Abbreviation>
            </ParticleSurfaceTreatment>
            <ParticleSurfaceTreatment>
              <ChemicalName>phosphated ester</ChemicalName>
              <Abbreviation>BYK-9010</Abbreviation>
            </ParticleSurfaceTreatment>
          </FillerComponent>
        </Filler>
      </MATERIALS>
    </PolymerNanocomposite>'''

    def test_chemprops_id(self):
        print (len(self.app.db))
        component_types = set(self.app.db.query('''
            SELECT ?parttype ?role WHERE {
                ?sample a <http://nanomine.org/ns/PolymerNanocomposite>.
                ?sample <http://semanticscience.org/resource/hasComponentPart>/<http://semanticscience.org/resource/isSurroundedBy>? ?part.
                ?part a ?parttype;
                    <http://semanticscience.org/resource/hasRole> [
                        a ?role;
                        <http://semanticscience.org/resource/inRelationTo> ?sample
                    ].
            }'''))
        print ('\n'.join(['\t'.join(x) for x in component_types]))
        self.assertIn((rdflib.URIRef('http://nanomine.org/compound/BariumTitanate'),
                       rdflib.URIRef('http://nanomine.org/ns/Filler')), component_types)
        filler_type = self.app.db.resource(rdflib.URIRef('http://nanomine.org/compound/BariumTitanate'))
        print ('\n'.join(["%s\t%s" %(p,o) for p,o in filler_type.predicate_objects()]))

        self.assertEquals(filler_type.value(rdflib.RDFS.label), rdflib.Literal("Barium titanate"))
        self.assertEquals(filler_type.value(SKOS.altLabel), rdflib.Literal("barium titanate"))
        self.assertEquals(filler_type.value(SKOS.notation), rdflib.Literal("BaTiO3"))

    def test_pubchem_id(self):
        print (len(self.app.db))
        component_types = set(self.app.db.query('''
            SELECT ?parttype ?role WHERE {
                ?sample a <http://nanomine.org/ns/PolymerNanocomposite>.
                ?sample <http://semanticscience.org/resource/hasComponentPart>/<http://semanticscience.org/resource/isSurroundedBy>? ?part.
                ?part a ?parttype;
                    <http://semanticscience.org/resource/hasRole> [
                        a ?role;
                        <http://semanticscience.org/resource/inRelationTo> ?sample
                    ].
            }'''))
        print ('\n'.join(['\t'.join(x) for x in component_types]))
        self.assertIn((rdflib.URIRef('http://rdf.ncbi.nlm.nih.gov/pubchem/compound/CID6623'),
                       rdflib.URIRef('http://nanomine.org/ns/Matrix')), component_types)
        matrix_type = self.app.db.resource(rdflib.URIRef('http://rdf.ncbi.nlm.nih.gov/pubchem/compound/CID6623'))
        print ('\n'.join(["%s\t%s" %(p,o) for p,o in matrix_type.predicate_objects()]))

        self.assertEquals(matrix_type.value(rdflib.RDFS.label), rdflib.Literal("bisphenol A"))
        self.assertEquals(matrix_type.value(SKOS.notation), rdflib.Literal("BPA"))


    def test_nonchemprops_id(self):
        print (len(self.app.db))
        component_types = set(self.app.db.query('''
            SELECT ?parttype ?role WHERE {
                ?sample a <http://nanomine.org/ns/PolymerNanocomposite>.
                ?sample <http://semanticscience.org/resource/hasComponentPart>/<http://semanticscience.org/resource/isSurroundedBy>? ?part.
                ?part a ?parttype;
                    <http://semanticscience.org/resource/hasRole> [
                        a ?role;
                        <http://semanticscience.org/resource/inRelationTo> ?sample
                    ].
            }'''))
        print ('\n'.join(['\t'.join(x) for x in component_types]))
        self.assertIn((rdflib.URIRef('http://nanomine.org/compound/PhosphatedEster'),
                       rdflib.URIRef('http://nanomine.org/ns/SurfaceTreatment')), component_types)
        self.assertIn((rdflib.URIRef('http://nanomine.org/compound/SilaneCouplingAgent'),
                       rdflib.URIRef('http://nanomine.org/ns/SurfaceTreatment')), component_types)
