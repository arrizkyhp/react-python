from ..config import db

class Permission(db.Model):
    __tablename__ = "permissions"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)  # e.g., 'user.create', 'contact.edit.own'
    description = db.Column(db.String(255), nullable=True)
    category = db.Column(db.String(80), nullable=True)
    status = db.Column(db.String(20), default='active', nullable=False)

    def to_json(self, include_usage=False):
        """
        Converts the Permission object to a JSON-serializable dictionary.
        Args:
            include_usage (bool): If True, includes 'usage' (count of affected roles)
                                  and 'affected_roles' (list of role dicts).
        """
        data = {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "status": self.status
        }

        # --- FOR USAGE TRACKING ---
        if include_usage:
            # `self.roles` is available due to the backref in the Role model's relationship
            data["usage"] = self.roles.count()  # Efficiently count associated roles
            # Fetch and format affected roles if requested
            data["affected_roles"] = [
                {"id": role.id, "name": role.name} for role in self.roles.all()
            ]
        # --- END NEW ADDITION ---
        return data

    def __repr__(self):
        return f"<Permission {self.name}>"
