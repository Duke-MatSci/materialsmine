from . import ingest_tester
from . import template

file_under_test = "L217_S2_Ash_2002"

class IngestTestRunner(template.IngestTestSetup):
    first_run = bool()
    @classmethod
    def setUpClass(cls):
        cls.file_under_test = file_under_test
        super().setUpClass()

    def no_test_triples(self):
         ingest_tester.print_triples(self)
