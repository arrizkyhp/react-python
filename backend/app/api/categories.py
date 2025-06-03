from flask import Blueprint, request, jsonify, make_response, current_app
from ..config import db
from ..models import Category, Permission # Import Category and Permission
from ..decorators import permission_required
from flask_login import login_required
from ..utils.audit_logger import log_audit_event

categories_bp = Blueprint('categories', __name__)

@categories_bp.route("/categories", methods=["GET"], strict_slashes=False)
@login_required
@permission_required('category.read.all') # New permission for category management
def get_categories():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    include_usage = request.args.get("include_usage", "false").lower() == "true"
    include_affected_permissions = request.args.get("include_affected_permissions", "false").lower() == "true"
    status_filter = request.args.get("status")
    name_search = request.args.get("name_search")

    query = Category.query

    if status_filter:
        query = query.filter_by(status=status_filter)
    if name_search:
        query = query.filter(Category.name.ilike(f"%{name_search}%"))

    pagination = query.paginate(
        page=page, per_page=per_page, error_out=False
    )
    categories = pagination.items
    json_categories = list(map(
        lambda x: x.to_json(
            include_usage=include_usage,
            include_affected_permissions=include_affected_permissions
        ),
        categories
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

    response_data = {"items": json_categories, "pagination": pagination_metadata}
    response = make_response(jsonify(response_data))

    return response

@categories_bp.route("/categories/<int:category_id>", methods=["GET"])
@login_required
@permission_required('category.read.all')
def get_category(category_id):
    include_usage = request.args.get("include_usage", "false").lower() == "true"
    include_affected_permissions = request.args.get("include_affected_permissions", "false").lower() == "true"

    category = Category.query.get(category_id)
    if not category:
        return jsonify({"message": "Category not found"}), 404

    return jsonify(category.to_json(
        include_usage=include_usage,
        include_affected_permissions=include_affected_permissions
    )), 200

@categories_bp.route("/categories", methods=["POST"])
@login_required
@permission_required('category.create')
def create_category():
    name = request.json.get("name")
    description = request.json.get("description")
    status = request.json.get("status", "active")

    if not name:
        return jsonify({"message": "Category name is required"}), 400

    if status not in ['active', 'inactive']:
        return jsonify({"message": "Invalid status. Must be 'active' or 'inactive'"}), 400

    existing_category = Category.query.filter_by(name=name).first()
    if existing_category:
        return jsonify({"message": f"Category '{name}' already exists"}), 409

    new_category = Category(name=name, description=description, status=status)

    try:
        db.session.add(new_category)
        db.session.commit()

        log_audit_event(
            action_type='CREATE',
            entity_type='Category',
            entity_id=new_category.id,
            new_value=new_category.to_json(),  # Log the full new object state
            description=f"Created category '{new_category.name}' (ID: {new_category.id})"
        )

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Failed to create category: {e}", exc_info=True)
        return jsonify({"message": f"Failed to create category: {str(e)}"}), 400

    return jsonify({"message": "Category created successfully!", "category": new_category.to_json()}), 201

@categories_bp.route("/categories/<int:category_id>", methods=["PATCH"])
@login_required
@permission_required('category.update')
def update_category(category_id):
    category = Category.query.get(category_id)
    if not category:
        return jsonify({"message": "Category not found"}), 404

    # Capture old state for audit logging before making any changes
    old_category_data = category.to_json()
    changes = {}  # Dictionary to track what changed for audit log

    data = request.json
    new_name = data.get("name")
    new_description = data.get("description")
    new_status = data.get("status")

    if new_name is not None and new_name != category.name:
        existing_category = Category.query.filter(
            Category.name == new_name,
            Category.id != category_id
        ).first()
        if existing_category:
            return jsonify({"message": f"Category '{new_name}' already exists"}), 409
        changes['name'] = {'old': category.name, 'new': new_name}
        category.name = new_name

    if new_description is not None and new_description != category.description:
        changes['description'] = {'old': category.description, 'new': new_description}
        category.description = new_description

    if new_status is not None and new_status != category.status:
        if new_status not in ['active', 'inactive']:
            return jsonify({"message": "Invalid status. Must be 'active' or 'inactive'"}), 400
        changes['status'] = {'old': category.status, 'new': new_status}
        category.status = new_status

    if not changes:  # No actual changes were made
        return jsonify({"message": "No changes provided for update."}), 200

    try:
        db.session.commit()
        for field, values in changes.items():
            log_audit_event(
                action_type='UPDATE',
                entity_type='Category',
                entity_id=category.id,
                field_name=field,
                old_value=values['old'],
                new_value=values['new'],
                description=f"Updated category '{category.name}' (ID: {category.id}): changed '{field}'"
            )
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Failed to update category: {e}", exc_info=True)
        return jsonify({"message": f"Failed to update category: {str(e)}"}), 400

    return jsonify({"message": "Category updated successfully!", "category": category.to_json()}), 200

@categories_bp.route("/categories/<int:category_id>", methods=["DELETE"])
@login_required
@permission_required('category.delete')
def delete_category(category_id):
    category = Category.query.get(category_id)
    if not category:
        return jsonify({"message": "Category not found"}), 404

    if category.permissions.count() > 0:
        return jsonify(
            {"message": f"Cannot delete category '{category.name}'. It is associated with {category.permissions.count()} permissions. Please reassign or delete these permissions first."}
        ), 409

    # Capture category data before deletion for audit log
    deleted_category_name = category.name
    deleted_category_json = category.to_json()

    try:
        db.session.delete(category)
        db.session.commit()

        log_audit_event(
            action_type='DELETE',
            entity_type='Category',
            entity_id=category_id,  # Use the ID of the deleted category
            old_value=deleted_category_json,  # Log the state before deletion
            description=f"Deleted category '{deleted_category_name}' (ID: {category_id})"
        )

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Failed to delete category: {e}", exc_info=True)
        return jsonify({"message": f"Failed to delete category: {str(e)}"}), 400

    return jsonify({"message": "Category deleted successfully!"}), 200