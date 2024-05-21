from app.utils.util import log_errors

@log_errors
def search_and_refine_data(api_function, keywords, include_uSMILES=True):
    try:
        original_data = api_function(keywords)
        refined_data = {
            "data": {
                "StandardName": original_data.get('_stdname', original_data.get('_id')),
                "density": str(original_data.get('_density', ''))
            }
        }
        if include_uSMILES and '_id' in original_data:
            refined_data['data']['uSMILES'] = original_data['_id']
        return refined_data
    except Exception as e:
        print("error", e)
        raise ValueError(str(e))