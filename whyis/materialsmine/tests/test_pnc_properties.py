import rdflib

from . import template

SKOS = rdflib.Namespace("http://www.w3.org/2004/02/skos/core#")

class TestStaticProperties(template.IngestTest):

    data = '''<?xml version="1.0" encoding="UTF-8"?>
    <PolymerNanocomposite>
      <ID>L141_S19_Gao_2013</ID>
      <Control_ID>L141_S1_Gao_2013</Control_ID>
      <SchemaVersion>PNC_schema_010720</SchemaVersion>
      <SchemaID>5e496fa88aba2cf1302d73e3</SchemaID>
      <DatasetID>5e4c12fec941bb7a1270ddbb</DatasetID>
      <PROPERTIES>
        <Mechanical>
          <Tensile>
            <TensileModulus>
              <description>Modulus</description>
              <value>3.2</value>
              <unit>GPa</unit>
              <uncertainty>
                <type>absolute</type>
                <value>0.1</value>
              </uncertainty>
            </TensileModulus>
            <TensileStressAtYield>
              <description>Yield Stress</description>
              <value>76</value>
              <unit>MPa</unit>
              <uncertainty>
                <type>absolute</type>
                <value>0.5</value>
              </uncertainty>
            </TensileStressAtYield>
            <ElongationAtBreak>
              <description>strain at break</description>
              <value>0.079</value>
              <uncertainty>
                <type>absolute</type>
                <value>0.02</value>
              </uncertainty>
            </ElongationAtBreak>
            <Conditions>
              <StrainRate>
                <description>Tensile test strain rate</description>
                <value>0.1</value>
                <unit>mm/min</unit>
              </StrainRate>
            </Conditions>
          </Tensile>
        </Mechanical>
      </PROPERTIES>
    </PolymerNanocomposite>
'''

    def test_property(self):
        print (len(self.app.db))
        properties = set(self.app.db.query('''
            SELECT ?sample ?property ?unit ?value ?uncertainty WHERE {
                ?sample a <http://nanomine.org/ns/PolymerNanocomposite>.
                ?sample <http://semanticscience.org/resource/hasAttribute> ?attr.
                ?attr <http://semanticscience.org/resource/hasValue> ?value;
                    a ?property.
                optional {
                  ?attr <http://semanticscience.org/resource/hasUnit> ?unit.
                }
                optional {
                  ?attr <http://semanticscience.org/resource/hasAttribute> [
                    a <http://semanticscience.org/resource/UncertaintyValue>;
                    <http://semanticscience.org/resource/hasValue> ?uncertainty
                  ].
                }
            }'''))
        print ('\n'.join(['\t'.join([(val if val is not None else '-') for val in x]) for x in properties]))
        self.assertIn((rdflib.URIRef('http://nanomine.org/sample/l141-s19-gao-2013'),
                       rdflib.URIRef('http://nanomine.org/ns/TensileModulus'),
                       rdflib.URIRef('http://www.ontology-of-units-of-measure.org/resource/om-2/gigapascal'),
                       rdflib.Literal(3.2),
                       rdflib.Literal(0.1)), properties)
        self.assertIn((rdflib.URIRef('http://nanomine.org/sample/l141-s19-gao-2013'),
                       rdflib.URIRef('http://nanomine.org/ns/ElongationAtBreak'),
                       None, # no unit
                       rdflib.Literal(0.079),
                       rdflib.Literal(0.02)), properties)

import rdflib

from . import template

SKOS = rdflib.Namespace("http://www.w3.org/2004/02/skos/core#")

class TestDynamicProperties(template.IngestTest):

    data = '''<?xml version="1.0" encoding="UTF-8"?>
    <PolymerNanocomposite>
      <ID>L104_S4_He_2009</ID>
      <Control_ID>L104_S1_He_2009</Control_ID>
      <SchemaVersion>PNC_schema_010720</SchemaVersion>
      <SchemaID>5e496fa88aba2cf1302d73e3</SchemaID>
      <DatasetID>5e4c10bbc941bb7a1270dd9f</DatasetID>
      <PROPERTIES>
        <Electrical>
          <AC_DielectricDispersion>
            <Dielectric_Real_Permittivity>
              <description>measured at 1000 Hz and room temperature</description>
              <value>25.4423</value>
            </Dielectric_Real_Permittivity>
          </AC_DielectricDispersion>
          <AC_DielectricDispersion>
            <DielectricDispersionDependence>
              <FrequencyDependence>
                <condition>
                  <temperature>
                    <value>25</value>
                    <unit>Celsius</unit>
                  </temperature>
                </condition>
              </FrequencyDependence>
            </DielectricDispersionDependence>
            <Dielectric_Real_Permittivity>
              <data>
                <description>dependence of dielectric constants on the frequency for PVDF/xGnP nano composites at room temperature</description>
                <AxisLabel>
                  <xName>Frequency</xName>
                  <xUnit>Hz</xUnit>
                  <yName>Dielectric permittivity</yName>
                  <yUnit>dimensionless</yUnit>
                </AxisLabel>
                <data>
                  <headers>
                    <column id="0">frequency (Hz)</column>
                    <column id="1">Dielectric Permittivity</column>
                  </headers>
                  <rows>
                    <row id="0">
                      <column id="0">53</column>
                      <column id="1">33.8412508779</column>
                    </row>
                    <row id="1">
                      <column id="0">54</column>
                      <column id="1">24.9339073612</column>
                    </row>
                  </rows>
                </data>
              </data>
            </Dielectric_Real_Permittivity>
          </AC_DielectricDispersion>
        </Electrical>
      </PROPERTIES>
    </PolymerNanocomposite>'''

    def test_curve(self):
        print (len(self.app.db))
        properties = set(self.app.db.query('''
            SELECT ?sample ?property ?unit ?value ?independentVar ?indepValue ?indepUnit WHERE {
                ?sample a <http://nanomine.org/ns/PolymerNanocomposite>.
                ?sample <http://semanticscience.org/resource/hasAttribute> ?attr.
                ?attr <http://semanticscience.org/resource/hasValue> ?value.
                ?attr a ?property.
                optional {
                  ?attr <http://semanticscience.org/resource/hasUnit> ?unit.
                }
                optional {
                  ?attr <http://semanticscience.org/resource/inRelationTo> ?irt.
                  ?irt a ?independentVar;
                    <http://semanticscience.org/resource/hasValue> ?indepValue.
                  optional {
                    ?irt <http://semanticscience.org/resource/hasUnit> ?indepUnit.
                  }
                }
            }'''))
        print ('\n'.join(['\t'.join([(val if val is not None else '-') for val in x]) for x in properties]))
        self.assertIn((rdflib.URIRef('http://nanomine.org/sample/l104-s4-he-2009'),
                       rdflib.URIRef('http://nanomine.org/ns/DielectricPermittivity'),
                       None,
                       rdflib.Literal(33.8412508779),
                       rdflib.URIRef('http://nanomine.org/ns/Frequency'),
                       rdflib.Literal(53.0),
                       rdflib.URIRef('http://www.ontology-of-units-of-measure.org/resource/om-2/hertz')), properties)
        self.assertIn((rdflib.URIRef('http://nanomine.org/sample/l104-s4-he-2009'),
                       rdflib.URIRef('http://nanomine.org/ns/DielectricPermittivity'),
                       None,
                       rdflib.Literal(24.9339073612),
                       rdflib.URIRef('http://nanomine.org/ns/Frequency'),
                       rdflib.Literal(54.0),
                       rdflib.URIRef('http://www.ontology-of-units-of-measure.org/resource/om-2/hertz')), properties)
