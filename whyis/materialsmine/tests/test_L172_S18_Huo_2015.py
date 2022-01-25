from . import ingest_tester
from . import template

class L172Test(template.IngestTestTests):
    @classmethod
    def setUpClass(cls):
        cls.file_under_test = "L172_S18_Huo_2015"
        super().setUpClass()
