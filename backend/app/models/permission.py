from ..config import db

class Permission(db.Model):
    __tablename__ = "permissions"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)  # e.g., 'user.create', 'contact.edit.own'
    description = db.Column(db.String(255), nullable=True)
    category = db.Column(db.String(80), nullable=True)

    def to_json(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category": self.category
        }

    def __repr__(self):
        return f"<Permission {self.name}>"
