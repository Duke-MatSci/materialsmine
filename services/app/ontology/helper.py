import os
from typing import Tuple, Dict, List
from collections import defaultdict
from rdflib import Graph, URIRef, RDFS, OWL, RDF, BNode, SKOS

OWL_THING = URIRef("http://www.w3.org/2002/07/owl#Thing")

# Function to extract prefix for URIs
def extract_prefix(graph, uri):
    try:
        # Extract the namespace from the URI
        namespace_info = graph.namespace_manager.compute_qname(uri)
        # Combine the prefix with the local name
        return f"{namespace_info[0]}:{namespace_info[2]}"
    except Exception as e:
        raise ValueError
        return None

# Function to extract ontology details (format, description, version)
def extract_ontology_info(graph):
    format_info = None
    description = None
    version = None

    for s, p, o in graph.triples((None, RDF.type, OWL.Ontology)):
        format_info = "OWL"
        description = str(graph.value(s, RDFS.comment)) if graph.value(s, RDFS.comment) else None
        version = str(graph.value(s, OWL.versionIRI)) if graph.value(s, OWL.versionIRI) else None

    return format_info, description, version

# Recursive function to sort subclasses
def sort_subclasses(classes):
    for class_data in classes.values():
        if class_data["subClasses"]:
            class_data["subClasses"] = sorted(
                class_data["subClasses"],
                key=lambda item: item.get("Preferred Name")
            )
            sort_subclasses({sub["ID"]: sub for sub in class_data["subClasses"]})

def extract_preferred_name(iri):
    return iri.split("#")[-1].split("/")[-1]

def initialize_statistics() -> Dict[str, int]:
    return {
        "classes": 0,
        "individuals": 0,
        "properties": 0,
        "maximum_depth": 0,
        "maximum_number_of_children": 0,
        "average_number_of_children": 0,
        "classes_with_a_single_child": 0,
        "classes_with_more_than_25_children": 0,
        "classes_with_no_definition": 0
    }

def populate_class_with_details(classes, g):
    # Populate root classes with their own details
    for class_id, class_data in classes.items():
        if "Preferred Name" not in class_data:
            class_data["Preferred Name"] = extract_preferred_name(class_id)
        if "prefLabel" not in class_data:
            class_data["prefLabel"] = extract_preferred_name(class_id)
        if "prefixIRI" not in class_data:
            class_data["prefixIRI"] = extract_prefix(g, class_id)
        if "subClassOf" not in class_data:
            class_data["subClassOf"] = str(OWL_THING)
    return classes

def build_hierarchy(classes: Dict, g: Graph) -> Dict:
    root_classes = {}

    for class_id, class_data in classes.items():
        sub_class_of = class_data.get("subClassOf", str(OWL_THING))
        if sub_class_of in classes:
            if class_data not in classes[sub_class_of]["subClasses"]:
                classes[sub_class_of]["subClasses"].append(class_data)
        else:
            root_classes[sub_class_of] = create_root_class_entry(sub_class_of, class_data, g)

    return root_classes

def create_root_class_entry(sub_class_of: str, class_data: Dict, g: Graph) -> Dict:
    return {
        "ID": sub_class_of,
        "Preferred Name": extract_preferred_name(sub_class_of),
        "prefixIRI": extract_prefix(g, sub_class_of),  # Pass the graph object here
        "prefLabel": extract_preferred_name(sub_class_of),
        "subClasses": [class_data],
        "subClassOf": str(OWL_THING),
    }

def process_graph(g: Graph):
    attribute_mapping = define_attribute_mapping()
    stats = initialize_statistics()
    classes = defaultdict(lambda: {"subClasses": []})
    class_children_count = defaultdict(int)
    classes_with_definitions = set()

    unique_properties = set()
    for s, p, o in g:
        unique_properties.add(p)
        update_stats_based_on_type(stats, p, o)
        track_definitions(s, p, o, classes_with_definitions)
        track_child_counts(p, o, class_children_count)
        if should_process_triple(s, p, o, g):
            process_triple(s, p, o, g, classes, attribute_mapping)
    
    properties = extract_properties_to_list(unique_properties)
    stats["properties"] += len(properties)
    return stats, classes, class_children_count, classes_with_definitions, properties

def extract_properties_to_list(unique_properties):
    # Create a list to store the properties in the desired format
    properties = []

    # Populate the properties list with property names and their URIs
    for prop in sorted(unique_properties, key=lambda x: str(x)):
        prop_name = str(prop).split('#')[-1].split("/")[-1]  # Extract the property name from the URI
        properties.append({
            "property_name": prop_name,
            "ID": str(prop)
        })

    return properties

def define_attribute_mapping() -> Dict[str, str]:
    return {
        "rdfs:subClassOf": "subClassOf",
        "rdfs:label": "prefLabel",
        "owl:sameAs": "Synonyms",
        "skos:altLabel": "altLabel",
        "skos:definition": "Definitions",
        "prov:wasQuotedFrom": "wasQuotedFrom",
        "materialsmine:hasSelector": "hasSelector",
        "materialsmine:hasPreferredUnit": "hasPreferredUnit"
    }

