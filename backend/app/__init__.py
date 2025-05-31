from flask_swagger_ui import get_swaggerui_blueprint
from flask_migrate import Migrate
from .config import create_app, db

# app = create_app()
# migrate = Migrate(app, db)

# Make app available for Flask CLI
# cli = app.cli

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


def register_blueprints(app_instance): # Pass the app instance
    from .api.contacts import contacts_bp
    from .api.auth import auth_bp # Placeholder for auth blueprint
    from .api.users import users_bp
    from .api.roles import roles_bp
    from .api.permissions import permissions_bp
    from .api.categories import categories_bp

    app_instance.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)
    app_instance.register_blueprint(contacts_bp, url_prefix="/api/app")
    app_instance.register_blueprint(users_bp, url_prefix="/api/app")
    app_instance.register_blueprint(roles_bp, url_prefix="/api/app")
    app_instance.register_blueprint(permissions_bp, url_prefix="/api/app")
    app_instance.register_blueprint(categories_bp, url_prefix="/api/app")
    app_instance.register_blueprint(auth_bp, url_prefix="/api/auth") # Auth routes
