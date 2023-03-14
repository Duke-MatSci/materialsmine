from whyis import autonomic
from rdflib import URIRef, BNode, RDF, Literal, Namespace
from slugify import slugify
from whyis import nanopub
from .surface_energy_terms import surface_energy_terms, pprint

from whyis.namespace import sioc_types, sioc, sio, dc, prov, whyis

mm = Namespace("http://materialsmine.org/ns/")

oum = Namespace('http://www.ontology-of-units-of-measure.org/resource/om-2/')

class SurfaceEnergyGen(autonomic.GlobalChangeService):
    activity_class = whyis.SurfaceEnergyGen

    def getInputClass(self):
        return mm.PolymerNanocomposite

    def getOutputClass(self):
        return mm.SurfaceEnergyComputedMaterial

    def get_query(self):
        self.matches = 0
        return QUERY

    def process(self, i, o):
        # print("running proccess!!!!!!!!!!!!!!!")
        # print(f"i: {i}")
        # pprint(i)
        # matches = 0
        # for vf, pst, matrix, FillerPart, MatrixPart in i.graph.query(filler_query, initNs={"sample":i.identifier}):
        for vf, pst, matrix, FillerPart, MatrixPart in self.app.db.query(filler_query, initBindings={"sample":i.identifier}):
            print(f'vf: {vf}')
            print(f'pst: {pst}')
            print(f'matrix: {matrix}')
            print(f'FillerPart: {FillerPart}')
            print(f'MatrixPart: {MatrixPart}')

            # Do the thing!!
            # Returns nested dict with 4 "Raw Terms" and 3 "Work Terms"
            d = surface_energy_terms(matrix, pst)
            # end early if no matches found
            if d is False:
                print("No Match Detected")
                return
            self.matches += 1
            print("Match Found")
            print("d:")
            pprint(d)
            units = {
                "WorkOfAdhesion": oum.joulePerSquareMetre,
                "WorkOfSpreading": oum.joulePerSquareMetre,
                "DegreeOfWetting": oum.Ratio
            }

            # Add Work Terms
            for key, value in d["Work Terms"].items():
                uri_property = "http://materialsmine.org/ns/" + key
                uri_unit = units[key]
                property = o.graph.resource(BNode())
                property.add(RDF.type, URIRef(uri_property))
                property.add(sio.hasValue, Literal(value)) # Whatever the actual value is)
                property.add(sio.hasUnit, uri_unit)
                o.add(sio.hasAttribute, property)

            # Add Raw Terms
            # Add Filler Energies
            filler_resource = o.graph.resource(FillerPart)

            # Dispersive
            FDSE = d["Raw Terms"]["filler dispersive surface energy"]
            property = o.graph.resource(BNode())
            property.add(RDF.type, mm.DispersiveSurfaceEnergy)
            property.add(sio.hasValue, Literal(FDSE)) # Whatever the actual value is)
            property.add(sio.hasUnit, oum.joulePerSquareMetre)
            filler_resource.add(sio.hasAttribute, property)

            # Polar
            FPSE = d["Raw Terms"]["filler polar surface energy"]
            property = o.graph.resource(BNode())
            property.add(RDF.type, mm.PolarSurfaceEnergy)
            property.add(sio.hasValue, Literal(FPSE)) # Whatever the actual value is)
            property.add(sio.hasUnit, oum.joulePerSquareMetre)
            filler_resource.add(sio.hasAttribute, property)

            # Add Matrix Energies
            matrix_resource = o.graph.resource(MatrixPart)

            # Dispersive
            MDSE = d["Raw Terms"]["matrix dispersive surface energy"]
            property = o.graph.resource(BNode())
            property.add(RDF.type, mm.DispersiveSurfaceEnergy)
            property.add(sio.hasValue, Literal(MDSE)) # Whatever the actual value is)
            property.add(sio.hasUnit, oum.joulePerSquareMetre)
            matrix_resource.add(sio.hasAttribute, property)

            # Polar
            MPSE = d["Raw Terms"]["matrix polar surface energy"]
            property = o.graph.resource(BNode())
            property.add(RDF.type, mm.PolarSurfaceEnergy)
            property.add(sio.hasValue, Literal(MPSE)) # Whatever the actual value is)
            property.add(sio.hasUnit, oum.joulePerSquareMetre)
            matrix_resource.add(sio.hasAttribute, property)


            # for key, value in d["Raw Terms"].items():
            #     property = o.graph.resource(BNode())
            #     property.add(RDF.type, URIRef("URI_OF_THE_PROPERTY_CLASS")
            #     property.add(sio.hasValue, Literal(value)) # Whatever the actual value is)
            #     property.add(sio.hasUnit, URIRef("URI_OF_THE_UOM")
            #     o.add(sio.hasAttribute, property)
        # print("Run Complete")
        print(f'Total Matches: {self.matches}')


