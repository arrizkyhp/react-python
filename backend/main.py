from flask import request, jsonify
from flask_swagger_ui import get_swaggerui_blueprint
from config import app, db
from models import Contact

# ... (Swagger UI configuration remains the same) ...
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


# --- API Endpoints ---

@app.route("/api/contacts", methods=["GET"])
def get_contacts():
    """
    Get a list of contacts.
    ---
    tags:
      - Contact # Add the 'Contact' tag here
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
    # ... (rest of the get_contacts function remains the same) ...

@app.route("/api/create_contact", methods=["POST"])
def create_contact():
    """
    Create a new contact.
    ---
    tags:
      - Contact # Add the 'Contact' tag here
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
    # ... (rest of the create_contact function remains the same) ...

@app.route("/api/update_contact/<int:user_id>", methods=["PATCH"])
def update_contact(user_id):
    """
    Update an existing contact.
    ---
    tags:
      - Contact # Add the 'Contact' tag here
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
    # ... (rest of the update_contact function remains the same) ...

@app.route("/api/delete_contact/<int:user_id>", methods=["DELETE"])
def delete_contact(user_id):
    """
    Delete a contact.
    ---
    tags:
      - Contact # Add the 'Contact' tag here
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
    # ... (rest of the delete_contact function remains the same) ...


# ... (if __name__ == "__main__": block remains the same) ...
if __name__ == "__main__":
    with app.app_context():
        db.create_all()

    app.run(debug=True)

