from flask import Blueprint, request, jsonify, make_response
from ..config import db
from ..models import Permission # Ensure Permission is imported
from ..decorators import permission_required
from flask_login import login_required

permissions_bp = Blueprint('permissions', __name__)

@permissions_bp.route("/permissions", methods=["GET"], strict_slashes=False)
@login_required
@permission_required('permission.manage') # Or 'permission.read.all'
def get_permissions():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    include_usage = request.args.get("include_usage", "false").lower() == "true"
    status_filter = request.args.get("status")       # e.g., ?status=active
    name_search = request.args.get("name_search")     # e.g., ?name_search=user
    category_filter = request.args.get("category")    # e.g., ?category=reporting

    query = Permission.query
    # Apply filters based on query parameters
    if status_filter:
        query = query.filter_by(status=status_filter)
    if name_search:
        query = query.filter(Permission.name.ilike(f"%{name_search}%"))
    if category_filter:
        query = query.filter_by(category=category_filter)

    pagination = query.paginate(
        page=page, per_page=per_page, error_out=False
    )
    permissions = pagination.items
    # Pass the 'include_usage' flag to the to_json method
    json_permissions = list(map(lambda x: x.to_json(include_usage=include_usage), permissions))

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
    include_usage = request.args.get("include_usage", "false").lower() == "true"

    permission = Permission.query.get(permission_id)
    if not permission:
        return jsonify({"message": "Permission not found"}), 404
    # Pass the 'include_usage' flag to the to_json method
    return jsonify(permission.to_json(include_usage=include_usage)), 200

@permissions_bp.route("/permissions", methods=["POST"])
@login_required
@permission_required('permission.create')
def create_permission():
    name = request.json.get("name")
    description = request.json.get("description")
    category = request.json.get("category") # Allow creating with a category
    status = request.json.get("status", "active") # Get status from JSON, default to 'active'

    if not name:
        return jsonify({"message": "Permission name is required"}), 400

    if status not in ['active', 'inactive']:
        return jsonify({"message": "Invalid status. Must be 'active' or 'inactive'"}), 400

    existing_permission = Permission.query.filter_by(name=name).first()
    if existing_permission:
        return jsonify({"message": f"Permission '{name}' already exists"}), 409

    new_permission = Permission(name=name, description=description, category=category, status=status)

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
    new_category = data.get("category") # Allow updating category
    new_status = data.get("status") # Get new status from JSON

    if new_name and new_name != permission.name:
        existing_permission = Permission.query.filter(
            Permission.name == new_name,
            Permission.id != permission_id
        ).first()
        if existing_permission:
            return jsonify({"message": f"Permission '{new_name}' already exists"}), 409

    if new_status is not None: # Only validate if status is provided in the request
        if new_status not in ['active', 'inactive']:
            return jsonify({"message": "Invalid status. Must be 'active' or 'inactive'"}), 400

    if new_name:
        permission.name = new_name
    if new_description is not None:
        permission.description = new_description
    if new_category is not None: # Allow setting category to None
        permission.category = new_category
    if new_status is not None: # Update status if provided
        permission.status = new_status

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

    if permission.roles.count() > 0:
        return jsonify(
            {"message": f"Cannot delete permission '{permission.name}'. It is assigned to {permission.roles.count()} roles."}
        ), 409

    try:
        db.session.delete(permission)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to delete permission: {str(e)}"}), 400

    return jsonify({"message": "Permission deleted successfully!"}), 200