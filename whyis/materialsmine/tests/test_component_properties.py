import rdflib

from . import template

SKOS = rdflib.Namespace("http://www.w3.org/2004/02/skos/core#")

class TestComponentProperties(template.IngestTest):

    data = '''<?xml version="1.0" encoding="UTF-8"?>
    <PolymerNanocomposite>
      <ID>L101_S3_Dang_2007</ID>
      <Control_ID>L101_S1_Dang_2007</Control_ID>
      <SchemaVersion>PNC_schema_010720</SchemaVersion>
      <SchemaID>5e496fa88aba2cf1302d73e3</SchemaID>
      <DatasetID>5e4c1081c941bb7a1270dd9d</DatasetID>
      <MATERIALS>
        <Matrix>
          <MatrixComponent>
            <StdChemicalName>DGEBA Epoxy Resin</StdChemicalName>
            <Density>
              <description>inserted from ChemProps, NanoMine</description>
              <value>1.13</value>
              <unit>g/cm3</unit>
            </Density>
          </MatrixComponent>
        </Matrix>
        <Filler>
          <FillerComponent>
            <StdChemicalName>Barium titanate</StdChemicalName>
            <Density>
              <description>inserted from ChemProps, NanoMine</description>
              <value>6.02</value>
              <unit>g/cm3</unit>
            </Density>
            <SphericalParticleDiameter>
              <value>0.1</value>
              <unit>micrometers</unit>
            </SphericalParticleDiameter>
            <SurfaceArea>
              <specific>
                <description>value ranges from 9 - 1.3</description>
                <value>9</value>
                <unit>m^2/g</unit>
              </specific>
            </SurfaceArea>
          </FillerComponent>
          <FillerComposition>
            <Fraction>
              <mass>
                <value>0.7802981205443941</value>
                <source>computed by NanoMine</source>
              </mass>
              <volume>
                <value>0.4</value>
                <source>reported</source>
              </volume>
            </Fraction>
          </FillerComposition>
        </Filler>
      </MATERIALS>
    </PolymerNanocomposite>
'''

    def test_fractions(self):
        print (len(self.app.db))
        component_types = set(self.app.db.query('''
            SELECT ?role ?fractiontype ?value WHERE {
                ?sample a <http://nanomine.org/ns/PolymerNanocomposite>.
                ?sample <http://semanticscience.org/resource/hasComponentPart> ?part.
                ?part <http://semanticscience.org/resource/hasRole> [
                        a ?role;
                        <http://semanticscience.org/resource/inRelationTo> ?sample
                    ].
                ?part <http://semanticscience.org/resource/hasAttribute> [
                    <http://semanticscience.org/resource/hasValue> ?value;
                    a ?fractiontype
                ]
            }'''))
        print(component_types)
        print ('\n'.join(['\t'.join(x) for x in component_types]))
        self.assertIn((rdflib.URIRef('http://nanomine.org/ns/Filler'),
                       rdflib.URIRef('http://nanomine.org/ns/VolumeFraction'),
                       rdflib.Literal(0.4)), component_types)
        self.assertIn((rdflib.URIRef('http://nanomine.org/ns/Filler'),
                       rdflib.URIRef('http://nanomine.org/ns/MassFraction'),
                       rdflib.Literal(0.7802981205443941)), component_types)

    def test_density(self):
        print (len(self.app.db))
        component_types = set(self.app.db.query('''
            SELECT ?role ?fractiontype ?value ?unit WHERE {
                ?sample a <http://nanomine.org/ns/PolymerNanocomposite>.
                ?sample <http://semanticscience.org/resource/hasComponentPart> ?part.
                ?part <http://semanticscience.org/resource/hasRole> [
                        a ?role;
                        <http://semanticscience.org/resource/inRelationTo> ?sample
                    ].
                ?part <http://semanticscience.org/resource/hasAttribute> [
                    <http://semanticscience.org/resource/hasValue> ?value;
                    a ?fractiontype;
                    <http://semanticscience.org/resource/hasUnit> ?unit;
                ]
            }'''))
        print ('\n'.join(['\t'.join(x) for x in component_types]))
        self.assertIn((rdflib.URIRef('http://nanomine.org/ns/Filler'),
                       rdflib.URIRef('http://nanomine.org/ns/Density'),
                       rdflib.Literal(6.02),
                       rdflib.URIRef('http://www.ontology-of-units-of-measure.org/resource/om-2/gramPerCubicCentimetre')), component_types)
        self.assertIn((rdflib.URIRef('http://nanomine.org/ns/Matrix'),
                       rdflib.URIRef('http://nanomine.org/ns/Density'),
                       rdflib.Literal(1.13),
                       rdflib.URIRef('http://www.ontology-of-units-of-measure.org/resource/om-2/gramPerCubicCentimetre')), component_types)
