from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_login import LoginManager
from flask_migrate import Migrate

db = SQLAlchemy()
login_manager = LoginManager()
migrate = Migrate()

@login_manager.unauthorized_handler
def unauthorized():
    # For API requests, return a 401 Unauthorized JSON response
    # Check if the request expects JSON, or just always return JSON for API blueprints
    # For simplicity here, we'll always return JSON.
    return jsonify(message="Authentication required to access this resource."), 401

def create_app():
    app = Flask(__name__, static_folder="../static")
    CORS(
        app,
        supports_credentials=True,
        origins=["http://localhost:5173", "http://127.0.0.1:5173"]
    )

    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///databaselocal.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = "your_very_secret_key_here"
    
    # Cookie settings for cross-site requests
    app.config["SESSION_COOKIE_SAMESITE"] = "None"
    app.config["SESSION_COOKIE_SECURE"] = True
    app.config["SESSION_COOKIE_HTTPONLY"] = True

    db.init_app(app)
    login_manager.init_app(app)  # Initialize LoginManager with the app
    migrate.init_app(app, db)
    # login_manager.login_view = "auth.login"  # The route name for the login page (we'll create this)
    login_manager.session_protection = "strong"  # Optional: for better security

    # Import models here to avoid circular imports if models need 'db'
    from .models.user import User  # Import User model

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    return app
