from app import  register_blueprints
from app.config import create_app, db
from flask_migrate import Migrate

if __name__ == "__main__":
    app = create_app()

    migrate = Migrate(app, db)

    register_blueprints(app)

    with app.app_context():
        # This will create tables based on your models if they don't exist
        # For more complex migrations, consider Flask-Migrate
        db.create_all()
        print("Database tables created (if they didn't exist).")

    app.run(debug=True)