from collections import OrderedDict
from flask import Blueprint, request, jsonify, make_response
from flask_login import login_required, current_user

from ..models import User, Role # Adjusted import
from ..config import db # Import db from app package __init__
from ..decorators import permission_required

users_bp = Blueprint('users', __name__)

@users_bp.route("/users", methods=["GET"], strict_slashes=False)
@login_required
def get_users():
    get_all = request.args.get("get_all", "false").lower() == "true"
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    status_filter = request.args.get("status")  # Added status filter
    username_search = request.args.get("username_search")  # Added username search
    email_search = request.args.get("email_search")  # Added email search
    role_id_filter = request.args.get("role_id", type=int)  # Filter by role ID
    role_name_filter = request.args.get("role_name")  # Filter by role name

    query = User.query

    # Apply filters based on query parameters
    if status_filter:
        query = query.filter_by(status=status_filter)  # Assuming a 'status' field in User model
    if username_search:
        query = query.filter(User.username.ilike(f"%{username_search}%"))
    if email_search:
        query = query.filter(User.email.ilike(f"%{email_search}%"))
    if role_id_filter:
        query = query.filter(User.roles.any(Role.id == role_id_filter))
    if role_name_filter:
        query = query.filter(User.roles.any(Role.name.ilike(f"%{role_name_filter}%")))

    if get_all:
        users = query.all()
        json_users = list(map(lambda x: x.to_json(), users))
        response_data = {"items": json_users}
        response = make_response(jsonify(response_data))
        return response
    else:
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)

        users = pagination.items
        json_users = list(map(lambda x: x.to_json(), users))

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

        response_data = OrderedDict(
            [("items", json_users), ("pagination", pagination_metadata)]
        )
        response = make_response(jsonify(response_data))

        return response


@users_bp.route("/users/<int:user_id>", methods=["PATCH"])
@login_required
@permission_required('user.manage')  # A new permission to control who can assign roles
def update_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.json

    # --- Existing user update logic (username, email, password) ---
    # You might already have a PATCH endpoint for user updates.
    # If not, add basic fields here.
    new_username = data.get("username")
    new_email = data.get("email")
    new_password = data.get("password")

    if new_username and new_username != user.username:
        existing_user_by_username = User.query.filter(
            User.username == new_username,
            User.id != user_id
        ).first()
        if existing_user_by_username:
            return jsonify({"message": f"Username '{new_username}' already taken"}), 409
        user.username = new_username

    if new_email and new_email != user.email:
        existing_user_by_email = User.query.filter(
            User.email == new_email,
            User.id != user_id
        ).first()
        if existing_user_by_email:
            return jsonify({"message": f"Email '{new_email}' already taken"}), 409
        user.email = new_email

    if new_password:
        user.set_password(new_password)  # Use your set_password method

    # --- Role Assignment Logic ---
    # This is the primary part for assigning roles
    role_ids = data.get("role_ids")  # Expect a list of role IDs in the request body

    if role_ids is not None:  # Only update roles if 'role_ids' key is present
        if not isinstance(role_ids, list):
            return jsonify({"message": "role_ids must be a list of integers"}), 400

        # Ensure all provided role_ids exist
        roles_to_assign = Role.query.filter(Role.id.in_(role_ids)).all()

        # Check if all requested role IDs were found
        if len(roles_to_assign) != len(role_ids):
            # Find which IDs were invalid for a more helpful error
            found_ids = {r.id for r in roles_to_assign}
            invalid_ids = [r_id for r_id in role_ids if r_id not in found_ids]
            return jsonify({"message": f"One or more role IDs are invalid: {invalid_ids}"}), 400

        # Assign the new set of roles. This replaces existing roles.
        # If you want to add/remove roles incrementally, you'd need separate endpoints
        # or more complex logic here (e.g., 'add_role_id', 'remove_role_id' in the JSON)
        user.roles = roles_to_assign

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to update user: {str(e)}"}), 500

    return jsonify({"message": "User updated successfully!", "user": user.to_json()}), 200