def update_stats_based_on_type(stats: Dict[str, int], p: URIRef, o: URIRef) -> None:
    if p == RDF.type:
        if o == OWL.Class:
            stats["classes"] += 1
        elif o in (OWL.ObjectProperty, OWL.DatatypeProperty):
            stats["properties"] += 1
        else:
            stats["individuals"] += 1

def track_definitions(s: URIRef, p: URIRef, o: URIRef, classes_with_definitions: set) -> None:
    if p in (RDFS.comment, SKOS.definition):
        classes_with_definitions.add(str(s))

def track_child_counts(p: URIRef, o: URIRef, class_children_count: defaultdict) -> None:
    if p == RDFS.subClassOf:
        class_children_count[str(o).strip('<>')] += 1

def should_process_triple(s: URIRef, p: URIRef, o: URIRef, g: Graph) -> bool:
    if p == RDF.type and str(o) == "http://www.w3.org/2002/07/owl#Class":
        return False
    return (s, RDF.type, OWL.Class) in g

def process_triple(s: URIRef, p: URIRef, o: URIRef, g: Graph, 
                   classes: defaultdict, attribute_mapping: Dict[str, str]) -> None:
    class_id = str(s)
    classes[class_id]["ID"] = class_id
    classes[class_id]["prefixIRI"] = extract_prefix(g, class_id)
    
    qname = g.namespace_manager.qname(p)
    if qname in attribute_mapping:
        handle_attribute(qname, o, class_id, classes, attribute_mapping[qname], g)
    else:
        classes[class_id][qname] = str(o).strip()

def handle_attribute(qname: str, o: URIRef, class_id: str, 
                     classes: defaultdict, attr_name: str, g: Graph) -> None:
    if attr_name == "subClassOf":
        handle_subclass_of(o, class_id, classes, g)
    elif attr_name == "Synonyms":
        classes[class_id]["Synonyms"] = classes[class_id].get("Synonyms", []) + [str(o).strip()]
    elif attr_name == "prefLabel":
        classes[class_id]["prefLabel"] = str(o).strip()
        classes[class_id]["Label"] = str(o).strip()
        classes[class_id]["Preferred Name"] = str(o).strip()
    else:
        classes[class_id][attr_name] = str(o).strip()

def handle_subclass_of(o: URIRef, class_id: str, classes: defaultdict, g: Graph) -> None:
    if isinstance(o, BNode):
        return  # Skip restrictions
    subclass_of = str(o).strip('<>')
    classes[class_id]["subClassOf"] = subclass_of
    if subclass_of in classes:
        classes[subclass_of]["subClasses"].append(classes[class_id])
    else:
        classes[subclass_of] = {"ID": subclass_of, "subClasses": [classes[class_id]]}

def combine_root_class_with_initial_structure(sorted_classes, root_classes):
    for class_id, class_data in sorted_classes.items():
        if "subClassOf" not in class_data or class_data["subClassOf"] == str(OWL_THING):
            root_classes[class_id] = class_data
    
def calculate_additional_statistics(stats, classes, class_children_count, classes_with_definitions, g):     
    # Calculate additional statistics based on the constructed hierarchy
    total_children = 0
    for class_id, count in class_children_count.items():
        total_children += count
        stats["maximum_number_of_children"] = max(stats["maximum_number_of_children"], count)
        if count == 1:
            stats["classes_with_a_single_child"] += 1
        if count > 25:
            stats["classes_with_more_than_25_children"] += 1
    
    # Calculate average number of children
    if stats["classes"] > 0:
        stats["average_number_of_children"] = round(total_children / stats["classes"])

    # Calculate maximum depth and classes with no definitions
    for class_id, class_data in classes.items():
        current_depth = 0
        s = URIRef(class_id)
        while (s, RDFS.subClassOf, None) in g:
            current_depth += 1
            s = g.value(s, RDFS.subClassOf)
        stats["maximum_depth"] = max(stats["maximum_depth"], current_depth)

        if class_id not in classes_with_definitions:
            stats["classes_with_no_definition"] += 1   
    return stats

def details_from_turtle(app):
    app.logger.info('[details_from_turtle]: Extract Details from the turtle file')
    turtle_file = "/usr/src/files/mgs_materialsmine.ttl"

    if not os.path.isfile(turtle_file):
        raise FileNotFoundError(f"The file {turtle_file} does not exist in the current directory.")

    # Load the Turtle file
    g = Graph()
    g.parse(turtle_file, format="turtle")
    
    # Extract ontology details
    ontology_info = extract_ontology_info(g)
    
    # Extract information from the Turtle file
    stats, classes, class_children_count, classes_with_definitions, properties = process_graph(g)
    final_stats = calculate_additional_statistics(stats, classes, class_children_count, classes_with_definitions, g)

    resolved_classes = populate_class_with_details(classes, g)
            
    # Sort classes by "Preferred Name" 
    sorted_classes = dict(sorted(resolved_classes.items(), key=lambda item: item[1].get("Preferred Name")))

    # Initialize root classes
    root_classes = build_hierarchy(sorted_classes, g)

    # Combine root classes with the initial structure
    combine_root_class_with_initial_structure(sorted_classes, root_classes)
    # Recursively sort all subclasses
    sort_subclasses(root_classes)    
    app.logger.info('[details_from_turtle]: Details retrieved successfully from the turtle file')
    return final_stats, ontology_info, list(root_classes.values()), properties