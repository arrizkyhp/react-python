from ..config import db

class Contact(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(80), unique=False, nullable=False)
    last_name = db.Column(db.String(80), unique=False, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)

    # REQUIRED: Link contacts to a user
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # The `user` relationship will be defined in the User model using backref,
    # so you don't typically need db.relationship('User', backref='contacts') here
    # if it's already in the User model.

    def to_json(self):
        return {
            "id": self.id,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "email": self.email,
            "user_id": self.user_id
        }

    def __repr__(self):
        return f"<Contact {self.first_name} {self.last_name} (Owner: {self.user_id})>"
