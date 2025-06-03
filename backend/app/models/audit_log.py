from datetime import datetime
from ..config import db # Assuming db is your SQLAlchemy instance
import json

class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    user_id = db.Column(db.BigInteger, db.ForeignKey('users.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    action_type = db.Column(db.String(50), nullable=False) # e.g., 'CREATE', 'UPDATE', 'DELETE'
    entity_type = db.Column(db.String(100), nullable=False) # e.g., 'Category', 'Permission', 'Role'
    entity_id = db.Column(db.Integer, nullable=True) # ID of the record being audited
    field_name = db.Column(db.String(100), nullable=True) # The specific field changed (for UPDATEs)
    old_value = db.Column(db.Text, nullable=True) # Stored as JSON string
    new_value = db.Column(db.Text, nullable=True) # Stored as JSON string
    description = db.Column(db.Text, nullable=True) # Human-readable description
    ip_address = db.Column(db.String(45), nullable=True) # IPv4 or IPv6
    user_agent = db.Column(db.Text, nullable=True)

    # Relationship to User model for easier access to user details
    # Assuming your User model is in `backend.app.models.user`
    user = db.relationship('User', backref='audit_logs', lazy=True)

    def __repr__(self):
        return (
            f"<AuditLog {self.action_type} {self.entity_type}:{self.entity_id} "
            f"by User:{self.user_id} at {self.timestamp}>"
        )

    def to_json(self):
        """Converts the AuditLog object to a JSON-serializable dictionary."""
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "timestamp": self.timestamp.isoformat(),
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
            # e.g., self.user.username, self.user.email, or a to_json() method
            data['user_details'] = {
                'id': self.user.id,
                'username': self.user.username # Or self.user.email, or self.user.to_json()
            }
        return data