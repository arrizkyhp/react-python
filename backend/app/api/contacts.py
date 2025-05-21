from flask import Blueprint, request, jsonify, make_response
from backend.app.config import db
from backend.app.models import Contact
from flask_login import login_required, current_user

contacts_bp = Blueprint('contacts', __name__)

@contacts_bp.route("/contacts", methods=["GET"], strict_slashes=False)
@login_required
def get_contacts():
    # If you linked contacts to users:
    # contacts_query = Contact.query.filter_by(user_id=current_user.id)
    # else, it shows all contacts (consider if this is desired for a multi-user app)
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

    response_data = {"items": json_contacts, "pagination": pagination_metadata}
    response = make_response(jsonify(response_data))

    return response

@contacts_bp.route("/contacts", methods=["POST"])
@login_required
def create_contact():
    first_name = request.json.get("firstName")
    last_name = request.json.get("lastName")
    email = request.json.get("email")

    if not first_name or not last_name or not email:
        return (
            jsonify({"message": "You must include a first name, last name and email"}),
            400,
        )

    existing_contact = Contact.query.filter_by(email=email).first()
    if existing_contact:
        return (
            jsonify({"message": "A contact with this email already exists"}),
            409
        )

    new_contact = Contact(first_name=first_name, last_name=last_name, email=email)

    try:
        db.session.add(new_contact)
        db.session.commit()
    except Exception as e:
        return jsonify({"message": str(e)}), 400

    return jsonify({"message": "User Created!"}), 201

@contacts_bp.route("/contacts/<int:contact_id>", methods=["PATCH"])
@login_required
def update_contact(contact_id):
    # If contacts are user-specific, ensure the user owns this contact
    # contact = Contact.query.filter_by(id=contact_id, user_id=current_user.id).first()
    # else:
    contact = Contact.query.get(contact_id)

    if not contact:
        return jsonify({"message": "User not found"}), 404

    data = request.json
    new_email = data.get("email")

    if new_email and new_email != contact.email:
        existing_contact_with_new_email = Contact.query.filter(
            Contact.email == new_email,
            Contact.id != contact_id  # Exclude the current contact being updated
        ).first()
        if existing_contact_with_new_email:
            return jsonify({"message": "A contact with this email already exists"}), 409

    contact.first_name = data.get("firstName", contact.first_name)
    contact.last_name = data.get("lastName", contact.last_name)
    contact.email = data.get("email", contact.email)

    db.session.commit()

    return jsonify({"message": "User Updated"}), 200

@contacts_bp.route("/contacts/<int:contact_id>", methods=["DELETE"])
@login_required
def delete_contact(contact_id):
    contact = Contact.query.get(contact_id)

    if not contact:
        return jsonify({"message": "User not found"}), 404

    db.session.delete(contact)
    db.session.commit()

    return jsonify({"message": "User deleted!"}), 200
