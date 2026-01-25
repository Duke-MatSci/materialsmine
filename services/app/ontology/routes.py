from flask import Blueprint, request, jsonify,  Response, current_app as app
import requests
from pyshacl import validate as shacl_validate
import json
import datetime
from app.utils.util import token_required, request_logger, log_errors
from app.ontology.github_flow import get_commit_dates, download_file
from app.ontology.helpers.extract import details_from_turtle
from app.ontology.cache_service import check_cache, save_to_cache
from app.ontology.helpers.validation import DEFAULT_ONTOLOGY_LINK, FREQ_UNITS, _build_shapes_graph, _load_graph_from_text_or_link, _detect_mm_base_iri, _serialize_shacl_results, _collect_resolvable_urls, _head_check
from app.ontology.helpers.crud import push_to_fuseki, list_named_graphs, upsert_np_graphs_strict_transaction

ontology = Blueprint("ontology", __name__, url_prefix="/ontology")

@ontology.route('/extract/', methods=['GET'])
@log_errors
@request_logger
@token_required
def get_data_from_file(request_id):
    try:
        start_time = datetime.datetime.now()

        # Check if data is available in cache
        cached_data = check_cache(app)
        if cached_data:
            # If cached data is found, return it to the frontend
            app.logger.info("Returning cached data.")
            response = create_response(request_id, cached_data, start_time)
            return response
        
        # If cache is not found or empty, proceed with the existing logic
        if download_file(app):
            submission_details = get_commit_dates(app)
            metrics, ontology_info, turtle_data, properties = details_from_turtle(app)
        
            # Constructing the data dictionary
            data = construct_data_dictionary(metrics, ontology_info, submission_details, turtle_data, properties)

            # Save the constructed data to cache
            save_to_cache(app, data)

            response = create_response(request_id, data, start_time)

            return response
        else:
            # If download from GitHub fails, serve outdated cache if available
            app.logger.error("Failed to download file from GitHub. Serving from existing cache if available.")
            cached_data = check_cache(app, serve_out_dated=True)  # Check cache again (for fallback)
            if cached_data:
                app.logger.info("Serving outdated cached data as fallback.")
                response = create_response(request_id, cached_data, start_time)
                return response
            else:
                return jsonify({'message': "Failed to download file from GitHub and no cache available."}), 500

    except ValueError as ve:
        app.logger.error(f"ValueError: {str(ve)}", exc_info=True)
        return jsonify({'message': str(ve)}), 400
    except Exception as e:
        app.logger.error(f"Internal Server Error: {str(e)}", exc_info=True)
        return jsonify({'message': "Internal Server error"}), 500
    

def create_response(request_id, data, start_time):
    """Helper function to create a Flask response with headers."""
    json_data = json.dumps(data, indent=4)
    
    response = Response(json_data, content_type='application/json; charset=utf-8', status=200)
    
    end_time = datetime.datetime.now()
    latency = f"{(end_time - start_time).total_seconds()} seconds"
    
    response.headers['startTime'] = start_time
    response.headers['endTime'] = end_time
    response.headers['latency'] = latency
    response.headers['responseId'] = request_id
    return response

def construct_data_dictionary(metrics, ontology_info, submission_details, turtle_data, properties):
    """Helper function to construct the data dictionary."""
    return {
        "details": {
            "Acronyms": "MATERIALSMINE",
            "Visibility": "Public",
            "Description": ontology_info[1],
            "Status": "Alpha",
            "Format": ontology_info[0],
            "Contact": "Marc Palmeri, Ph.D., marc.j.palmeri@duke.edu",
            "Categories": "Chemical, Development, Physicochemical",
        },
        "metrics": metrics,
        "data": turtle_data,
        "submissions": submission_details,
        "properties": properties,
        "lastUpdateDate": str(datetime.date.today())
    }

