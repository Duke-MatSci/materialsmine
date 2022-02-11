import { commonPrefixes } from './settings'

const query = (
  route
) => `${commonPrefixes}SELECT ?step ?param_label (GROUP_CONCAT(?ParamDescr; SEPARATOR="; ") AS ?Descr)
WHERE {
  {
    SELECT ?step ?param_label (MIN(?AttrLabel) AS ?attr) ?value (MIN(?unit) AS ?unit_label) WHERE {
      ?sample a mm:PolymerNanocomposite ;
              prov:wasGeneratedBy [ a ?ProcessType ;
                                    sio:hasPart ?step ] .
      OPTIONAL {
        ?step sio:hasParameter ?param .
        ?param sio:hasAttribute [ a ?AttrType ; sio:hasValue ?value ] .
        ?AttrType rdfs:label ?AttrLabel .
      }
      OPTIONAL {
        ?step sio:hasParameter ?param .
        ?param sio:hasAttribute [ a ?AttrType ; sio:hasValue ?value ; sio:hasUnit [ rdfs:label ?unit ] ] .
        ?AttrType rdfs:label ?AttrLabel .
      }
      ?step a [ rdfs:label ?step_type ] .
      ?param a ?param_type .
      ?param_type rdfs:label ?param_label .
      FILTER(REGEX(STR(?ProcessType),"materialsmine"))
      FILTER(REGEX(STR(?param_type),"materialsmine"))
    } GROUP BY ?step ?param_label ?value ORDER BY ?attr
    VALUES ?sample { <http://materialsmine.org/sample/${route}>}
  }
  BIND(IF(BOUND(?unit_label), CONCAT(?attr, ": ", ?value, " ", ?unit_label), CONCAT(?attr, ": ", ?value)) AS ?ParamDescr)
} GROUP BY ?step ?param_label ORDER BY ?step`

export default query
