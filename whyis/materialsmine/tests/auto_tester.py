import os
import subprocess
import sys
import time
import random
from SPARQLWrapper import SPARQLWrapper, JSON

def main(argv):
    run_all = True
    to_run = 0
    if len(argv) >= 2:
        run_all = False
        to_run = int(argv[1])
    endpoint = SPARQLWrapper("https://materialsmine.org/wi/sparql")
    endpoint.setQuery(
        '''
        SELECT DISTINCT ?article WHERE {
            ?doi a <http://nanomine.org/ns/ResearchArticle> .
            ?doi <http://semanticscience.org/resource/hasPart> ?article .
        }
        '''
    )
    endpoint.setReturnFormat(JSON)
    results = endpoint.query().convert()
    files = [uri["article"]["value"].replace("http://nanomine.org/sample/", "").replace("-", "_").title()
             for uri in results["results"]["bindings"]]


    if os.path.exists("/apps/nanomine-graph/tests/output.txt"):
        os.remove("/apps/nanomine-graph/tests/output.txt")

    tests_ran = 0
    tests_failed = 0
    if "--scramble" in argv:
        random.shuffle(files)
    for uri in files:
        sys.stdout.write(uri + "...")
        tests_ran += 1
        test_text = str()
        with open("/apps/nanomine-graph/tests/auto_tester.py", "r") as f:
            test_text = f.read()
        test_text = test_text.replace("<FILENAME HERE>", uri)
        with open("/apps/nanomine-graph/tests/test_auto_active.py", "w") as f:
            f.write(test_text)
        std_err = subprocess.run(["/apps/whyis/venv/bin/python", "manage.py", "test", "--test=test_auto_active"], stdout=subprocess.DEVNULL, stderr=subprocess.PIPE).stderr.decode("utf-8")
        if "FAILED" in std_err or "ERROR" in std_err:   # We want to catch any tests that fail or error to investigate them
            print(" FAIL")
            tests_failed += 1
            with open("/apps/nanomine-graph/tests/output.txt", "a") as outfile:
                outfile.write("*" * 20 + uri + "*" * 20)
                # outfile.write("\nSTDOUT\n")
                # outfile.write(std_out)
                outfile.write("\nSTDERR\n")
                outfile.write(std_err)    
                outfile.write("\n" + "*" * 45)
                outfile.write("\n\n\n")
        else:
            print(" PASS")
        os.remove("/apps/nanomine-graph/tests/test_auto_active.py")
        if not run_all and tests_ran >= to_run:
            break
    return tests_ran, tests_failed


if __name__ == "__main__":
    start = time.time()
    tests_ran, tests_failed = main(sys.argv)
    end = time.time()
    print("{}/{} tests passed in {:.1f} seconds".format(tests_ran - tests_failed, tests_ran, end - start))