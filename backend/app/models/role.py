from ..config import db
from .permission import Permission

# Junction table for Role-Permission many-to-many relationship
role_permissions = db.Table(
    'role_permissions',
    db.Column('role_id', db.Integer, db.ForeignKey('roles.id'), primary_key=True),
    db.Column('permission_id', db.Integer, db.ForeignKey('permissions.id'), primary_key=True)
)

class Role(db.Model):
    __tablename__ = "roles"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.String(255), nullable=True)

    # Many-to-many relationship with Permission
    permissions = db.relationship(
        'Permission',
        secondary=role_permissions,
        backref=db.backref('roles', lazy='dynamic')
    )

    def has_permission(self, permission_name):
        """Check if this role has a specific permission."""
        return any(permission.name == permission_name for permission in self.permissions)

    def to_json(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "permissions": [p.to_json() for p in (self.permissions.all() if hasattr(self.permissions, 'all') else self.permissions)] # Handle both dynamic and non-dynamic relationships
        }

    def __repr__(self):
        return f"<Role {self.name}>"
