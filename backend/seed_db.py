import sys
import os

# Add the parent directory to the system path to allow imports like app.config
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.config import create_app, db # Import create_app and db directly
from app.models.user import User # Import specific models
from app.models.role import Role
from app.models.permission import Permission
from app.models.category import Category # Import the new Category model!
from app.models.contact import Contact # Assuming you have a Contact model

app = create_app()

with app.app_context():
    db.create_all()
    print("Database tables created (if they didn't exist).")

    print("Seeding database...")

    # --- Define Categories to Create ---
    categories_to_create = [
        ('User Management', 'Permissions related to managing users.'),
        ('Contact Management', 'Permissions related to managing contacts.'),
        ('Role Management', 'Permissions related to managing user roles.'),
        ('Permission Management', 'Permissions related to managing system permissions.'),
        ('Category Management', 'Permissions related to managing permission categories.'), # New category
    ]

    # --- Create Categories ---
    # Store category objects in a dictionary for easy lookup by name
    category_map = {}
    for name, desc in categories_to_create:
        category = Category.query.filter_by(name=name).first()
        if not category:
            category = Category(name=name, description=desc, status='active')
            db.session.add(category)
            print(f"Created category: {name}")
        else:
            # Update description if it changed
            if category.description != desc:
                category.description = desc
                db.session.add(category)
                print(f"Updated category: {name}")
        category_map[name] = category # Map name to the Category object

    db.session.commit() # Commit categories so they get IDs before permissions are linked

    # --- Define Permissions ---
    # Note: 'category' here refers to the category name string, which we will look up.
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
        # New permissions for Category Management
        ('category.read.all', 'Can read all permission categories.', 'Category Management', 'active'),
        ('category.create', 'Can create new permission categories.', 'Category Management', 'active'),
        ('category.update', 'Can update existing permission categories.', 'Category Management', 'active'),
        ('category.delete', 'Can delete permission categories.', 'Category Management', 'active'),
    ]

    # --- Create Permissions ---
    for name, desc, category_name, status in permissions_to_create:
        perm = Permission.query.filter_by(name=name).first()

        # Get the Category object using the category_name
        category_obj = category_map.get(category_name)
        if not category_obj:
            print(f"WARNING: Category '{category_name}' not found for permission '{name}'. Skipping category assignment.")
            category_id_to_assign = None
        else:
            category_id_to_assign = category_obj.id

        if not perm:
            # Assign category_id directly
            perm = Permission(name=name, description=desc, category_id=category_id_to_assign, status=status)
            db.session.add(perm)
            print(f"Created permission: {name} (Category ID: {category_id_to_assign}, Status: {status})")
        else:
            # Check if description, category_id, or status needs updating
            if (perm.description != desc or
                perm.category_id != category_id_to_assign or # Check category_id
                perm.status != status):
                perm.description = desc
                perm.category_id = category_id_to_assign # Update category_id
                perm.status = status
                db.session.add(perm) # Re-add to session to mark as dirty
                print(f"Updated permission: {name} (Category ID: {category_id_to_assign}, Status: {status})")
    db.session.commit()

    # Get all permissions for assignment (re-fetch after creation/update)
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

    db.session.commit() # Commit roles before assigning permissions to ensure they have IDs

    # --- Assign Permissions to Roles ---
    # Admin gets all permissions
    if role_admin:
        permissions_to_assign_to_admin = list(all_permissions.values()) # Assign ALL permissions
        current_admin_permissions_names = {p.name for p in role_admin.permissions}

        for perm_obj in permissions_to_assign_to_admin:
            if perm_obj.name not in current_admin_permissions_names:
                role_admin.permissions.append(perm_obj)
                print(f"Assigned {perm_obj.name} to Admin role")

    # User gets only their own contact permissions and create
    if role_user:
        user_perms_names = [
            'contact.create',
            'contact.read.own',
            'contact.edit.own',
            'contact.delete.own'
        ]
        current_user_permissions_names = {p.name for p in role_user.permissions}

        for perm_name in user_perms_names:
            perm_obj = all_permissions.get(perm_name)
            if perm_obj and perm_obj.name not in current_user_permissions_names: # Ensure permission exists and is not already assigned
                role_user.permissions.append(perm_obj)
                print(f"Assigned {perm_name} to User role")

    db.session.commit()

    # --- Create Default Users ---
    admin_user = User.query.filter_by(username='admin').first()
    if not admin_user:
        admin_user = User(username='admin', email='admin@example.com')
        admin_user.set_password('adminpassword')  # CHANGE THIS FOR PRODUCTION!
        db.session.add(admin_user)
        print("Created admin user.")

    # Always ensure admin user has the Admin role (for idempotency)
    if role_admin and role_admin not in admin_user.roles:
        admin_user.roles.append(role_admin)
        print("Ensured admin user has Admin role.")

    regular_user = User.query.filter_by(username='user').first()
    if not regular_user:
        regular_user = User(username='user', email='user@example.com')
        regular_user.set_password('userpassword')  # CHANGE THIS FOR PRODUCTION!
        db.session.add(regular_user)
        print("Created regular user.")

    # Always ensure regular user has the User role (for idempotency)
    if role_user and role_user not in regular_user.roles:
        regular_user.roles.append(role_user)
        print("Ensured regular user has User role.")

    db.session.commit()
    print("Database seeding complete!")