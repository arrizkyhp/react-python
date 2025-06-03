from datetime import datetime, timezone
from ..config import db  # Assuming db is your SQLAlchemy instance
import json


class AuditLog(db.Model):
    __tablename__ = "audit_logs"


    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    action_type = db.Column(db.String(50), nullable=False)  # e.g., 'CREATE', 'UPDATE', 'DELETE'
    entity_type = db.Column(db.String(100), nullable=False)  # e.g., 'Category', 'Permission', 'Role'
    entity_id = db.Column(db.Integer, nullable=True)  # ID of the record being audited
    field_name = db.Column(db.String(100), nullable=True)  # The specific field changed (for UPDATEs)
    old_value = db.Column(db.Text, nullable=True)  # Stored as JSON string
    new_value = db.Column(db.Text, nullable=True)  # Stored as JSON string
    description = db.Column(db.Text, nullable=True)  # Human-readable description
    ip_address = db.Column(db.String(45), nullable=True)  # IPv4 or IPv6
    user_agent = db.Column(db.Text, nullable=True)

    # Relationship to User model for easier access to user details
    user = db.relationship('User', backref='audit_logs', lazy=True)

    def __repr__(self):
        return (
            f"<AuditLog {self.action_type} {self.entity_type}:{self.entity_id} "
            f"by User:{self.user_id} at {self.timestamp}>"
        )

    def to_json(self):
        """Converts the AuditLog object to a JSON-serializable dictionary."""
        utc_aware_timestamp = self.timestamp
        if utc_aware_timestamp.tzinfo is None:
            # If naive, assume it's UTC because that's what we store
            utc_aware_timestamp = utc_aware_timestamp.replace(tzinfo=timezone.utc)
        else:
            # If already timezone-aware, convert to UTC explicitly
            utc_aware_timestamp = utc_aware_timestamp.astimezone(timezone.utc)

        # Format to ISO 8601 string, with milliseconds and 'Z' for UTC
        # Example: "2025-06-03T08:15:59.123Z"
        timestamp_iso_utc = utc_aware_timestamp.isoformat(timespec='milliseconds').replace('+00:00', 'Z')

        data = {
            "id": self.id,
            "user_id": self.user_id,
            "timestamp": timestamp_iso_utc,
            "action_type": self.action_type,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "field_name": self.field_name,
            "old_value": json.loads(self.old_value) if self.old_value else None,
            "new_value": json.loads(self.new_value) if self.new_value else None,
            "description": self.description,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent
        }
        if self.user:
            # IMPORTANT: Adjust this based on what 'User' attribute you want to display
            data['user_details'] = {
                'id': self.user.id,
                'username': getattr(self.user, 'username', None) or getattr(self.user, 'email', 'Unknown')
            }
        return data
