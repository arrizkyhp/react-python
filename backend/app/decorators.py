from functools import wraps
from flask import abort, flash, redirect, url_for, request, jsonify
from flask_login import current_user

def permission_required(permission_name):
    """
    Decorator to check if the current user has a specific permission.
    Args:
        permission_name (str): The name of the permission required (e.g., 'user.manage').
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                if request.is_json: # For API requests
                    return jsonify({"message": "Authentication required"}), 401
                flash("You must be logged in to access this page.", "danger")
                return redirect(url_for('auth.login')) # Assuming auth blueprint

            if not current_user.has_permission(permission_name):
                if request.is_json: # For API requests
                    return jsonify({"message": f"Forbidden: You do not have the '{permission_name}' permission."}), 403
                flash(f"You do not have permission to access this page.", "warning")
                abort(403)  # Forbidden

            return f(*args, **kwargs)
        return decorated_function
    return decorator