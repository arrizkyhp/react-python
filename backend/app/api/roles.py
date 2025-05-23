from flask import Blueprint, request, jsonify, make_response
from backend.app.config import db
from backend.app.models import Role, Permission # Import Permission model
from backend.app.decorators import permission_required
from flask_login import login_required, current_user

roles_bp = Blueprint('roles', __name__)

@roles_bp.route("/roles", methods=["GET"], strict_slashes=False)
@login_required
@permission_required('role.manage')
def get_roles():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)

    pagination = Role.query.paginate(
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
@permission_required('role.manage') # Or 'role.read.single' if you differentiate
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

    new_role = Role(name=name, description=description)

    # Assign permissions if provided
    if permission_ids:
        permissions_to_add = Permission.query.filter(Permission.id.in_(permission_ids)).all()
        if len(permissions_to_add) != len(permission_ids):
            return jsonify({"message": "One or more permission IDs are invalid"}), 400
        new_role.permissions = permissions_to_add

    try:
        db.session.add(new_role)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to create role: {str(e)}"}), 400

    return jsonify({"message": "Role created successfully!", "role": new_role.to_json()}), 201

@roles_bp.route("/roles/<int:role_id>", methods=["PATCH"])
@login_required
@permission_required('role.manage')
def update_role(role_id):
    role = Role.query.get(role_id)
    if not role:
        return jsonify({"message": "Role not found"}), 404

    data = request.json
    new_name = data.get("name")
    new_description = data.get("description")
    permission_ids = data.get("permission_ids") # This will overwrite existing permissions

    if new_name and new_name != role.name:
        existing_role = Role.query.filter(
            Role.name == new_name,
            Role.id != role_id
        ).first()
        if existing_role:
            return jsonify({"message": f"Role '{new_name}' already exists"}), 409

    if new_name:
        role.name = new_name
    if new_description is not None: # Allow setting description to None
        role.description = new_description

    # Update permissions if permission_ids is provided
    if permission_ids is not None:
        if not isinstance(permission_ids, list):
            return jsonify({"message": "permission_ids must be a list"}), 400
        permissions_to_set = Permission.query.filter(Permission.id.in_(permission_ids)).all()
        if len(permissions_to_set) != len(permission_ids):
            return jsonify({"message": "One or more permission IDs are invalid"}), 400
        role.permissions = permissions_to_set # This replaces existing permissions

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to update role: {str(e)}"}), 400

    return jsonify({"message": "Role updated successfully!", "role": role.to_json()}), 200

@roles_bp.route("/roles/<int:role_id>", methods=["DELETE"])
@login_required
@permission_required('role.delete')
def delete_role(role_id):
    role = Role.query.get(role_id)
    if not role:
        return jsonify({"message": "Role not found"}), 404

    # Prevent deleting critical roles if they are hardcoded somewhere (e.g., 'Admin')
    # Or implement checks for roles that users are currently assigned to
    if role.name in ["Admin", "User", "Guest"]: # Example: Protect default roles
        return jsonify({"message": f"Role '{role.name}' cannot be deleted"}), 403

    # Important: Consider what happens to users assigned to this role.
    # If using `lazy='dynamic'` on `backref('users')`, Flask-SQLAlchemy might handle
    # the removal of associations in the `user_roles` table automatically.
    # If `users` are still tied to this role, you might need to reassign them
    # or disallow deletion if users are still linked.
    if role.users.count() > 0:
        return jsonify({"message": f"Cannot delete role '{role.name}'. It is currently assigned to users."}), 409

    try:
        db.session.delete(role)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to delete role: {str(e)}"}), 400

    return jsonify({"message": "Role deleted successfully!"}), 200

# Optional: Endpoint to manage specific permission assignment for a role (alternative to PATCH)
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

    role.permissions.append(permission)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
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

    role.permissions.remove(permission)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to remove permission: {str(e)}"}), 400

    return jsonify({"message": "Permission removed from role successfully!", "role": role.to_json()}), 200