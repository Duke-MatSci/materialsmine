#!/bin/bash

# Run the `whyis load` command inside the container
/opt/venv/bin/whyis load -f turtle -i 'https://raw.githubusercontent.com/tetherless-world/SemanticDataDictionary/master/sdd-ontology.ttl'
# Always use the .trig file as this overwrite the existing one
# /opt/venv/bin/whyis load -f trig -i 'https://raw.githubusercontent.com/Duke-MatSci/materialsmine/develop/ontology/materialsmine.trig'
/opt/venv/bin/whyis load -f turtle -i 'https://raw.githubusercontent.com/Duke-MatSci/materialsmine/develop/ontology/materialsmine.ttl'