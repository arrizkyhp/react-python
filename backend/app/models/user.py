from ..config import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from .role import Role

# Junction table for User-Role many-to-many relationship
user_roles = db.Table(
    'user_roles',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('role_id', db.Integer, db.ForeignKey('roles.id'), primary_key=True)
)

class User(UserMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)

    # Relationships (optional, but good for future use)
    # contacts = db.relationship('Contact', backref='owner', lazy=True) # If contacts belong to users

    # Many-to-many relationship with Role
    roles = db.relationship(
        'Role',
        secondary=user_roles,
        backref=db.backref('users', lazy='dynamic')
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def has_permission(self, permission_name):
        """Check if the user has a specific permission via their roles."""
        for role in self.roles:
            if role.has_permission(permission_name):
                return True
        return False

    def is_admin(self):
        """Helper to quickly check if user has 'Admin' role, if needed."""
        return any(role.name == 'Admin' for role in self.roles)

    def to_json(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "roles": [role.to_json() for role in self.roles]
            # Do NOT include password_hash in JSON responses
        }

    def __repr__(self):
        return f"<User {self.username}>"
