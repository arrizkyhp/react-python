from flask import request, current_app # Import current_app for proper logging
from flask_login import current_user
from ..config import db
from ..models import AuditLog # Relative import to the AuditLog model

import json

def log_audit_event(
    action_type: str,
    entity_type: str,
    entity_id: int = None,
    field_name: str = None,
    old_value: any = None,
    new_value: any = None,
    description: str = None
):
    """
    Logs an audit event to the database.

    Args:
        action_type (str): Type of action (e.g., 'CREATE', 'UPDATE', 'DELETE', 'LOGIN').
        entity_type (str): The type of entity affected (e.g., 'Category', 'Permission').
        entity_id (int, optional): The ID of the specific entity instance affected. Defaults to None.
        field_name (str, optional): The name of the field that was changed (for 'UPDATE'). Defaults to None.
        old_value (any, optional): The value of the field/entity before the change. Defaults to None.
        new_value (any, optional): The value of the field/entity after the change. Defaults to None.
        description (str, optional): A human-readable description of the event. Defaults to None.
    """
    user_id = current_user.id if current_user.is_authenticated else None
    # Use request context safely
    ip_address = request.remote_addr if request else 'N/A'
    user_agent = request.headers.get('User-Agent') if request else 'N/A'

    # Convert old_value/new_value to JSON strings
    old_value_str = json.dumps(old_value, default=str) if old_value is not None else None # default=str handles datetimes
    new_value_str = json.dumps(new_value, default=str) if new_value is not None else None # default=str handles datetimes

    # Construct a default description if not provided
    if not description:
        if action_type == 'CREATE':
            description = f"Created {entity_type} (ID: {entity_id})"
        elif action_type == 'UPDATE':
            if field_name:
                # Attempt to get readable old/new values, handling JSON strings
                old_display = json.loads(old_value_str) if old_value_str else 'N/A'
                new_display = json.loads(new_value_str) if new_value_str else 'N/A'
                if isinstance(old_display, dict): old_display = json.dumps(old_display)
                if isinstance(new_display, dict): new_display = json.dumps(new_display)

                description = (
                    f"Updated {entity_type} (ID: {entity_id}) - "
                    f"'{field_name}' changed from '{old_display}' to '{new_display}'"
                )
            else:
                description = f"Updated {entity_type} (ID: {entity_id})"
        elif action_type == 'DELETE':
            description = f"Deleted {entity_type} (ID: {entity_id})"
        else:
            description = f"{action_type} action on {entity_type}"

    audit_log_entry = AuditLog(
        user_id=user_id,
        action_type=action_type,
        entity_type=entity_type,
        entity_id=entity_id,
        field_name=field_name,
        old_value=old_value_str,
        new_value=new_value_str,
        description=description,
        ip_address=ip_address,
        user_agent=user_agent
    )

    try:
        db.session.add(audit_log_entry)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        # Use Flask's app.logger for consistent logging within your application
        current_app.logger.error(f"Error logging audit event: {e}", exc_info=True)