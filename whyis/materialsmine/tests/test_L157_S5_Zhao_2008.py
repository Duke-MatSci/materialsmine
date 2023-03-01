from . import template
from . import ingest_tester

class L157_S5_Zhao_2008(template.IngestTestSetup):
    @classmethod
    def setUpClass(cls):
        cls.file_under_test = "L157_S5_Zhao_2008"
        super().setUpClass()

    # def test_triples(self):
    #     ingest_tester.print_triples(self)

    def no_test_filler_trade_names(self):
        ingest_tester.test_filler_trade_names(self)

    def no_test_matrix_trade_names(self):
        ingest_tester.test_matrix_trade_names(self)

    def no_test_complete_material(self):
        ingest_tester.test_complete_material(self)
