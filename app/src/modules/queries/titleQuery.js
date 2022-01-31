import { commonPrefixes } from './settings'

const query = (route) => `${commonPrefixes}
SELECT DISTINCT (REPLACE(STR(?doi),"http://dx.doi.org/","") AS ?DOI) ?sample_label ?process_label WHERE {
  ?sample a mm:PolymerNanocomposite ;
          rdfs:label ?sample_label ;
          prov:wasGeneratedBy [ a ?ProcessType ] .
  ?doi a dct:BibliographicResource ;
       sio:hasPart ?sample.
  ?ProcessType rdfs:label ?process_label .
  FILTER(REGEX(STR(?ProcessType),"materialsmine"))
} VALUES ?sample { <http://materialsmine.org/sample/${route}>}`

export default query
