from . import ingest_tester
from . import template
import rdflib


class L102Test(template.IngestTestSetup):
    @classmethod
    def setUpClass(cls):
        cls.file_under_test = "L102_S3_Hu_2007"
        super().setUpClass()

    def no_test_authors(self):
        expected_authors = ["Hu, Tao",
                            "Juuti, Jari",
                            "Vilkman, Taisto",
                            "Jantunen, Heli"]
        ingest_tester.test_authors(self, expected_authors)
        ingest_tester.test_authors(self)

    def no_test_language(self):
        ingest_tester.test_language(self, ["http://nanomine.org/language/english"])
        ingest_tester.test_language(self)

    def no_test_keywords(self):
        expected_keywords = ["Composites",
                             "Dielectric Properties",
                             "Microstructure-Final",
                             "Bst-Coc"]
        ingest_tester.test_keywords(self, expected_keywords)
        ingest_tester.test_keywords(self)

    def no_test_devices(self):
        expected_devices = ["http://nanomine.org/ns/jeol-jsm-6400",
                            "http://nanomine.org/ns/agilent-e4991a",
                            "http://nanomine.org/ns/siemens-d5000"]
        ingest_tester.test_devices(self, expected_devices)
        ingest_tester.test_devices(self)

    def no_test_volume(self):
        excepted_volume = [rdflib.Literal(27)]
        ingest_tester.test_volume(self, excepted_volume)
        ingest_tester.test_volume(self)

    def no_test_matrix_chemical_names(self):
        expected_names = [rdflib.Literal("cyclo olefin copolymer")]
        ingest_tester.test_matrix_chemical_names(self, expected_names)
        ingest_tester.test_matrix_chemical_names(self)

    def no_test_matrix_trade_names(self):
        expected_names = [rdflib.Literal("Topas 8007S-04")]
        ingest_tester.test_matrix_trade_names(self, expected_names)
        ingest_tester.test_matrix_trade_names(self)

    def no_test_filler_chemical_names(self):
        expected_names = [rdflib.Literal("barium strontium titanate")]
        ingest_tester.test_filler_chemical_names(self, expected_names)
        ingest_tester.test_filler_chemical_names(self)

    def no_test_filler_trade_names(self):
        expected_names = []
        ingest_tester.test_filler_trade_names(self, expected_names)
        ingest_tester.test_filler_trade_names(self)

    def no_test_complete_material(self):
        expected_material = list()
        expected_material.append({"abbrev": rdflib.Literal("COC"),
                                  "manufac": rdflib.Literal("Ticona GmbH, Germany"),
                                  "name": rdflib.Literal("cyclo olefin copolymer"),
                                  "trade": rdflib.Literal("Topas 8007S-04")})

        expected_material.append({"abbrev": rdflib.Literal("BST"),
                                  "manufac": rdflib.Literal("Sigma–Aldrich Chemie GmbH, Germany"),
                                  "name": rdflib.Literal("barium strontium titanate"),
                                  "trade": None})

        ingest_tester.test_complete_material(self, expected_material)


    def no_test_manufacturer(self):
        ingest_tester.test_manufacturers(self)


    # def test_print_triples(self):
    #     ingest_tester.print_triples(self)
