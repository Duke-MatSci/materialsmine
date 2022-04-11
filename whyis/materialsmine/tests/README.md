* The autoparser currently allows for automatic testing of the following categories:
  * PNC Present
  * Authors
  * Keywords
  * DOI Number
  * Language
  * Journal Volume
  * Matrix Chemical Names
  * Matrix Chemical Trade Names
  * Filler Chemical Names
  * Filler Chemical Trade Names
  * Devices
  * Temperatures
  * Material Properties Combined (ensuring properties are properly associated)

* This list will be expanded as new automated tests are developed

* The autoparser and all actual testing code are in `ingest_tester.py`

# An Intro to Unit Tests for Nanomine
* Tristan Protzman
* protzt@rpi.edu

Hopefully this should outline the basics of expanding the unit tests for the xml ingest SELTr script use by the Nanomine project.

### Identifying tests
* To start, I had been printing all the triples generated and seeing what was in there, and writing tests to verify that those work more broadly than in a specific file.
* Now that a lot of the backlog has been worked through, I have been addressing topics as Neha or I added them.
* Effective tests will target a specific property that has a definite value to be compared against.
    * i.e. the mass of a sample or the chemical abbreviation.

### Writing tests
* All reusable test code (queries, comparison, general processing) should go in `ingest_tester.py`.
    * This file is then imported by files which test specific files.
    * The general pattern for this file is query the graph, process the results, and compare to expected values.
    * Determining the query has mostly been done by examining the ingest SETLr script to determine what the expected structure is, and verifying with those more knowledgeable in the subject than I when questions arise.
    * Processing the data usually is just a list comprehension to pull desired parameter out of the returned results
    * Finally, using `unittest.assertEqual()` (or `unittest.assertCountEqual()` for lists of data) to verify that the query matches the expected result.
* Then, in a python file per xml file we wish to test, we fill in the expected results and call the testing function.
    * `auto_test_template.py` can be used as a template, though it should not be modified
    * Extend `template.IngestTestSetup` to get all the functionality needed.
        * Can instead extend `template.IngestTestTests` to get an automated test suite, 
    * In most cases `rdflib` will need to be imported as well to instantiate the expected data as a `rdflib.Literal()`.
    * Each test should be its own function within the class for more granular pass/fail results.

### Automated testing
* Things have kinda fallen off here, but the infrastructure is in place to run automatic testing on large numbers of files.  
    * At the top of `ingest_tester.py` is the `autoparse` function which can read through the xml file to pull information from it, in effect loading the expected data automatically.
    * The tests can then look for this data to automatically run tests.
    * Tests which we want to be ran automatically should be placed in the `IngestTestTests` class in `template.py`
* These tests can be then executed automatically with the `auto_tester.py` script, which can be supplied with a number of files to test and a `--scramble` parameter to randomize which files are tested.
* I believe this functionally works, though I admit it's been a while since I've worked on it.
* The tests can also be run through whyis using `python manage.py test --apponly`
