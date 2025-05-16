from backend.app.config import db

class Contact(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(80), unique=False, nullable=False)
    last_name = db.Column(db.String(80), unique=False, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)

    # Optional: Link contacts to a user
    # user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False) # 'users.id' refers to the 'users' table and 'id' column

    def to_json(self):
        return {
            "id": self.id,
            "firstName": self.first_name,
            "lastName": self.last_name,
            "email": self.email,
            # "user_id": self.user_id # if you add user_id
        }