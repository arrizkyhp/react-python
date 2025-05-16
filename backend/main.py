from backend.app import app, register_blueprints
from backend.app.config import db

if __name__ == "__main__":
    register_blueprints(app)

    with app.app_context():
        # This will create tables based on your models if they don't exist
        # For more complex migrations, consider Flask-Migrate
        db.create_all()
        print("Database tables created (if they didn't exist).")

    app.run(debug=True)