from backend.app import app, register_blueprints

if __name__ == "__main__":
    register_blueprints()
    app.run(debug=True)