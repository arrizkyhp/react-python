from flask import Blueprint, request, jsonify, make_response
from backend.app.config import db
from backend.app.models import Permission
from backend.app.decorators import permission_required
from flask_login import login_required

permissions_bp = Blueprint('permissions', __name__)

@permissions_bp.route("/permissions", methods=["GET"], strict_slashes=False)
@login_required
@permission_required('permission.manage')
def get_permissions():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)

    pagination = Permission.query.paginate(
        page=page, per_page=per_page, error_out=False
    )
    permissions = pagination.items
    json_permissions = list(map(lambda x: x.to_json(), permissions))

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

    response_data = {"items": json_permissions, "pagination": pagination_metadata}
    response = make_response(jsonify(response_data))

    return response

@permissions_bp.route("/permissions/<int:permission_id>", methods=["GET"])
@login_required
@permission_required('permission.read.all')
def get_permission(permission_id):
    permission = Permission.query.get(permission_id)
    if not permission:
        return jsonify({"message": "Permission not found"}), 404
    return jsonify(permission.to_json()), 200

@permissions_bp.route("/permissions", methods=["POST"])
@login_required
@permission_required('permission.create')
def create_permission():
    name = request.json.get("name")
    description = request.json.get("description")

    if not name:
        return jsonify({"message": "Permission name is required"}), 400

    existing_permission = Permission.query.filter_by(name=name).first()
    if existing_permission:
        return jsonify({"message": f"Permission '{name}' already exists"}), 409

    new_permission = Permission(name=name, description=description)

    try:
        db.session.add(new_permission)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to create permission: {str(e)}"}), 400

    return jsonify({"message": "Permission created successfully!", "permission": new_permission.to_json()}), 201

@permissions_bp.route("/permissions/<int:permission_id>", methods=["PATCH"])
@login_required
@permission_required('permission.update')
def update_permission(permission_id):
    permission = Permission.query.get(permission_id)
    if not permission:
        return jsonify({"message": "Permission not found"}), 404

    data = request.json
    new_name = data.get("name")
    new_description = data.get("description")

    if new_name and new_name != permission.name:
        existing_permission = Permission.query.filter(
            Permission.name == new_name,
            Permission.id != permission_id
        ).first()
        if existing_permission:
            return jsonify({"message": f"Permission '{new_name}' already exists"}), 409

    if new_name:
        permission.name = new_name
    if new_description is not None:
        permission.description = new_description

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to update permission: {str(e)}"}), 400

    return jsonify({"message": "Permission updated successfully!", "permission": permission.to_json()}), 200

@permissions_bp.route("/permissions/<int:permission_id>", methods=["DELETE"])
@login_required
@permission_required('permission.delete')
def delete_permission(permission_id):
    permission = Permission.query.get(permission_id)
    if not permission:
        return jsonify({"message": "Permission not found"}), 404

    # IMPORTANT: Check if any roles are currently using this permission.
    # The `backref('roles')` on the Permission model for the many-to-many relationship
    # allows you to check `permission.roles`.
    if permission.roles.count() > 0:
        return jsonify({"message": f"Cannot delete permission '{permission.name}'. It is assigned to roles."}), 409

    try:
        db.session.delete(permission)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to delete permission: {str(e)}"}), 400

    return jsonify({"message": "Permission deleted successfully!"}), 200