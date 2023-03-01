from . import ingest_tester
from . import template
import rdflib

class L300_S5_Nakane_1999(template.IngestTestSetup):
    @classmethod
    def setUpClass(cls):
        cls.file_under_test = "L300_S5_Nakane_1999"
        super().setUpClass()

    # def test_viscoelastic_measurement_mode(self):
    #     expected_properties = ["tensile"]
    #     ingest_tester.test_viscoelastic_measurement_mode(self, expected_properties)
    #     ingest_tester.test_viscoelastic_measurement_mode(self)

    def no_test_tensile_loading_profile(self):
        strain = [
            0.488947522403,
            0.206702455438,
            0.0792094406024,
            0.458310507435,
            0.160242593969,
            0.90212884315,
            0.940644788598,
            1.3802561525,
            1.22448532952,
            0.93220689301,
            1.80212313252,
            1.9786885736,
            1.79906431079,
            2.00943420192,
            2.30809720581,
            2.1881058389,
            2.54316050748,
            2.71920844731,
            2.81124282387,
            2.90484571504
        ]
        stress = [
            24.9897478167,
            10.2678907707,
            4.02476970038,
            19.158611338,
            15.5440079659,
            41.2782263019,
            32.5323892337,
            60.5980280682,
            51.9931198677,
            47.4921877784,
            79.3363291472,
            73.9835174962,
            67.1880712416,
            88.0281205131,
            99.0291856973,
            94.3884072907,
            106.063545902,
            111.225327822,
            115.638172539,
            120.767514725
        ]
        strain = [rdflib.Literal(val) for val in strain]
        stress = [rdflib.Literal(val) for val in stress]
        ingest_tester.test_tensile_loading_profile(self, strain, stress)

    def no_test_triples(self):
        ingest_tester.print_triples(self)
