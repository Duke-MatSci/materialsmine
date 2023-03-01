# Note: Do not edit this, it is copied and used as a template for batch testing
# Add any new tests to test_template.IngestTestTests instead, as this will then run
# them while doing batch testing.  If you wish to test a specific file, this serves
# as a starting point which can be worked from

from . import ingest_tester
from . import template

file_under_test = "<FILENAME HERE>"

class IngestTestRunner(test_template.IngestTestTests):
    first_run = bool()
    @classmethod
    def setUpClass(cls):
        cls.file_under_test = file_under_test
        super().setUpClass()
