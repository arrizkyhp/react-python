from flask import Blueprint, request, jsonify, make_response
from werkzeug.security import check_password_hash
from flask_login import login_user, logout_user, login_required, current_user
from backend.app.models import User, Role # Adjusted import
from backend.app import db # Import db from app package __init__

auth_bp = Blueprint('auth', __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"message": "Missing username, email, or password"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"message": "Username already exists"}), 409 # 409 Conflict

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already registered"}), 409

    new_user = User(username=username, email=email)
    new_user.set_password(password)

    # --- Add this part to assign a default role ---
    default_role = Role.query.filter_by(name='User').first()  # Assuming 'User' is your default role name
    if default_role:
        new_user.roles.append(default_role)
    else:
        # Handle the case where the default role doesn't exist
        print("Warning: Default 'User' role not found in the database.")
        # You might want to return an error or log this situation depending on your application logic

    try:
        db.session.add(new_user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500

    # Optionally log in the user immediately after registration
    login_user(new_user)
    return jsonify({"message": "User registered successfully", "user": new_user.to_json()}), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    if current_user.is_authenticated:
        return jsonify({"message": "Already logged in", "user": current_user.to_json()})

    data = request.get_json()
    identifier = data.get("identifier") # Can be username or email
    password = data.get("password")

    if not identifier or not password:
        return jsonify({"message": "Missing identifier or password"}), 400

    user = User.query.filter((User.username == identifier) | (User.email == identifier)).first()

    if user and user.check_password(password):
        login_user(user, remember=data.get("remember", False)) # 'remember' for persistent sessions
        return jsonify({"message": "Login successful", "user": user.to_json()}), 200
    else:
        return jsonify({"message": "Invalid credentials"}), 401

@auth_bp.route("/logout", methods=["POST"]) # POST is often preferred for logout to prevent CSRF
@login_required # Only logged-in users can logout
def logout():
    logout_user()
    return jsonify({"message": "Logout successful"}), 200

@auth_bp.route("/status", methods=["GET"])
def status():
    if current_user.is_authenticated:
        return jsonify({"logged_in": True, "user": current_user.to_json()}), 200
    else:
        return jsonify({"logged_in": False}), 200

