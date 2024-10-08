"""
`validate_control_id` function checks if the `control_id` is provided, is a string, and is 24 characters long.
"""
def validate_control_id(control_id):
  # Check if control_id is provided
  if not control_id:
    return False, "control_id is required"
  
  # Check the type of control_id
  if not isinstance(control_id, str):
    return False, "control_id must be a string"
  
  # Check the format of control_id (example: must be alphanumeric and 24 characters long)
  if not control_id.isalnum() or len(control_id) != 24:
    return False, "control_id must be 8 alphanumeric characters"
  
  return True, "control_id is valid"