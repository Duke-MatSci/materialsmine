import rdflib

from . import ingest_tester, template

file_under_test = "L150_S7_Akcora_2009"

# TODO Add test for shear loading profile
class Test_L150_S7_Akcora_2009(template.IngestTestSetup):
    @classmethod
    def setUpClass(cls):
        cls.file_under_test = file_under_test
        super().setUpClass()

    def no_test_triples(self):
        ingest_tester.print_triples(self)
