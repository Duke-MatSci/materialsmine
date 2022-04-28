import rdflib

from . import ingest_tester, template

file_under_test = "L199_S1_Duncan_2010"

# TODO Add test for shear loading profile
class Test_L199_S1_Duncan_2010(template.IngestTestSetup):
    @classmethod
    def setUpClass(cls):
        cls.file_under_test = file_under_test
        super().setUpClass()

    def no_test_triples(self):
        ingest_tester.print_triples(self)

    def no_test_shear_loading_profile_1(self):
        descriptions = {}
        descriptions["measurement_description"] = rdflib.Literal("Number of MWNT within grip region dissolved in THF")
        descriptions["x_description"] = rdflib.Literal("Aspect ratio (L/d)")
        descriptions["y_description"] = rdflib.Literal("Number of MWNT within grip region dissolved in THF")

        types = {}
        types["y_type"] = "<http://nanomine.org/ns/NumberOfMwntWithinGripRegionDissolvedInThf>"
        types["x_type"] = "<http://nanomine.org/ns/AspectRatioLD>"

        aspect_ratio = [
            "0-199",
            "200-399",
            "400-599",
            "600-799",
            "800-999",
            "1000-1199",
            "1200-1399",
            "1400-1599",
            "1600-1799",
            "1800-1999",
            ">2000",
        ]

        number = [
            0.0,
            0.0,
            0.0,
            0.0,
            18.4393465415,
            17.0142509559,
            10.4362182829,
            16.7014250956,
            11.9742787626,
            22.540841154,
            21.8456725756,
        ]

        aspect_ratio = [rdflib.Literal(a, datatype=rdflib.XSD.double) for a in aspect_ratio]
        number = [rdflib.Literal(n) for n in number]
        ingest_tester.test_shear_loading_profile(self, aspect_ratio, number, descriptions, types)

    def no_test_shear_loading_profile_2(self):
        descriptions = {}
        descriptions["measurement_description"] = rdflib.Literal("Number of MWNT along the fracture edge dissolved in THF")
        descriptions["x_description"] = rdflib.Literal("Aspect ratio (L/d)")
        descriptions["y_description"] = rdflib.Literal("Number of MWNT along the fracture edge dissolved in THF")

        types = {}
        types["y_type"] = "<http://nanomine.org/ns/NumberOfMwntAlongTheFractureEdgeDissolvedInThf>"
        types["x_type"] = "<http://nanomine.org/ns/AspectRatioLD>"

        aspect_ratio = [
            "0-49.99",
            "50-99.99",
            "100-149.99",
            "150-199.99",
            "200-249.99",
            "250-299.99",
            "300-349.99",
            "350-399.99",
            ">400",
        ]

        number = [
            0.0,
            0.0,
            3.09094256259,
            0.0,
            7.79270986745,
            13.9304123711,
            34.486377025,
            43.1148748159,
            11.1800441826,
        ]

        aspect_ratio = [rdflib.Literal(a, datatype=rdflib.XSD.double) for a in aspect_ratio]
        number = [rdflib.Literal(n) for n in number]
        ingest_tester.test_shear_loading_profile(self, aspect_ratio, number, descriptions, types)

    def no_test_shear_loading_profile_3(self):
        descriptions = {}
        descriptions["measurement_description"] = rdflib.Literal("Number of MWNT along the fracture for ARNT/PC")
        descriptions["x_description"] = rdflib.Literal("Aspect ratio (L/d)")
        descriptions["y_description"] = rdflib.Literal("Number of MWNT along the fracture for ARNT/PC")

        types = {}
        types["y_type"] = "<http://nanomine.org/ns/NumberOfMwntAlongTheFractureForArntPc>"
        types["x_type"] = "<http://nanomine.org/ns/AspectRatioLD>"

        aspect_ratio = [
            "0-16",
            "16-31",
            "32-48",
            "49-64",
            "65-80",
            "81-96",
            ">97",
        ]

        number = [
            0.0,
            8.95470779757,
            16.0864952961,
            29.1779569873,
            27.8728191726,
            14.8469887788,
            23.6376183327,
        ]

        aspect_ratio = [rdflib.Literal(a, datatype=rdflib.XSD.double) for a in aspect_ratio]
        number = [rdflib.Literal(n) for n in number]
        ingest_tester.test_shear_loading_profile(self, aspect_ratio, number, descriptions, types)
