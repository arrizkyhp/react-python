from flask import Blueprint, request, jsonify, make_response, current_app # NEW: Import current_app
from ..config import db
from ..models import Role, Permission # Import Permission model
from ..decorators import permission_required
from flask_login import login_required, current_user
from ..utils.audit_logger import log_audit_event # NEW: Import the audit logger

roles_bp = Blueprint('roles', __name__)

# Helper function to validate and retrieve permissions by IDs
def _get_permissions_by_ids(permission_ids):
    """Helper to fetch Permission objects and validate all IDs exist."""
    if not permission_ids:
        return []
    permissions = Permission.query.filter(Permission.id.in_(permission_ids)).all()
    if len(permissions) != len(permission_ids):
        # Find missing IDs for a more specific error message
        found_ids = {p.id for p in permissions}
        missing_ids = [pid for pid in permission_ids if pid not in found_ids]
        raise ValueError(f"One or more permission IDs are invalid: {missing_ids}")
    return permissions

@roles_bp.route("/roles", methods=["GET"], strict_slashes=False)
@login_required
@permission_required('role.manage')
def get_roles():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    # Adding name_search as per the previous GET roles example
    name_search = request.args.get("name_search")

    query = Role.query

    if name_search:
        query = query.filter(Role.name.ilike(f"%{name_search}%"))

    pagination = query.paginate(
        page=page, per_page=per_page, error_out=False
    )
    roles = pagination.items
    json_roles = list(map(lambda x: x.to_json(), roles))

    pagination_metadata = {
        "total_items": pagination.total,
        "total_pages": pagination.pages,
        "current_page": pagination.page,
        "per_page": pagination.per_page,
        "has_next": pagination.has_next,
        "has_prev": pagination.has_prev,
        "next_num": pagination.next_num,
        "prev_num": pagination.prev_num,
    }

    response_data = {"items": json_roles, "pagination": pagination_metadata}
    response = make_response(jsonify(response_data))

    return response

@roles_bp.route("/roles/<int:role_id>", methods=["GET"])
@login_required
@permission_required('role.manage')
def get_role(role_id):
    role = Role.query.get(role_id)
    if not role:
        return jsonify({"message": "Role not found"}), 404
    return jsonify(role.to_json()), 200

@roles_bp.route("/roles", methods=["POST"])
@login_required
@permission_required('role.manage')
def create_role():
    name = request.json.get("name")
    description = request.json.get("description")
    permission_ids = request.json.get("permission_ids", []) # List of permission IDs

    if not name:
        return jsonify({"message": "Role name is required"}), 400

    existing_role = Role.query.filter_by(name=name).first()
    if existing_role:
        return jsonify({"message": f"Role '{name}' already exists"}), 409

    try:
        permissions_to_add = _get_permissions_by_ids(permission_ids)
    except ValueError as e:
        return jsonify({"message": str(e)}), 400 # Return 400 for bad request

    new_role = Role(name=name, description=description)
    new_role.permissions.extend(permissions_to_add) # Use extend for initial assignment

    try:
        db.session.add(new_role)
        db.session.commit()

        log_audit_event(
            action_type='CREATE',
            entity_type='Role',
            entity_id=new_role.id,
            new_value=new_role.to_json(), # Log the full new object state
            description=f"Created role '{new_role.name}' (ID: {new_role.id})"
        )

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Failed to create role: {e}", exc_info=True)
        return jsonify({"message": f"Failed to create role: {str(e)}"}), 400

    return jsonify({"message": "Role created successfully!", "role": new_role.to_json()}), 201

