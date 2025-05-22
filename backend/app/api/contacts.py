from flask import Blueprint, request, jsonify, make_response
from backend.app.config import db
from backend.app.models import Contact
from backend.app.decorators import permission_required
from flask_login import login_required, current_user

contacts_bp = Blueprint('contacts', __name__)

@contacts_bp.route("/contacts", methods=["GET"], strict_slashes=False)
@login_required
def get_contacts():
    # Determine which contacts the user can see based on permissions
    contacts_query = None

    if current_user.has_permission('contact.read.all'):
        # Admin or user with 'read.all' can see all contacts
        contacts_query = Contact.query
    elif current_user.has_permission('contact.read.own'):
        # Regular user with 'read.own' can only see their own contacts
        contacts_query = Contact.query.filter_by(user_id=current_user.id)
    else:
        # If no relevant permission, deny access
        # The permission_required decorator is typically for explicit route-level checks
        # For internal logic, direct `has_permission` checks are needed.
        return jsonify({"message": "Forbidden: You do not have permission to view contacts."}), 403

    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)

    pagination = contacts_query.paginate(
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
@permission_required('contact.create')
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

    new_contact = Contact(
        first_name=first_name,
        last_name=last_name,
        email=email,
        user_id=current_user.id
    )

    try:
        db.session.add(new_contact)
        db.session.commit()
    except Exception as e:
        return jsonify({"message": str(e)}), 400

    return jsonify({"message": "Contact created successfully!", "contact": new_contact.to_json()}), 201

@contacts_bp.route("/contacts/<int:contact_id>", methods=["PATCH"])
@login_required
def update_contact(contact_id):
    # If contacts are user-specific, ensure the user owns this contact
    # contact = Contact.query.filter_by(id=contact_id, user_id=current_user.id).first()
    # else:
    contact = Contact.query.get(contact_id)

    if not contact:
        return jsonify({"message": "User not found"}), 404

    # Authorization logic for update
    if current_user.has_permission('contact.edit.all'):
        # User has permission to edit any contact (e.g., Admin)
        pass
    elif current_user.has_permission('contact.edit.own') and contact.user_id == current_user.id:
        # User has permission to edit their own contacts AND it is their contact
        pass
    else:
        # User does not have the required permission or does not own the contact
        return jsonify({"message": "Forbidden: You don't have permission to update this contact."}), 403

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

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to update contact: {str(e)}"}), 400

    return jsonify({"message": "Contact updated successfully!", "contact": contact.to_json()}), 200

@contacts_bp.route("/contacts/<int:contact_id>", methods=["DELETE"])
@login_required
def delete_contact(contact_id):
    contact = Contact.query.get(contact_id)

    if not contact:
        return jsonify({"message": "User not found"}), 404

    if current_user.has_permission('contact.delete.all'):
        # User has permission to delete any contact (e.g., Admin)
        pass
    elif current_user.has_permission('contact.delete.own') and contact.user_id == current_user.id:
        # User has permission to delete their own contacts AND it is their contact
        pass
    else:
        # User does not have the required permission or does not own the contact
        return jsonify({"message": "Forbidden: You don't have permission to delete this contact."}), 403

    try:
        db.session.delete(contact)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Failed to delete contact: {str(e)}"}), 400

    return jsonify({"message": "Contact deleted successfully!"}), 200
