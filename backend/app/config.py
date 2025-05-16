from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_login import LoginManager

db = SQLAlchemy()
login_manager = LoginManager()

@login_manager.unauthorized_handler
def unauthorized():
    # For API requests, return a 401 Unauthorized JSON response
    # Check if the request expects JSON, or just always return JSON for API blueprints
    # For simplicity here, we'll always return JSON.
    return jsonify(message="Authentication required to access this resource."), 401

def create_app():
    app = Flask(__name__, static_folder="../static")
    CORS(app, supports_credentials=True)

    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///databaselocal.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = "your_very_secret_key_here"

    db.init_app(app)
    login_manager.init_app(app)  # Initialize LoginManager with the app
    # login_manager.login_view = "auth.login"  # The route name for the login page (we'll create this)
    login_manager.session_protection = "strong"  # Optional: for better security

    # Import models here to avoid circular imports if models need 'db'
    from backend.app.models.user import User  # Import User model

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    return app