@roles_bp.route("/roles/<int:role_id>", methods=["PATCH"])
@login_required
@permission_required('role.manage')
def update_role(role_id):
    role = Role.query.get(role_id)
    if not role:
        return jsonify({"message": "Role not found"}), 404

    # Capture old state for audit logging before modifications
    old_role_data = role.to_json()
    changes = {} # Dictionary to track what changed for audit log

    data = request.json
    new_name = data.get("name")
    new_description = data.get("description")
    new_permission_ids = data.get("permission_ids") # This will overwrite existing permissions

    # Handle name change
    if new_name is not None and new_name != role.name:
        existing_role = Role.query.filter(
            Role.name == new_name,
            Role.id != role_id
        ).first()
        if existing_role:
            return jsonify({"message": f"Role '{new_name}' already exists"}), 409
        changes['name'] = {'old': role.name, 'new': new_name}
        role.name = new_name

    # Handle description change
    if new_description is not None and new_description != role.description:
        changes['description'] = {'old': role.description, 'new': new_description}
        role.description = new_description

    # Handle permission changes (this is the most complex part for auditing)
    if new_permission_ids is not None:
        current_permissions_info = sorted([
            {"id": p.id, "name": p.name} for p in role.permissions
        ], key=lambda x: x['id'])  # Sort for consistent comparison

        new_permission_ids_set = set(new_permission_ids)  # Use a set for efficient lookup
        # Fetch new permissions and their names
        try:
            permissions_to_set = _get_permissions_by_ids(list(new_permission_ids_set))
        except ValueError as e:
            return jsonify({"message": str(e)}), 400

        new_permissions_info = sorted([
            {"id": p.id, "name": p.name} for p in permissions_to_set
        ], key=lambda x: x['id'])  # Sort for consistent comparison

        # Only proceed if there are actual changes in the set of permissions
        if current_permissions_info != new_permissions_info:
            # Calculate added and removed permissions for description
            current_permission_ids = {p['id'] for p in current_permissions_info}
            new_permission_ids_for_compare = {p['id'] for p in new_permissions_info}

            added_permissions_names = [
                p['name'] for p in new_permissions_info
                if p['id'] not in current_permission_ids
            ]
            removed_permissions_names = [
                p['name'] for p in current_permissions_info
                if p['id'] not in new_permission_ids_for_compare
            ]

            # Update the role's permissions
            role.permissions = permissions_to_set

            # Store permission changes in the `changes` dict for logging
            changes['permissions'] = {
                'old_details': current_permissions_info,  # Store list of dicts
                'new_details': new_permissions_info,  # Store list of dicts
                'added_names': added_permissions_names,
                'removed_names': removed_permissions_names
            }

    if not changes: # No actual changes were detected based on provided data
        return jsonify({"message": "No changes provided for update."}), 200

    try:
        db.session.commit()

        for field, values in changes.items():
            if field == 'permissions':
                description_msg = f"Updated role '{role.name}' (ID: {role.id}): permissions changed."
                if values['added_names']:
                    description_msg += f" Added: {', '.join(values['added_names'])}."
                if values['removed_names']:
                    description_msg += f" Removed: {', '.join(values['removed_names'])}."

                log_audit_event(
                    action_type='UPDATE',
                    entity_type='Role',
                    entity_id=role.id,
                    field_name=field,
                    old_value=values['old_details'],
                    new_value=values['new_details'],
                    description=description_msg
                )
            else:
                log_audit_event(
                    action_type='UPDATE',
                    entity_type='Role',
                    entity_id=role.id,
                    field_name=field,
                    old_value=values['old'],
                    new_value=values['new'],
                    description=f"Updated role '{role.name}' (ID: {role.id}): changed '{field}'"
                )

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Failed to update role: {e}", exc_info=True)
        return jsonify({"message": f"Failed to update role: {str(e)}"}), 400

    return jsonify({"message": "Role updated successfully!", "role": role.to_json()}), 200

@roles_bp.route("/roles/<int:role_id>", methods=["DELETE"])
@login_required
@permission_required('role.manage')
def delete_role(role_id):
    role = Role.query.get(role_id)
    if not role:
        return jsonify({"message": "Role not found"}), 404

    # Prevent deleting critical roles (if you have fixed system roles)
    if role.name in ["Admin", "System Admin"]: # Example: Protect core roles
        return jsonify({"message": f"Role '{role.name}' cannot be deleted"}), 403

    # Check if role is assigned to any users
    # This requires `role.users` backref on User model, ensure it's configured
    if role.users.count() > 0:
        return jsonify({"message": f"Cannot delete role '{role.name}'. It is currently assigned to users."}), 409

    # Capture role data before deletion for audit log
    deleted_role_name = role.name
    deleted_role_json = role.to_json() # Captures current state including permissions

    try:
        db.session.delete(role)
        db.session.commit()

        # --- AUDIT LOG: ROLE DELETION ---
        log_audit_event(
            action_type='DELETE',
            entity_type='Role',
            entity_id=role_id,
            old_value=deleted_role_json, # Log the state before deletion
            description=f"Deleted role '{deleted_role_name}' (ID: {role_id})"
        )
        # -----------------------------------

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Failed to delete role: {e}", exc_info=True)
        return jsonify({"message": f"Failed to delete role: {str(e)}"}), 400

    return jsonify({"message": "Role deleted successfully!"}), 200

