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
  VALUES ?sample {<http://materialsmine.org/sample/${sampleId}>}
  ?sample a mm:PolymerNanocomposite ;
          rdfs:label ?sample_label ;
          prov:wasGeneratedBy [ a ?ProcessType ] .
  ?doi a dct:BibliographicResource ;
       sio:hasPart ?sample.
  ?ProcessType rdfs:label ?process_label .
  FILTER(REGEX(STR(?ProcessType),"materialsmine"))
}`,

  curatedProperties: (
    sampleId
  ) => `${commonPrefixes}SELECT DISTINCT ?AttrType ?value (GROUP_CONCAT(DISTINCT ?unit; SEPARATOR="; ") AS ?Units) WHERE {
    VALUES ?sample { <http://materialsmine.org/sample/${sampleId}> }
      ?sample a mm:PolymerNanocomposite ;
              sio:hasAttribute ?attr .
      FILTER NOT EXISTS { ?attr sio:inRelationTo ?otherAttr }
      ?attr a ?AttrType ; 
            sio:hasValue ?value .
      OPTIONAL {
        ?attr sio:hasUnit [ rdfs:label ?unit ]
      }
    } GROUP BY ?attr ?AttrType ?value `,

  sampleImages: (sampleId) => `${commonPrefixes}SELECT DISTINCT * WHERE {
    VALUES ?sample { <http://materialsmine.org/sample/${sampleId}>}
    ?sample a mm:PolymerNanocomposite ;
            sio:isRepresentedBy ?image .
    ?image a sio:Image .
    FILTER(!REGEX(STR(?image),"localhost"))
    FILTER(!REGEX(STR(?image),"XMLCONV"))
    FILTER(!REGEX(STR(?image),"nanomine"))
  }`,

  materialComponents: (
    sampleId
  ) => `${commonPrefixes}SELECT DISTINCT ?std_name ?role ?attrType ?attrValue (GROUP_CONCAT(DISTINCT ?AttrUnit; SEPARATOR="; ") AS ?attrUnits) ?fullLabel WHERE {
    VALUES ?sample {<http://materialsmine.org/sample/${sampleId}>}
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
  } GROUP BY ?std_name ?role ?attrType ?attrValue ?fullLabel ORDER BY ?std_name ?role ?AttrType`,

  processingSteps: (
    sampleId
  ) => `${commonPrefixes}SELECT ?step ?param_label (GROUP_CONCAT(?ParamDescr; SEPARATOR="; ") AS ?Descr)
  WHERE {
    {
      SELECT ?step ?param_label (MIN(?AttrLabel) AS ?attr) ?value (MIN(?unit) AS ?unit_label) WHERE {
        VALUES ?sample {  <http://materialsmine.org/sample/${sampleId}> }
        ?sample a mm:PolymerNanocomposite ;
                prov:wasGeneratedBy [ a ?ProcessType ;
                                      sio:hasPart ?step ] .
        ?step a [ rdfs:label ?step_type ] .
        OPTIONAL {
          ?step sio:hasParameter ?param .
          ?param sio:hasAttribute ?param_attr .
          ?param_attr a [rdfs:label ?AttrLabel] ; sio:hasValue ?value .
          OPTIONAL {
          	?param_attr sio:hasUnit [ rdfs:label ?unit ] .
          }
          ?param a ?param_type .
          ?param_type rdfs:label ?param_label .
        }
        FILTER(REGEX(STR(?ProcessType),"materialsmine"))
        FILTER(REGEX(STR(?param_type),"materialsmine"))
      } GROUP BY ?step ?param_label ?value ORDER BY ?attr
    }
    BIND(IF(BOUND(?unit_label), CONCAT(?attr, ": ", ?value, " ", ?unit_label), CONCAT(?attr, ": ", ?value)) AS ?ParamDescr)
  } GROUP BY ?step ?param_label ORDER BY ?step`,

  otherSamples: (sampleId) => `${commonPrefixes}SELECT DISTINCT ?sample WHERE {
    VALUES ?this { <http://materialsmine.org/sample/${sampleId}>}
    ?doi sio:hasPart ?this, ?sample .
    ?sample a mm:PolymerNanocomposite .
    FILTER(?this != ?sample)
  } `,

  processLabel: (sampleId) => `${commonPrefixes}
  SELECT DISTINCT (REPLACE(STR(?doi),"http://dx.doi.org/","") AS ?DOI) ?sample_label ?process_label WHERE {
    VALUES ?sample { <http://materialsmine.org/sample/${sampleId}>}
    ?sample a mm:PolymerNanocomposite ;
            rdfs:label ?sample_label ;
            prov:wasGeneratedBy [ a ?ProcessType ] .
    ?doi a dct:BibliographicResource ;
         sio:hasPart ?sample.
    ?ProcessType rdfs:label ?process_label .
    FILTER(REGEX(STR(?ProcessType),"materialsmine"))
  }`,

  facetFilterMaterial: () => `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
  PREFIX nm: <http://materialsmine.org/ns/>
  PREFIX sio: <http://semanticscience.org/resource/>
  SELECT DISTINCT ?Attribute (MIN(?label) AS ?Label) WHERE {
    ?sample a nm:PolymerNanocomposite ;
            sio:hasAttribute ?attr .
    ?attr a ?Attribute ;
          sio:hasValue ?value .
    ?Attribute rdfs:label ?label .
    FILTER(REGEX(STR(?Attribute),"materialsmine"))
  } GROUP BY ?Attribute`,

  getSearchFacetFilterMaterialCount: (label) => `PREFIX sio: <http://semanticscience.org/resource/>
  PREFIX nm: <http://materialsmine.org/ns/>
  PREFIX dct: <http://purl.org/dc/terms/>
  SELECT DISTINCT (COUNT(DISTINCT ?sample) AS ?SampleCount) (COUNT(DISTINCT ?doi) AS ?DOICount) WHERE {
    ?doi a dct:BibliographicResource ;
         sio:hasPart ?sample .
    ?sample a nm:PolymerNanocomposite ;
            sio:hasAttribute [ a nm:${label} ]
  }`,

  getSearchFacetFilterMaterialDefinition: (label) => `PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
  PREFIX nm: <http://materialsmine.org/ns/>
  SELECT DISTINCT * WHERE {
    nm:${label} skos:definition ?definition
  }`,

  getSearchFacetFilterMaterial: (label) => `PREFIX sio: <http://semanticscience.org/resource/>
  PREFIX nm: <http://materialsmine.org/ns/>
  PREFIX dct: <http://purl.org/dc/terms/>
  PREFIX bibo: <http://purl.org/ontology/bibo/>
  PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  PREFIX foaf: <http://xmlns.com/foaf/0.1/>
  SELECT DISTINCT (MIN(?AuthorLabel) AS ?Authors) ?Title (REPLACE(STR(?doi),"http://dx.doi.org/","") AS ?DOI) ?Journal WHERE {
    ?doi a dct:BibliographicResource ;
         dct:created ?Year ;
         dct:title ?Title ;
         dct:isPartOf [ dct:title ?Journal ] ;
         sio:hasPart ?sample ;
         bibo:authorList/rdf:rest* [ rdf:first [ foaf:name ?firstAuthor ] ; rdf:rest rdf:nil ] .
    ?sample a nm:PolymerNanocomposite ;
            sio:hasAttribute [ a nm:${label} ]
    BIND(CONCAT("(", STR(?Year), ") ", STR(?firstAuthor), " et al.") AS ?AuthorLabel )
  } GROUP BY ?doi ?Title ?Journal`
}
