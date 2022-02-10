import { commonPrefixes } from './settings'

const query = (
  route
) => `${commonPrefixes}SELECT DISTINCT ?AttrType ?value (GROUP_CONCAT(DISTINCT ?unit; SEPARATOR="; ") AS ?Units) WHERE {
  ?sample a mm:PolymerNanocomposite ;
          sio:hasAttribute ?attr .
  FILTER NOT EXISTS { ?attr sio:inRelationTo ?otherAttr }
  ?attr a ?AttrType ; 
        sio:hasValue ?value .
  OPTIONAL {
    ?attr sio:hasUnit [ rdfs:label ?unit ]
  }
} GROUP BY ?attr ?AttrType ?value 
VALUES ?sample { <http://materialsmine.org/sample/${route}> }`

export default query
