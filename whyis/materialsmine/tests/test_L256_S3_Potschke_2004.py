import rdflib

from . import ingest_tester, template

file_under_test = "L256_S3_Potschke_2004"

class IngestTestRunner(template.IngestTestSetup):
    first_run = bool()
    @classmethod
    def setUpClass(cls):
        cls.file_under_test = file_under_test
        super().setUpClass()

    def no_test_triples(self):
         ingest_tester.print_triples(self)

    def no_test_melt_viscosity(self):
         ingest_tester.test_melt_viscosity(self, [rdflib.Literal(1793550.45609)])
