from backend.app.config import create_app, db
from flask_swagger_ui import get_swaggerui_blueprint

app = create_app()

# --- Swagger UI Configuration ---
SWAGGER_URL = '/swagger'
API_URL = '/static/swagger.json'

swaggerui_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={
        'app_name': "Contact API"
    }
)

app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)


# Create database tables
with app.app_context():
    db.create_all()

def register_blueprints(app_instance): # Pass the app instance
    from backend.app.api.contacts import contacts_bp
    # We will create auth_bp soon
    from backend.app.api.auth import auth_bp # Placeholder for auth blueprint

    app_instance.register_blueprint(contacts_bp, url_prefix="/api/app") # Add a prefix like /api
    app_instance.register_blueprint(auth_bp, url_prefix="/api/auth") # Auth routes