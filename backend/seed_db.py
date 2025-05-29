import sys
import os

# Add the parent directory to the system path to allow imports like backend.app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.config import create_app, db # Import create_app and db directly
from app.models.user import User # Import specific models
from app.models.role import Role
from app.models.permission import Permission
from app.models.contact import Contact

app = create_app()

with app.app_context():
    db.create_all()
    print("Database tables created (if they didn't exist).")

    print("Seeding database...")

    # --- Create Permissions ---
    permissions_to_create = [
        ('user.manage', 'Can create, edit, delete all users and their roles.', 'User Management', 'active'),
        ('contact.create', 'Can create new contacts.', 'Contact Management', 'active'),
        ('contact.read.own', 'Can read their own contacts.', 'Contact Management', 'active'),
        ('contact.edit.own', 'Can edit their own contacts.', 'Contact Management', 'active'),
        ('contact.delete.own', 'Can delete their own contacts.', 'Contact Management', 'active'),
        ('contact.read.all', 'Can read all contacts.', 'Contact Management', 'active'),
        ('contact.edit.all', 'Can edit all contacts.', 'Contact Management', 'active'),
        ('contact.delete.all', 'Can delete all contacts.', 'Contact Management', 'active'),
        ('role.manage', 'Can create, edit, delete roles and assign permissions to them.', 'Role Management', 'active'),
        ('role.assign_permission', 'Can assign/unassign permissions to/from roles.', 'Role Management', 'active'),
        ('permission.manage', 'Can create, edit, delete individual permissions.', 'Permission Management', 'active'),
        ('permission.read.all', 'Can read all permissions.', 'Permission Management', 'active'),
        ('permission.create', 'Can create new permissions.', 'Permission Management', 'active'),
        ('permission.update', 'Can update existing permissions.', 'Permission Management', 'active'),
        ('permission.delete', 'Can delete permissions.', 'Permission Management', 'active'),
    ]

    for name, desc, category, status in permissions_to_create:
        perm = Permission.query.filter_by(name=name).first()
        if not perm:
            # Pass category and status to the Permission constructor
            perm = Permission(name=name, description=desc, category=category, status=status)
            db.session.add(perm)
            print(f"Created permission: {name} (Category: {category}, Status: {status})")
        else:
            # Check if description, category, or status needs updating
            if perm.description != desc or perm.category != category or perm.status != status:
                perm.description = desc
                perm.category = category
                perm.status = status  # Update status
                db.session.add(
                    perm)  # Re-add to session to mark as dirty (though usually not needed if object is already in session)
                print(f"Updated permission: {name} (Category: {category}, Status: {status})")
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
        # It's better to iterate over the dictionary `all_permissions` directly
        # or use `permissions_to_create` to ensure all intended permissions are checked.
        # Here, we'll iterate through all available permissions by name.
        for perm_name, perm_obj in all_permissions.items():
            # You might want to assign ALL permissions to Admin, regardless of their default status,
            # or only assign 'active' ones. For Admin, typically assign all.
            if perm_obj not in role_admin.permissions:
                role_admin.permissions.append(perm_obj)
                print(f"Assigned {perm_name} to Admin role")

    # User gets only their own contact permissions and create
    if role_user:
        user_perms_names = [
            'contact.create',
            'contact.read.own',
            'contact.edit.own',
            'contact.delete.own'
        ]
        # Iterate over the specific names we want to assign
        for perm_name in user_perms_names:
            perm_obj = all_permissions.get(perm_name)
            if perm_obj:  # Ensure the permission exists in our all_permissions dict
                if perm_obj not in role_user.permissions:
                    role_user.permissions.append(perm_obj)
                    print(f"Assigned {perm_name} to User role")

    db.session.commit()

    # --- Create Default Users ---
    admin_user = User.query.filter_by(username='admin').first()
    if not admin_user:
        admin_user = User(username='admin', email='admin@example.com')
        admin_user.set_password('adminpassword')  # CHANGE THIS FOR PRODUCTION!
        db.session.add(admin_user)
        # Clear existing roles and assign Admin role for idempotency
        # Use len() to check if the collection is not empty
        if len(admin_user.roles) > 0:
            admin_user.roles.clear()
        if role_admin:
            admin_user.roles.append(role_admin)
        print("Created admin user.")
    # Check if admin exists but doesn't have the Admin role, then assign it
    elif role_admin and role_admin not in admin_user.roles:
        admin_user.roles.append(role_admin)
        print("Ensured admin user has Admin role.")


    regular_user = User.query.filter_by(username='user').first()
    if not regular_user:
        regular_user = User(username='user', email='user@example.com')
        regular_user.set_password('userpassword')  # CHANGE THIS FOR PRODUCTION!
        db.session.add(regular_user)
        # Clear existing roles and assign User role for idempotency
        # Use len() to check if the collection is not empty
        if len(regular_user.roles) > 0:
            regular_user.roles.clear()
        if role_user:
            regular_user.roles.append(role_user)
        print("Created regular user.")
    # Check if user exists but doesn't have the User role, then assign it
    elif role_user and role_user not in regular_user.roles:
        regular_user.roles.append(role_user)
        print("Ensured regular user has User role.")


    db.session.commit()
    print("Database seeding complete!")