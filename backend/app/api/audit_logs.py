from flask import Blueprint, request, jsonify, make_response
from flask_login import login_required
from ..decorators import permission_required # Your custom permission decorator
from ..config import db
from ..models import AuditLog, User # Import AuditLog, User, and db from your config
from sqlalchemy import desc, or_ # For sorting and advanced filtering

audit_logs_bp = Blueprint('audit_logs', __name__)

@audit_logs_bp.route("/audit-logs", methods=["GET"], strict_slashes=False)
@login_required
@permission_required('audit.read.all') # Define a new permission for viewing audit logs
def get_audit_logs():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)

    # --- Filtering Parameters from UI ---
    entity_type_filter = request.args.get("entity_type") # e.g., 'Category', 'Permission'
    entity_id_filter = request.args.get("entity_id", type=int) # Filter for specific entity ID
    action_type_filter = request.args.get("action_type") # e.g., 'CREATE', 'UPDATE', 'DELETE'
    user_id_filter = request.args.get("user_id", type=int) # Filter by user who performed action
    search_query = request.args.get("search") # General search box (user, description, entity type)

    query = AuditLog.query.join(User) # Always join with User to get username for display/filter

    if entity_type_filter:
        query = query.filter(AuditLog.entity_type.ilike(f"%{entity_type_filter}%"))
    if entity_id_filter:
        query = query.filter_by(entity_id=entity_id_filter)
    if action_type_filter:
        query = query.filter(AuditLog.action_type.ilike(f"%{action_type_filter}%"))
    if user_id_filter:
        query = query.filter_by(user_id=user_id_filter)

    if search_query:
        # Search across relevant textual fields
        query = query.filter(
            or_(
                User.username.ilike(f"%{search_query}%"), # Search by username
                AuditLog.description.ilike(f"%{search_query}%"), # Search by description
                AuditLog.entity_type.ilike(f"%{search_query}%"), # Search by entity type
                AuditLog.field_name.ilike(f"%{search_query}%"), # Search by field name
                # You could also add search on old_value/new_value if useful, but needs care for JSON text
            )
        )

    # --- Sorting Parameters from UI ---
    sort_by = request.args.get("sort_by", "timestamp") # Default sort by timestamp
    sort_order = request.args.get("sort_order", "desc") # Default sort order descending ('desc' or 'asc')

    if sort_by == "date":
        order_column = AuditLog.timestamp
    elif sort_by == "user":
        order_column = User.username # Sort by User's username
    elif sort_by == "action":
        order_column = AuditLog.action_type
    elif sort_by == "entity":
        order_column = AuditLog.entity_type
    else: # Fallback to default if sort_by is invalid
        order_column = AuditLog.timestamp

    if sort_order == "desc":
        query = query.order_by(desc(order_column))
    else:
        query = query.order_by(order_column)

    # --- Pagination ---
    pagination = query.paginate(
        page=page, per_page=per_page, error_out=False
    )
    audit_logs = pagination.items
    json_audit_logs = [log.to_json() for log in audit_logs]

    # --- Prepare response metadata ---
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

    response_data = {"items": json_audit_logs, "pagination": pagination_metadata}
    response = make_response(jsonify(response_data))

    return response