filler_query = '''
PREFIX nm: <http://materialsmine.org/ns/>
PREFIX sio: <http://semanticscience.org/resource/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT DISTINCT ?VolFrac (LCASE(?SurfaceTreatmentType) AS ?PST) (LCASE(?MatrixType) AS ?matrix) ?FillerPart ?MatrixPart WHERE {
  ?sample a nm:PolymerNanocomposite;
          sio:hasComponentPart ?FillerPart ,
                               ?MatrixPart .
  ?FillerPart sio:hasRole [ a nm:Filler ] ;
              a [ rdfs:label "Silicon dioxide" ];
              sio:hasAttribute [a nm:VolumeFraction; sio:hasValue ?VolFrac] .

  ?MatrixPart sio:hasRole [ a nm:Matrix ] ;
              a [ rdfs:label ?MatrixType ] .

  FILTER (lcase(?MatrixType) IN ('polypropylene', 'polybenzimidazole', 'poly(vinyl alcohol)', 'nylon 6', 'polystyrene', 'pvb', 'epoxy', 'p2vp', 'poly(lactic acid)', 'polyurethane', 'poly(ethylene terephthalate)', 'poly(methyl methacrylate)', 'poly(fluorinated styrene-acrylate)', 'triacetylcellulose', 'no surface treatment', 'octyldimethylmethoxysilane', 'chloropropyldimethylethoxysilane', 'aminopropyldimethylethoxysilane', 'poly(ethyl methacrylate)', 'pgma', '3-methacryloxypropyldimethylchlorosilane', 'octyltrimethoxysilane', 'bis(trimethylsilyl)amine', 'dimethyldichlorosilane', 'vinyltriethoxysilane', 'poly(dl-lactic acid)', 'polycarbonate', 'pvvm', 'plla', 'poly(propylene glycerol)', 'poly(vinyl acetate)', '3‐aminopropyltriethoxysilane', 'γ‐glycidyloxypropyltrimethoxy silane', 'γ‐methylacryloxypropl trimethoxy siliane')).
  OPTIONAL {
    ?FillerPart sio:isSurroundedBy [ sio:hasRole [ a nm:SurfaceTreatment ] ;
                                     a [ rdfs:label ?SurfaceTreatmentType ] ] .
  }
}
'''

QUERY = '''
PREFIX nm: <http://materialsmine.org/ns/>
PREFIX sio: <http://semanticscience.org/resource/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT DISTINCT ?sample WHERE {
  ?sample a nm:PolymerNanocomposite.
  minus { ?sample a nm:SurfaceEnergyComputedMaterial }
  ?sample sio:hasComponentPart ?FillerPart ,
                               ?MatrixPart .
  ?FillerPart sio:hasRole [ a nm:Filler ] ;
              a [ rdfs:label "Silicon dioxide" ] .
  ?MatrixPart sio:hasRole [ a nm:Matrix ] ;
              a [ rdfs:label ?MatrixType ] .
  FILTER (lcase(?MatrixType) IN ('polypropylene', 'polybenzimidazole', 'poly(vinyl alcohol)', 'nylon 6', 'polystyrene', 'pvb', 'epoxy', 'p2vp', 'poly(lactic acid)', 'polyurethane', 'poly(ethylene terephthalate)', 'poly(methyl methacrylate)', 'poly(fluorinated styrene-acrylate)', 'triacetylcellulose', 'no surface treatment', 'octyldimethylmethoxysilane', 'chloropropyldimethylethoxysilane', 'aminopropyldimethylethoxysilane', 'poly(ethyl methacrylate)', 'pgma', '3-methacryloxypropyldimethylchlorosilane', 'octyltrimethoxysilane', 'bis(trimethylsilyl)amine', 'dimethyldichlorosilane', 'vinyltriethoxysilane', 'poly(dl-lactic acid)', 'polycarbonate', 'pvvm', 'plla', 'poly(propylene glycerol)', 'poly(vinyl acetate)', '3‐aminopropyltriethoxysilane', 'γ‐glycidyloxypropyltrimethoxy silane', 'γ‐methylacryloxypropl trimethoxy siliane')).
}
'''
