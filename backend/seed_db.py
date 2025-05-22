import sys
import os

# Add the parent directory to the system path to allow imports like backend.app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app import create_app
from backend.app.config import db
from backend.app.models.user import User # Import specific models
from backend.app.models.role import Role
from backend.app.models.permission import Permission

app = create_app()

with app.app_context():
    print("Seeding database...")

    # --- Create Permissions ---
    permissions_to_create = [
        ('user.manage', 'Can create, edit, delete all users and their roles.', 'User Management'),
        ('contact.create', 'Can create new contacts.', 'Contact Management'),
        ('contact.read.own', 'Can read their own contacts.', 'Contact Management'),
        ('contact.edit.own', 'Can edit their own contacts.', 'Contact Management'),
        ('contact.delete.own', 'Can delete their own contacts.', 'Contact Management'),
        ('contact.read.all', 'Can read all contacts.', 'Contact Management'),
        ('contact.edit.all', 'Can edit all contacts.', 'Contact Management'),
        ('contact.delete.all', 'Can delete all contacts.', 'Contact Management'),
        ('role.manage', 'Can create, edit, delete roles and assign permissions to them.', 'Role Management'),
        ('permission.manage', 'Can create, edit, delete individual permissions.', 'Permission Management')
    ]

    for name, desc, category in permissions_to_create:  # <-- Unpack the new 'category'
        perm = Permission.query.filter_by(name=name).first()
        if not perm:
            # Pass category to the Permission constructor
            perm = Permission(name=name, description=desc, category=category)  # <-- Pass 'category' here
            db.session.add(perm)
            print(f"Created permission: {name} (Category: {category})")
        else:
            if perm.description != desc or perm.category != category:
                perm.description = desc
                perm.category = category
                db.session.add(perm)  # Re-add to session to mark as dirty
                print(f"Updated permission: {name} (Category: {category})")
    db.session.commit()

    # Get all permissions for assignment
    all_permissions = {p.name: p for p in Permission.query.all()}

    # --- Create Roles ---
    role_admin = Role.query.filter_by(name='Admin').first()
    if not role_admin:
        role_admin = Role(name='Admin', description='Administrator with full access.')
        db.session.add(role_admin)
        print("Created role: Admin")

    role_user = Role.query.filter_by(name='User').first()
    if not role_user:
        role_user = Role(name='User', description='Standard user with basic access.')
        db.session.add(role_user)
        print("Created role: User")

    # Commit roles before assigning permissions to ensure they have IDs
    db.session.commit()

    # --- Assign Permissions to Roles ---
    # Admin gets all permissions
    if role_admin:
        for perm_name, _, _ in permissions_to_create:  # Unpack to get just the name for existing check
            if all_permissions[perm_name] not in role_admin.permissions:
                role_admin.permissions.append(all_permissions[perm_name])
                print(f"Assigned {perm_name} to Admin role")

    # User gets only their own contact permissions and create
    if role_user:
        user_perms = [
            'contact.create',
            'contact.read.own',
            'contact.edit.own',
            'contact.delete.own'
        ]
        for perm_name in user_perms:
            if all_permissions.get(perm_name) and all_permissions[perm_name] not in role_user.permissions:
                role_user.permissions.append(all_permissions[perm_name])
                print(f"Assigned {perm_name} to User role")

    db.session.commit()

    # --- Create Default Users ---
    admin_user = User.query.filter_by(username='admin').first()
    if not admin_user:
        admin_user = User(username='admin', email='admin@example.com')
        admin_user.set_password('adminpassword') # CHANGE THIS FOR PRODUCTION!
        db.session.add(admin_user)
        if role_admin and role_admin not in admin_user.roles:
            admin_user.roles.append(role_admin)
        print("Created admin user.")

    regular_user = User.query.filter_by(username='user').first()
    if not regular_user:
        regular_user = User(username='user', email='user@example.com')
        regular_user.set_password('userpassword') # CHANGE THIS FOR PRODUCTION!
        db.session.add(regular_user)
        if role_user and role_user not in regular_user.roles:
            regular_user.roles.append(role_user)
        print("Created regular user.")

    db.session.commit()
    print("Database seeding complete!")