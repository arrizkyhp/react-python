from flask import Blueprint, request, jsonify, make_response, current_app
from ..config import db
from ..models import Permission, Category
from ..decorators import permission_required
from flask_login import login_required
from ..utils.audit_logger import log_audit_event

permissions_bp = Blueprint('permissions', __name__)

@permissions_bp.route("/permissions", methods=["GET"], strict_slashes=False)
@login_required
@permission_required('permission.manage') # Or 'permission.read.all'
def get_permissions():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    include_usage = request.args.get("include_usage", "false").lower() == "true"
    include_category_details = request.args.get("include_category_details", "false").lower() == "true"
    status_filter = request.args.get("status")
    name_search = request.args.get("name_search")
    category_id_filter = request.args.get("category_id", type=int)
    category_name_filter = request.args.get("category_name")

    query = Permission.query
    # Apply filters based on query parameters
    if status_filter:
        query = query.filter_by(status=status_filter)
    if name_search:
        query = query.filter(Permission.name.ilike(f"%{name_search}%"))
    if category_id_filter:
        query = query.filter_by(category_id=category_id_filter)
    if category_name_filter:
        # Join with Category table to filter by category name
        query = query.join(Category).filter(Category.name.ilike(f"%{category_name_filter}%"))

    pagination = query.paginate(
        page=page, per_page=per_page, error_out=False
    )
    permissions = pagination.items
    # Pass the 'include_usage' flag to the to_json method
    json_permissions = list(map(
        lambda x: x.to_json(
            include_usage=include_usage,
            include_category_details=include_category_details
        ),
        permissions
    ))

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
    include_category_details = request.args.get("include_category_details", "false").lower() == "true"


    permission = Permission.query.get(permission_id)
    if not permission:
        return jsonify({"message": "Permission not found"}), 404
    return jsonify(permission.to_json(
        include_usage=include_usage,
        include_category_details=include_category_details
    )), 200

@permissions_bp.route("/permissions", methods=["POST"])
@login_required
@permission_required('permission.create')
def create_permission():
    name = request.json.get("name")
    description = request.json.get("description")
    category_id = request.json.get("category_id") # Expecting category_id
    status = request.json.get("status", "active") # Get status from JSON, default to 'active'

    if not name:
        return jsonify({"message": "Permission name is required"}), 400

    if status not in ['active', 'inactive']:
        return jsonify({"message": "Invalid status. Must be 'active' or 'inactive'"}), 400

    category = None
    if category_id:
        category = Category.query.get(category_id)
        if not category:
            return jsonify({"message": f"Category with ID {category_id} not found"}), 404

    existing_permission = Permission.query.filter_by(name=name).first()
    if existing_permission:
        return jsonify({"message": f"Permission '{name}' already exists"}), 409

    new_permission = Permission(
        name=name,
        description=description,
        category_id=category_id, # Assign category_id
        status=status
    )

    try:
        db.session.add(new_permission)
        db.session.commit()

        log_audit_event(
            action_type='CREATE',
            entity_type='Permission',
            entity_id=new_permission.id,
            new_value=new_permission.to_json(include_category_details=True),
            description=f"Created permission '{new_permission.name}' (ID: {new_permission.id})"
        )
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Failed to create permission: {e}", exc_info=True)
        return jsonify({"message": f"Failed to create permission: {str(e)}"}), 400

    return jsonify({"message": "Permission created successfully!", "permission": new_permission.to_json(include_category_details=True)}), 201

@permissions_bp.route("/permissions/<int:permission_id>", methods=["PATCH"])
@login_required
@permission_required('permission.update')
def update_permission(permission_id):
    permission = Permission.query.get(permission_id)
    if not permission:
        return jsonify({"message": "Permission not found"}), 404

    # Capture old state for audit logging
    old_permission_data = permission.to_json(include_category_details=True)
    changes = {}

    data = request.json
    new_name = data.get("name")
    new_description = data.get("description")
    new_category_id = data.get("category_id") # Allow updating category_id
    new_status = data.get("status") # Get new status from JSON

    if new_name is not None and new_name != permission.name:
        existing_permission = Permission.query.filter(
            Permission.name == new_name,
            Permission.id != permission_id
        ).first()
        if existing_permission:
            return jsonify({"message": f"Permission '{new_name}' already exists"}), 409
        changes['name'] = {'old': permission.name, 'new': new_name}
        permission.name = new_name

    if new_description is not None and new_description != permission.description:
        changes['description'] = {'old': permission.description, 'new': new_description}
        permission.description = new_description

    if new_category_id is not None and new_category_id != permission.category_id:
        new_category = None
        if new_category_id is not None:
            new_category = Category.query.get(new_category_id)
            if not new_category:
                return jsonify({"message": f"Category with ID {new_category_id} not found"}), 404

        changes['category_id'] = {'old': permission.category_id, 'new': new_category_id}
        # For more readable log, get category names if they exist
        old_cat_name = permission.category_obj.name if permission.category_obj else 'None'
        new_cat_name = new_category.name if new_category else 'None'
        changes['category_name'] = {'old': old_cat_name, 'new': new_cat_name}  # Store for description
        permission.category_id = new_category_id

    if new_status is not None and new_status != permission.status:
        if new_status not in ['active', 'inactive']:
            return jsonify({"message": "Invalid status. Must be 'active' or 'inactive'"}), 400
        changes['status'] = {'old': permission.status, 'new': new_status}
        permission.status = new_status

    if not changes:
        return jsonify({"message": "No changes provided for update."}), 200

    try:
        db.session.commit()

        for field, values in changes.items():
            if field == 'category_name':  # Skip logging this specific helper field
                continue

            description_msg = f"Updated permission '{permission.name}' (ID: {permission.id}): changed '{field}'"
            if field == 'category_id':
                description_msg += f" from '{changes['category_name']['old']}' to '{changes['category_name']['new']}'"

            log_audit_event(
                action_type='UPDATE',
                entity_type='Permission',
                entity_id=permission.id,
                field_name=field,
                old_value=values['old'],
                new_value=values['new'],
                description=description_msg
            )
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Failed to update permission: {e}", exc_info=True)
        return jsonify({"message": f"Failed to update permission: {str(e)}"}), 400

    return jsonify({"message": "Permission updated successfully!", "permission": permission.to_json(include_category_details=True)}), 200

@permissions_bp.route("/permissions/<int:permission_id>", methods=["DELETE"])
@login_required
@permission_required('permission.delete')
def delete_permission(permission_id):
    permission = Permission.query.get(permission_id)
    if not permission:
        return jsonify({"message": "Permission not found"}), 404

    # Assuming 'roles' is still the backref for Permission to Role relationships
    if permission.roles.count() > 0:
        return jsonify(
            {"message": f"Cannot delete permission '{permission.name}'. It is assigned to {permission.roles.count()} roles."}
        ), 409

    # Capture permission data before deletion for audit log
    deleted_permission_name = permission.name
    deleted_permission_json = permission.to_json(include_category_details=True)

    try:
        db.session.delete(permission)
        db.session.commit()

        log_audit_event(
            action_type='DELETE',
            entity_type='Permission',
            entity_id=permission_id,  # Use the ID of the deleted permission
            old_value=deleted_permission_json,  # Log the state before deletion
            description=f"Deleted permission '{deleted_permission_name}' (ID: {permission_id})"
        )
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Failed to delete permission: {e}", exc_info=True)
        return jsonify({"message": f"Failed to delete permission: {str(e)}"}), 400

    return jsonify({"message": "Permission deleted successfully!"}), 200