@ontology.route("/validate/", methods=["POST"])
@log_errors
@request_logger
@token_required
def validate_ontology(request_id):
    """
    POST /ontology/validate/

    Body (JSON):
    {
      "ontology_link": "https://.../raw/.../%40mm.ttl",   # optional, defaults to DEFAULT_ONTOLOGY_LINK
      "ontology_text": "<ttl string>",                    # optional alternative to link
      "ontology_format": "turtle|xml|n3|nquads",          # optional (default: turtle)

      "data_link": "https://.../data.ttl",                # optional (for ontology+data)
      "data_text": "<ttl string>",                        # optional alternative to link
      "data_format": "turtle|trig|n3|...",                # optional (default: turtle)

      "validation_type": "ontology" | "ontology+data",    # default: "ontology"
      "inference": "rdfs" | "both" | "none",              # default: "rdfs"
      "resolve_urls": true | false,                       # default: true (only used if data present)
      "allowed_frequency_units": ["http://qudt.org/vocab/unit/HZ", ...]  # optional override
    }

    Returns: JSON with parse/validation status and SHACL report (if run), plus timing headers.
    """
    start_time = datetime.datetime.now()
    try:
        payload = request.get_json(silent=True) or {}

        ontology_link = payload.get("ontology_link") or DEFAULT_ONTOLOGY_LINK
        ontology_text = payload.get("ontology_text")
        ontology_format = payload.get("ontology_format") or "turtle"

        data_link = payload.get("data_link")
        data_text = payload.get("data_text")
        data_format = payload.get("data_format") or "turtle"

        validation_type = (payload.get("validation_type") or "ontology").lower()
        inference = (payload.get("inference") or "rdfs").lower()
        resolve_urls = payload.get("resolve_urls", True)
        allowed_units = payload.get("allowed_frequency_units")  # list[str] or None

        # --- 1) Parse ontology (syntax validation)
        ontology_graph = _load_graph_from_text_or_link(
            text=ontology_text,
            link=ontology_link,
            default_format=ontology_format,
        )
        mm_base = _detect_mm_base_iri(ontology_graph)

        ontology_report = {
            "syntax_ok": True,
            "mm_base_iri": mm_base,
            "triples": len(ontology_graph),
            "source": "text" if ontology_text else "link",
        }

        # If ontology-only, we stop here with success.
        if validation_type in ("ontology", "ontology_only"):
            graph_uri = "http://materialsmine.org/ontology"
            update_ontology = bool(payload.get("update_ontology", False))

            fuseki_update = None
            if update_ontology:
                ok, info = push_to_fuseki(ontology_graph, ontology_format, graph_uri=graph_uri, replace=True)
                fuseki_update = {"ok": ok, **info}

                if not ok and payload.get("fail_on_fuseki_error"):
                    return jsonify({
                        "message": "Failed to update ontology in Fuseki.",
                        "fuseki": fuseki_update,
                        "ontology_report": ontology_report,
                    }), 502

            response_body = {
                "multi": False,
                "response": {
                    "mode": "ontology-only",
                    "ontology_report": ontology_report,
                    "fuseki_update": fuseki_update,
                },
            }
            end_time = datetime.datetime.now()
            latency = f"{((end_time - start_time)).total_seconds()} seconds"
            json_data = json.dumps(response_body, indent=2)
            resp = Response(json_data, content_type="application/json; charset=utf-8", status=200)
            resp.headers["startTime"] = start_time
            resp.headers["endTime"] = end_time
            resp.headers["latency"] = str(latency)
            resp.headers["responseId"] = request_id
            return resp

        # --- 2) Parse data graph (required for ontology+data)
        data_graph = _load_graph_from_text_or_link(
            text=data_text,
            link=data_link,
            default_format=data_format,
        )
        data_report = {"triples": len(data_graph), "source": "text" if data_text else "link"}

        # --- 3) Build shapes (tailored to detected mm: base)
        if not mm_base:
            # If we cannot detect mm: IRI, we can still proceed but shapes won't target your classes.
            # We expose a warning and set a placeholder base.
            mm_base = "http://materialsmine.org/resource/"
            shapes_warning = (
                "Could not detect mm: base IRI from ontology; using placeholder. "
                "Shapes targeting mm:* classes may not match your data."
            )
        else:
            shapes_warning = None

        print(f"Using mm: base IRI = {mm_base}")
        shapes_graph = _build_shapes_graph(mm_base, allowed_units)

        # --- 4) Run SHACL validation
        if inference not in ("rdfs", "both", "none"):
            return jsonify({"message": "inference must be one of: rdfs | both | none"}), 400

        conforms, results_graph, results_text = shacl_validate(
            data_graph,
            shacl_graph=shapes_graph,
            ont_graph=ontology_graph,
            inference=None if inference == "none" else inference,
            debug=False,
            advanced=True,
        )

        violations = _serialize_shacl_results(results_graph)

        # --- 5) Optional resolvability checks (ORCID/DOI)
        resolvability = None
        if resolve_urls:
            urls = _collect_resolvable_urls(data_graph)
            checks = [_head_check(u) for u in urls]
            resolvability = [
                {"url": u, "status": status, "ok": ok} for (u, status, ok) in checks
            ]
        
        try:
            data_obj = json.loads(data_text) if data_text else None
            root_id = data_obj.get("id") or data_obj.get("@id") if isinstance(data_obj, dict) else None
        except Exception as e:
            app.logger.error(f"Error during SampleID resolvability checks: {str(e)}", exc_info=True)
            return jsonify({"message": "Error during SampleID resolvability checks."}), 400

        graph_uri = root_id or "http://materialsmine.org/np/unknown-id"

        persistence_report = None
        if payload.get("persist", True):
            # Previewing what we'll write
            try:
                graphs_preview = list_named_graphs(data_text or "")
            except Exception as e:
                graphs_preview = []
                app.logger.warning(f"Could not list named graphs from JSON-LD: {e}")

            # STRICT mode: one transactional update for all nanopub graphs
            ok, strict_report = upsert_np_graphs_strict_transaction(
                jsonld_text=data_text or "",
                only_these_suffixes=None,  # or restrict to ["#assertion", "#provenance", "#pubinfo", "#head"]
                timeout=120,
            )

            if not ok:
                # Fail the entire request (strict mode)
                return jsonify({
                    "message": "SHACL passed but transactional persistence submission to Fuseki failed",
                    "graphs_preview": graphs_preview,
                    "persistence": strict_report,
                }), 502

            persistence_report = {
                "mode": "nanopub:many-graphs:strict-transaction",
                "graphs_preview": graphs_preview,
                "result": strict_report,
            }

        # --- Build response
        response_body = {
            "multi": True,
            "response": {
                "mode": "ontology+data",
                "ontology_report": ontology_report,
                "data_report": data_report,
                "shacl": {
                    "conforms": bool(conforms),
                    "violation_count": len(violations),
                    "violations": violations,
                    "text": results_text,  # human-readable report from pySHACL
                    "shapes_warning": shapes_warning,
                },
                "resolvability": resolvability,
                "config": {
                    "inference": inference,
                    "allowed_frequency_units": allowed_units or FREQ_UNITS,
                },
                "persistence": persistence_report,
            },
        }

        end_time = datetime.datetime.now()
        latency = f"{((end_time - start_time)).total_seconds()} seconds"

        json_data = json.dumps(response_body, indent=2)
        resp = Response(json_data, content_type="application/json; charset=utf-8", status=201)
        resp.headers["startTime"] = start_time
        resp.headers["endTime"] = end_time
        resp.headers["latency"] = str(latency)
        resp.headers["responseId"] = request_id
        return resp

    except requests.HTTPError as he:
        return jsonify({"message": f"HTTP error fetching resource: {str(he)}"}), 502
    except requests.RequestException as rexc:
        return jsonify({"message": f"Network error fetching resource: {str(rexc)}"}), 502
    except Exception as e:
        # rdflib parsing errors, pyshacl errors, etc.
        return jsonify({"message": str(e)}), 400