import rdflib

from . import ingest_tester
from . import template

class L101_S3_Dang_2007(template.IngestTestSetup):
    @classmethod
    def setUpClass(cls):
        cls.file_under_test = "L101_S3_Dang_2007"
        super().setUpClass()

    def no_test_chemprops_id(self):
        print (len(self.app.db))
        component_types = [x.asdict() for x in self.app.db.query('''
            SELECT ?sample ?part ?parttype ?role WHERE {
                ?sample a <http://nanomine.org/ns/PolymerNanocomposite>.
                ?sample <http://semanticscience.org/resource/hasComponentPart>/<http://semanticscience.org/resource/isSurroundedBy>? ?part.
                ?part a ?parttype.
#                    <http://semanticscience.org/resource/hasRole> [
#                        a ?role;
#                        <http://semanticscience.org/resource/inRelationTo> ?sample
#                    ].
            }''')]
        print (component_types)



    def no_test_specific_surface_area(self):
        expected_surface_area = [rdflib.Literal(9.0)]
        expected_units = [rdflib.Literal("m^2/g")]
        ingest_tester.test_specific_surface_area(self, expected_surface_area, expected_units)
        ingest_tester.test_specific_surface_area(self)

    def no_test_print_triples(self):
        ingest_tester.print_triples(self)
