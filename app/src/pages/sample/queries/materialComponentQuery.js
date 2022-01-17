import { commonPrefixes } from './settings'

const query = (
  route
) => `${commonPrefixes}SELECT DISTINCT ?std_name ?role ?attrType ?attrValue (GROUP_CONCAT(DISTINCT ?AttrUnit; SEPARATOR="; ") AS ?attrUnits) ?fullLabel WHERE {
  {
    ?sample a mm:PolymerNanocomposite ;
            rdfs:label ?fullLabel ;
            sio:hasComponentPart ?component .
    ?component a ?compound ;
               sio:hasRole [ a [ rdfs:label ?role ] ]  .
    ?compound rdfs:label ?std_name .
    ?component sio:hasAttribute ?attr.
    ?attr a ?attrType ;
          sio:hasValue ?attrValue .
    OPTIONAL {
      ?attr sio:hasUnit [ rdfs:label ?AttrUnit ]
    }
  } UNION
  {
    ?sample a mm:PolymerNanocomposite ;
            rdfs:label ?fullLabel ;
            sio:hasComponentPart/sio:isSurroundedBy ?compound .
    ?compound sio:hasRole [ a [ rdfs:label ?role ] ] ;
              rdfs:label ?std_name .
    ?compound sio:hasAttribute ?attr.
    ?attr a ?attrType ;
          sio:hasValue ?attrValue .
    OPTIONAL {
      ?attr sio:hasUnit [ rdfs:label ?AttrUnit ]
    }
  }
} GROUP BY ?std_name ?role ?attrType ?attrValue ?fullLabel ORDER BY ?std_name ?role ?AttrType
VALUES ?sample {<http://materialsmine.org/sample/${route}>}`

export default query
