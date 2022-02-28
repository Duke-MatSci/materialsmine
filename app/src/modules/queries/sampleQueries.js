const commonPrefixes = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX sio: <http://semanticscience.org/resource/>
PREFIX mm: <http://materialsmine.org/ns/>
PREFIX prov: <http://www.w3.org/ns/prov#>`

export default {
  header: (
    sampleId
  ) => `${commonPrefixes}SELECT DISTINCT (REPLACE(STR(?doi),"http://dx.doi.org/","") AS ?DOI) ?sample_label ?process_label WHERE {
  ?sample a mm:PolymerNanocomposite ;
          rdfs:label ?sample_label ;
          prov:wasGeneratedBy [ a ?ProcessType ] .
  ?doi a dct:BibliographicResource ;
       sio:hasPart ?sample.
  ?ProcessType rdfs:label ?process_label .
  FILTER(REGEX(STR(?ProcessType),"materialsmine"))
} VALUES ?sample {<http://materialsmine.org/sample/${sampleId}>}`,

  curatedProperties: (
    sampleId
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
    VALUES ?sample { <http://materialsmine.org/sample/${sampleId}> }`,

  sampleImages: (sampleId) => `${commonPrefixes}SELECT DISTINCT * WHERE {
    ?sample a mm:PolymerNanocomposite ;
            sio:isRepresentedBy ?image .
    ?image a sio:Image .
    FILTER(!REGEX(STR(?image),"localhost"))
    FILTER(!REGEX(STR(?image),"XMLCONV"))
    FILTER(!REGEX(STR(?image),"nanomine"))
  } VALUES ?sample { <http://materialsmine.org/sample/${sampleId}>}`,

  materialComponents: (
    sampleId
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
  VALUES ?sample {<http://materialsmine.org/sample/${sampleId}>}`,

  processingSteps: (
    sampleId
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
      VALUES ?sample { <http://materialsmine.org/sample/${sampleId}>}
    }
    BIND(IF(BOUND(?unit_label), CONCAT(?attr, ": ", ?value, " ", ?unit_label), CONCAT(?attr, ": ", ?value)) AS ?ParamDescr)
  } GROUP BY ?step ?param_label ORDER BY ?step`,

  otherSamples: (sampleId) => `${commonPrefixes}SELECT DISTINCT ?sample WHERE {
    ?doi sio:hasPart ?this, ?sample .
    ?sample a mm:PolymerNanocomposite .
    FILTER(?this != ?sample)
  } 
  VALUES ?this { <http://materialsmine.org/sample/${sampleId}>}`,

  processLabel: (sampleId) => `${commonPrefixes}
  SELECT DISTINCT (REPLACE(STR(?doi),"http://dx.doi.org/","") AS ?DOI) ?sample_label ?process_label WHERE {
    ?sample a mm:PolymerNanocomposite ;
            rdfs:label ?sample_label ;
            prov:wasGeneratedBy [ a ?ProcessType ] .
    ?doi a dct:BibliographicResource ;
         sio:hasPart ?sample.
    ?ProcessType rdfs:label ?process_label .
    FILTER(REGEX(STR(?ProcessType),"materialsmine"))
  } VALUES ?sample { <http://materialsmine.org/sample/${sampleId}>}`
}
