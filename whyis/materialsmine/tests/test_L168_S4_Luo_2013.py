from . import ingest_tester
from . import template
import rdflib

file_under_test = "L168_S4_Luo_2013"

class L168Test(template.IngestTestTests):
    @classmethod
    def setUpClass(cls):
        cls.file_under_test = file_under_test
        super().setUpClass()

    def no_test_authors(self):
        expected_authors = ["Luo, Suibin",
                            "Yu, Shuhui",
                            "Sun, Rong",
                            "Wong, Ching-Ping"]
        ingest_tester.test_authors(self, expected_authors)
        ingest_tester.test_authors(self)

    def no_test_language(self):
        ingest_tester.test_language(self, ["http://nanomine.org/language/english"])
        ingest_tester.test_language(self)

    def no_test_keywords(self):
        expected_keywords = ["Ag-Deposited Batio3",
                             "Hetero-Epitaxial Interface",
                             "Polymer Matrix",
                             "Dielectric Composites"]
        ingest_tester.test_keywords(self, expected_keywords)
        ingest_tester.test_keywords(self)

    def no_test_devices(self):
        expected_devices = ["http://nanomine.org/ns/cs9912bx",
                            "http://nanomine.org/ns/agilent-4294a-impedance-analyzer",
                            "http://nanomine.org/ns/xrd-d-max-2500-pc-rigaku-co",
                            "http://nanomine.org/ns/fei-nova-nanosem450",
                            "http://nanomine.org/ns/fei-tecnai-spirit"]
        ingest_tester.test_devices(self, expected_devices)
        ingest_tester.test_devices(self)

    def no_test_abbreviations(self):
        expected_abbreviations = ["PVDF",
                                  "AgNO3",
                                  "BaTiO3"]
        expected_abbreviations = [rdflib.Literal(v) for v in expected_abbreviations]
        ingest_tester.test_abbreviations(self, expected_abbreviations)
        ingest_tester.test_abbreviations(self)

    # def test_filler_processing(self):
    #     ingest_tester.test_filler_processing(self)

    def no_test_manufacturers(self):
        expected_manufacturers = ["Shanghai 3F Co.",
                                  "Guoyao Chemical Co. China",
                                  "Shanghai Lingfeng Chemical Co. China",
                                  "Shangdong Guoci Functional Materials Co., China"]
        expected_manufacturers = [rdflib.Literal(v) for v in expected_manufacturers]
        # ingest_tester.test_manufacturers(self, expected_manufacturers)
        ingest_tester.test_manufacturers(self)

    def no_test_complete_material(self):
        ingest_tester.test_complete_material(self)
