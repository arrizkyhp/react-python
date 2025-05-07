from flask import request, jsonify
from flask_swagger_ui import get_swaggerui_blueprint # Import Flask-Swagger-UI
from config import app, db
from models import Contact

# --- Swagger UI Configuration ---
SWAGGER_URL = '/swagger'
API_URL = '/static/swagger.json' # We will create this file

swaggerui_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={
        'app_name': "Contact API"
    }
)

app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

# --- API Endpoints ---

@app.route("/api/contacts", methods=["GET"])
def get_contacts():
    """
    Get a list of contacts.
    ---
    parameters:
      - name: page
        in: query
        type: integer
        description: Page number for pagination.
        default: 1
      - name: per_page
        in: query
        type: integer
        description: Number of items per page.
        default: 10
    responses:
      200:
        description: A list of contacts and pagination information.
        schema:
          type: object
          properties:
            contacts:
              type: array
              items:
                $ref: '#/definitions/Contact'
            pagination:
              type: object
              properties:
                total_items:
                  type: integer
                total_pages:
                  type: integer
                current_page:
                  type: integer
                per_page:
                  type: integer
                has_next:
                  type: boolean
                has_prev:
                  type: boolean
                next_num:
                  type: integer
                  nullable: true
                prev_num:
                  type: integer
                  nullable: true
    """
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)

    pagination = Contact.query.paginate(
        page=page, per_page=per_page, error_out=False
    )
    contacts = pagination.items
    json_contacts = list(map(lambda x: x.to_json(), contacts))

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

    return jsonify({"contacts": json_contacts, "pagination": pagination_metadata})

@app.route("/api/create_contact", methods=["POST"])
def create_contact():
    """
    Create a new contact.
    ---
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - firstName
            - lastName
            - email
          properties:
            firstName:
              type: string
              description: The first name of the contact.
            lastName:
              type: string
              description: The last name of the contact.
            email:
              type: string
              description: The email address of the contact (must be unique).
    responses:
      201:
        description: User Created!
        schema:
          type: object
          properties:
            message:
              type: string
      400:
        description: Invalid input or email already exists.
        schema:
          type: object
          properties:
            message:
              type: string
    """
    first_name = request.json.get("firstName")
    last_name = request.json.get("lastName")
    email = request.json.get("email")

    if not first_name or not last_name or not email:
        return (
            jsonify({"message": "You must include a first name, last name and email"}),
            400,
        )

    new_contact = Contact(first_name=first_name, last_name=last_name, email=email)

    try:
        db.session.add(new_contact)
        db.session.commit()
    except Exception as e:
        return jsonify({"message": str(e)}), 400

    return jsonify({"message": "User Created!"}), 201

@app.route("/api/update_contact/<int:user_id>", methods=["PATCH"])
def update_contact(user_id):
    """
    Update an existing contact.
    ---
    parameters:
      - name: user_id
        in: path
        type: integer
        required: true
        description: The ID of the contact to update.
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            firstName:
              type: string
              description: The updated first name of the contact.
            lastName:
              type: string
              description: The updated last name of the contact.
            email:
              type: string
              description: The updated email address of the contact (must be unique).
    responses:
      200:
        description: User Updated.
        schema:
          type: object
          properties:
            message:
              type: string
      404:
        description: User not found.
        schema:
          type: object
          properties:
            message:
              type: string
    """
    contact = Contact.query.get(user_id)

    if not contact:
        return jsonify({"message": "User not found"}), 404

    data = request.json
    contact.first_name = data.get("firstName", contact.first_name)
    contact.last_name = data.get("lastName", contact.last_name)
    contact.email = data.get("email", contact.email)

    db.session.commit()

    return jsonify({"message": "User Updated"}), 200

@app.route("/api/delete_contact/<int:user_id>", methods=["DELETE"])
def delete_contact(user_id):
    """
    Delete a contact.
    ---
    parameters:
      - name: user_id
        in: path
        type: integer
        required: true
        description: The ID of the contact to delete.
    responses:
      200:
        description: User deleted!
        schema:
          type: object
          properties:
            message:
              type: string
      404:
        description: User not found.
        schema:
          type: object
          properties:
            message:
              type: string
    """
    contact = Contact.query.get(user_id)

    if not contact:
        return jsonify({"message": "User not found"}), 404

    db.session.delete(contact)
    db.session.commit()

    return jsonify({"message": "User deleted!"}), 200

# --- Swagger Definitions (used in schemas) ---


if __name__ == "__main__":
    with app.app_context():
        db.create_all()

    app.run(debug=True)
