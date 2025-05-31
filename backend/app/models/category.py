from ..config import db

class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)
    description = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(20), default='active', nullable=False)

    # One-to-Many relationship with Permission
    # 'permissions' will be a list of Permission objects associated with this category
    permissions = db.relationship(
        "Permission",
        backref="category_obj",  # Renamed backref to avoid conflict with 'category' attribute
        lazy='dynamic',
        cascade="all, delete-orphan"  # If category is deleted, related permissions might need to be handled
        # (e.g., set their category_id to NULL, or delete them)
        # For now, let's assume setting to NULL is better
        # (modify delete logic to handle this)
    )

    def to_json(self, include_usage=False, include_affected_permissions=False):
        """
        Converts the Category object to a JSON-serializable dictionary.
        Args:
            include_usage (bool): If True, includes 'usage' (count of affected permissions).
            include_affected_permissions (bool): If True, includes 'affected_permissions'
                                                 (list of permission dicts).
        """
        data = {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "status": self.status
        }

        if include_usage or include_affected_permissions:
            # Efficiently count associated permissions
            data["usage"] = self.permissions.count()

            if include_affected_permissions:
                data["affected_permissions"] = [
                    {"id": perm.id, "name": perm.name, "status": perm.status}
                    for perm in self.permissions.all()
                ]
        return data

    def __repr__(self):
        return f"<Category {self.name}>"