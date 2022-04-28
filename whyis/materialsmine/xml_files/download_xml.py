import os
import logging
import json
import requests
from SPARQLWrapper import JSON, SPARQLWrapper


def download():
    logging.basicConfig(level=logging.INFO)
    endpoint = SPARQLWrapper("https://materialsmine.org/wi/sparql")
    endpoint.setQuery(
        """
        SELECT DISTINCT ?article WHERE {
            ?doi a <http://nanomine.org/ns/ResearchArticle> .
            ?doi <http://semanticscience.org/resource/hasPart> ?article .
        }
        """
    )
    endpoint.setReturnFormat(JSON)
    results = endpoint.query().convert()
    uris = [r["article"]["value"].replace("http://nanomine.org/sample/", "").replace("-", "_").title()
            for r in results["results"]["bindings"]]
    files = [uri + ".xml" for uri in uris]
    for f in files:
        if (os.path.exists(f)):
            logging.info("File " + f + " already exists, skipping")
        else:
            logging.debug("Downloading file " + str(f))
            r = requests.get("http://nanomine.org/nmr/xml/" + f)
            try:
                j = json.loads(r.text)
                xml_str = j["data"][0]["xml_str"]
                with open(f, "w") as outfile:
                    outfile.write(xml_str)
            except Exception as e:
                logging.error("Something went wrong with file " + f)
                logging.error(e)


if __name__ == "__main__":
    download()