@roles_bp.route("/roles/options", methods=["GET"])
@login_required
@permission_required('role.manage')
def get_role_options():
    """
    Returns a simplified list of all roles suitable for frontend multi-select
    components (e.g., id and name).
    """
    roles = Role.query.all()
    roles_options = [{"id": role.id, "name": role.name} for role in roles]
    return jsonify(roles_options), 200

# --- Separate endpoints for granular permission management ---
# These are less common if PATCH is used to overwrite all permissions,
# but valuable for incremental changes.
@roles_bp.route("/roles/<int:role_id>/permissions", methods=["POST"])
@login_required
@permission_required('role.assign_permission') # New granular permission
def add_permission_to_role(role_id):
    role = Role.query.get(role_id)
    if not role:
        return jsonify({"message": "Role not found"}), 404

    permission_id = request.json.get("permission_id")
    if not permission_id:
        return jsonify({"message": "Permission ID is required"}), 400

    permission = Permission.query.get(permission_id)
    if not permission:
        return jsonify({"message": "Permission not found"}), 404

    if permission in role.permissions:
        return jsonify({"message": "Role already has this permission"}), 409

    # Capture old permissions for audit
    old_permissions_details = sorted([
        {"id": p.id, "name": p.name} for p in role.permissions
    ], key=lambda x: x['id'])

    role.permissions.append(permission)
    try:
        db.session.commit()

        # --- AUDIT LOG: ADD PERMISSION TO ROLE ---
        new_permissions_details = sorted([
            {"id": p.id, "name": p.name} for p in role.permissions
        ], key=lambda x: x['id'])

        description_msg = (
            f"Added permission '{permission.name}' (ID: {permission.id}) "
            f"to role '{role.name}' (ID: {role.id})."
        )
        log_audit_event(
            action_type='UPDATE',
            entity_type='Role',
            entity_id=role.id,
            field_name='permissions',
            old_value=old_permissions_details,  # Pass the list of dicts
            new_value=new_permissions_details,  # Pass the list of dicts
            description=description_msg
        )
        # -------------------------------------------

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Failed to add permission to role: {e}", exc_info=True)
        return jsonify({"message": f"Failed to add permission: {str(e)}"}), 400

    return jsonify({"message": "Permission added to role successfully!", "role": role.to_json()}), 200

@roles_bp.route("/roles/<int:role_id>/permissions/<int:permission_id>", methods=["DELETE"])
@login_required
@permission_required('role.assign_permission') # Same permission for adding/removing
def remove_permission_from_role(role_id, permission_id):
    role = Role.query.get(role_id)
    if not role:
        return jsonify({"message": "Role not found"}), 404

    permission = Permission.query.get(permission_id)
    if not permission:
        return jsonify({"message": "Permission not found"}), 404

    if permission not in role.permissions:
        return jsonify({"message": "Role does not have this permission"}), 404

    # Capture old permissions for audit
    old_permissions_details = sorted([
        {"id": p.id, "name": p.name} for p in role.permissions
    ], key=lambda x: x['id'])

    role.permissions.remove(permission)
    try:
        db.session.commit()

        # --- AUDIT LOG: REMOVE PERMISSION FROM ROLE ---
        new_permissions_details = sorted([
            {"id": p.id, "name": p.name} for p in role.permissions
        ], key=lambda x: x['id'])

        description_msg = (
            f"Removed permission '{permission.name}' (ID: {permission.id}) "
            f"from role '{role.name}' (ID: {role.id})."
        )
        log_audit_event(
            action_type='UPDATE',
            entity_type='Role',
            entity_id=role.id,
            field_name='permissions',
            old_value=old_permissions_details,  # Pass the list of dicts
            new_value=new_permissions_details,  # Pass the list of dicts
            description=description_msg
        )
        # ----------------------------------------------

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Failed to remove permission from role: {e}", exc_info=True)
        return jsonify({"message": f"Failed to remove permission: {str(e)}"}), 400

    return jsonify({"message": "Permission removed from role successfully!", "role": role.to_json()}), 200