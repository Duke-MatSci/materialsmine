# Chemical Property Database Ingestion

## RDF Structure
Pure pseudocode:
```
chemical
    id $ID;
    stdname $STD_NAME;
    abbreviations $ABBREV_1, $ABBREV_2, ..., $ABBREV_N;
    density $DENSITY;
    tradenames $TRADENAME_1, $TRADENAME_2, ..., $TRADENAME_N;
    synonyms $SYNONYM_1, $SYNONYM_2, ..., $SYNONYM_N;
```

Applying our ontology:
```
PREFIX sio: <http://semanticscience.org/resource/>
PREFIX nanomine: <http://nanomine.org/ns/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

sio:ChemicalSubstance
    nanomine:CU_Formula $ID;
    rdfs:label $STD_NAME;
    nanomine:Abbreviation $ABBREV_1, $ABBREV_2, ..., $ABBREV_N;
    sio:Density $DENSITY
    nanomine:TradeName $TRADENAME_1, $TRADENAME_2, ..., $TRADENAME_N;
    sio:Synonym $SYNONYM_1, $SYNONYM_2, ..., $SYNONYM_N;
    
```

So using this pattern, we have to write an SETLr ingest script to import the data from the JSON files into the knowledge graph.
