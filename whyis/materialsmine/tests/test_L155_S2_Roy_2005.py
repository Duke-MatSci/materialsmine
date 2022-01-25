from . import ingest_tester
from . import template
import rdflib

file_under_test = "L155_S2_Roy_2005"

class IngestTestRunner(template.IngestTestSetup):
    first_run = bool()
    @classmethod
    def setUpClass(cls):
        cls.file_under_test = file_under_test
        super().setUpClass()

    def no_test_triples(self):
         ingest_tester.print_triples(self)

    def no_test_dielectric_real_permittivity(self):
        frequency = [
            0.002078949,
            0.005239995,
            0.013207416,
            0.033289313,
            0.082305244,
            0.203493333,
            0.512905286,
            1.292778627,
            3.258450684,
            7.902591204,
            20.30583336,
            50.20459806,
            126.540773,
            318.9462293,
            773.5276395,
            1949.677704,
            4914.165902,
            12386.16334,
            30623.82819,
            78688.41195,
            190839.8845,
            481012.2468,
        ]

        real_permittivity = [
            3.21,
            2.88,
            2.595,
            2.385,
            2.2425,
            2.175,
            2.1,
            2.055,
            2.025,
            2.01,
            1.995,
            1.965,
            1.95,
            1.95,
            1.95,
            1.935,
            1.9275,
            1.935,
            1.9275,
            1.92,
            1.92,
            1.905,
        ]
        frequency = [rdflib.Literal(f) for f in frequency]
        real_permittivity = [rdflib.Literal(p) for p in real_permittivity]

        descriptions = {}
        descriptions["measurement_description"] = rdflib.Literal("Measured at 25 Celsius")
        descriptions["x_description"] = rdflib.Literal("Frequency (Hz)")
        descriptions["y_description"] = rdflib.Literal("Real Part of Dielectric Permittivity")

        ingest_tester.test_dielectric_real_permittivity(self, frequency, real_permittivity, descriptions)

    def no_test_dielectric_loss_tangent(self):
        return
        frequency = [
            0.002132876,
            0.005323618,
            0.013287653,
            0.033643142,
            0.08278107,
            0.209594224,
            0.523143327,
            1.305756117,
            3.25914324,
            8.134761557,
            20.30421516,
            50.67894742,
            126.4937202,
            315.7259981,
            788.0462816,
            1966.949018,
            4909.468555,
            12430.33287,
            30585.61668,
            77440.03084,
            190546.0718,
            489390.0918,
        ]

        tan_delta = [
            0.189265537,
            0.152777778,
            0.12405838,
            0.093691149,
            0.066148776,
            0.045433145,
            0.032015066,
            0.02306968,
            0.016949153,
            0.013182674,
            0.010122411,
            0.007768362,
            0.006355932,
            0.005178908,
            0.004237288,
            0.003766478,
            0.003295669,
            0.003060264,
            0.002589454,
            0.002589454,
            0.002354049,
            0.002354049,
        ]

        frequency = [rdflib.Literal(f) for f in frequency]
        tan_delta = [rdflib.Literal(t) for t in tan_delta]

        descriptions = {}
        descriptions["measurement_description"] = rdflib.Literal("Measured at 25 Celsius")
        descriptions["x_description"] = rdflib.Literal("Frequency (Hz)")
        descriptions["y_description"] = rdflib.Literal("tan delta")

        ingest_tester.test_dielectric_loss_tangent(self, frequency, tan_delta, descriptions)

    def no_test_weibull_plot(self):
        breakdown_strength = [
            134.3096058,
            135.4974638,
            136.6958274,
            137.9047896,
            145.3864394,
            150.5983687,
            168.8625957,
            208.5987317,
            271.6654549,
            281.4043353,
            460.765468,
            554.3522963,
            559.2550864,
            940.2240538,
        ]

        failure_probability = [
            12.5086297,
            18.69779897,
            24.93299398,
            31.18775889,
            37.44027712,
            43.73113085,
            49.92556641,
            56.22166161,
            62.45004225,
            68.73755053,
            74.97001936,
            81.0239571,
            87.5667591,
            93.3498204,
        ]

        breakdown_strength = [rdflib.Literal(b) for b in breakdown_strength]
        failure_probability = [rdflib.Literal(f) for f in failure_probability]

        descriptions = {}
        descriptions["measurement_description"] = rdflib.Literal("Measured at 25 Celsius")
        descriptions["x_description"] = rdflib.Literal("Frequency (Hz)")
        descriptions["y_description"] = rdflib.Literal("tan delta")

        ingest_tester.test_weibull_plot(self, breakdown_strength, failure_probability, {})
