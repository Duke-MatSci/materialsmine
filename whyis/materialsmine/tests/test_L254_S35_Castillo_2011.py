import rdflib
from . import ingest_tester
from . import template

file_under_test = "L254_S35_Castillo_2011"

class IngestTestRunner(template.IngestTestSetup):
    first_run = bool()
    @classmethod
    def setUpClass(cls):
        cls.file_under_test = file_under_test
        super().setUpClass()

    def no_test_triples(self):
        ingest_tester.print_triples(self)

    def no_test_non_spherical_shape(self):
        width_description = rdflib.Literal("50th percentile value measured by TEM, diameter")
        length_description = rdflib.Literal("50th percentile value measured by TEM")
        depth_description = rdflib.Literal("50th percentile value measured by TEM, diameter")
        expected_width_value = rdflib.Literal(10.5)
        expected_length_value = rdflib.Literal(727.0)
        expected_depth_value = rdflib.Literal(10.5)
        ingest_tester.test_non_spherical_shape(self, width_description, expected_width_value, length_description, expected_length_value, depth_description, expected_depth_value)
