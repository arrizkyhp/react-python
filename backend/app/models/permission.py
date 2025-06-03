from ..config import db

class Permission(db.Model):
    __tablename__ = "permissions"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)  # e.g., 'user.create', 'contact.edit.own'
    description = db.Column(db.String(255), nullable=True)
    category_id = db.Column(
        db.Integer,
        db.ForeignKey('categories.id', name='fk_permissions_category_id'),
        nullable=True
    )
    status = db.Column(db.String(20), default='active', nullable=False)

    # `category` property will now refer to the Category object
    # The backref 'category_obj' from the Category model links this
    # category = db.relationship("Category", backref="permissions") # This line is implicitly handled by backref on Category

    # Existing backref for roles (assuming it's defined in Role model)
    # roles = db.relationship('Role', secondary=role_permission_table, back_populates='permissions')

    def to_json(self, include_usage=False, include_category_details=False):
        """
        Converts the Permission object to a JSON-serializable dictionary.
        Args:
            include_usage (bool): If True, includes 'usage' (count of affected roles)
                                  and 'affected_roles' (list of role dicts).
            include_category_details (bool): If True, includes the associated category's details.
        """
        data = {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category_id": self.category_id,
            "status": self.status
        }

        if include_category_details and self.category_obj:  # Use category_obj from the backref
            data["category"] = {
                "id": self.category_obj.id,
                "name": self.category_obj.name,
                "description": self.category_obj.description
            }
        elif self.category_id and not self.category_obj:
            # Handle case where category_id exists but object couldn't be loaded (e.g., category deleted)
            data["category"] = {"id": self.category_id, "name": "Category Not Found", "description": None}
        else:
            data["category"] = None  # No category associated

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
