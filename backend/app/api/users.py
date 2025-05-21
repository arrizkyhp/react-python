from collections import OrderedDict
from flask import Blueprint, request, jsonify, make_response
from flask_login import login_required

from backend.app.models import User # Adjusted import
from backend.app import db # Import db from app package __init__

users_bp = Blueprint('users', __name__)

@users_bp.route("/users", methods=["GET"], strict_slashes=False)
@login_required
def get_users():

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)

    pagination = User.query.paginate(
        page=page, per_page=per_page, error_out=False
    )

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

    response_data = OrderedDict([
        ("items", json_users),
        ("pagination", pagination_metadata)
    ])
    response = make_response(jsonify(response_data))

    return response
