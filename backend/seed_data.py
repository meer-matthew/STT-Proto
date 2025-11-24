"""
Seed the database with initial data
"""
from app import create_app, db
from app.models import User, Role, UserRole, Conversation, Message
from datetime import datetime

# Seeded user credentials for reference
SEEDED_USERS = {
    'john_doe', 'jane_smith', 'erwin_meer', 'gotoh',
    'alice_care', 'matthew_meer', 'james_dean'
}

def clear_user_data():
    """Clear only user-created conversations and messages, keeping seeded data"""
    print("Clearing user-created data (conversations and messages)...")
    try:
        # Get all conversations
        all_convos = Conversation.query.all()
        deleted_count = 0

        for convo in all_convos:
            # Get conversation owner
            owner = User.query.get(convo.user_id)

            # Delete only if owner is a seeded user
            if owner and owner.username in SEEDED_USERS:
                # Delete messages in this conversation
                Message.query.filter_by(conversation_id=convo.id).delete()
                # Delete the conversation
                db.session.delete(convo)
                deleted_count += 1

        db.session.commit()
        print(f"✅ Cleared {deleted_count} seeded conversations and their messages")
    except Exception as e:
        db.session.rollback()
        print(f"⚠️  Error clearing data: {e}")

def seed_database(clear_first=False):
    app = create_app()

    with app.app_context():
        print("Creating database tables...")
        db.create_all()

        # Clear user-created data if requested
        if clear_first:
            clear_user_data()

        # Check if seed data already exists
        if Role.query.first() and User.query.filter_by(username='john_doe').first():
            print("Database already seeded. Skipping initial setup...")
        else:
            print("Seeding roles...")
            # Create roles
            user_role = Role(name='user', description='Regular user of the application')
            caregiver_role = Role(name='caregiver', description='Caregiver assisting users')
            admin_role = Role(name='admin', description='Administrator with full access')

            db.session.add_all([user_role, caregiver_role, admin_role])
            db.session.commit()

            print("Seeding sample users...")
            # Create sample users with passwords and gender
            user1 = User(username='john_doe', email='john@example.com', user_type='user', gender='male')
            user1.set_password('password123')

            user2 = User(username='jane_smith', email='jane@example.com', user_type='user', gender='female')
            user2.set_password('password123')
            user3 = User(username='erwin_meer', email='erwin@example.com', user_type='user', gender='male')
            user3.set_password('password123')
            user4 = User(username='gotoh', email='gotoh@example.com', user_type='user', gender='male')
            user4.set_password('password123')

            caregiver1 = User(username='alice_care', email='alice@example.com', user_type='caretaker', gender='female')
            caregiver1.set_password('password123')
            caregiver2 = User(username='matthew_meer', email='matthew@example.com', user_type='caretaker', gender='male')
            caregiver2.set_password('password123')
            caregiver3 = User(username='james_dean', email='james@example.com', user_type='caretaker', gender='male')
            caregiver3.set_password('password123')
            db.session.add_all([user1, user2, user3, user4, caregiver1, caregiver2, caregiver3])
            db.session.commit()

            print("Assigning roles...")
            # Assign roles
            user_role1 = UserRole(user_id=user1.id, role_id=user_role.id)
            user_role2 = UserRole(user_id=user2.id, role_id=user_role.id)
            user_role3 = UserRole(user_id=user3.id, role_id=user_role.id)
            user_role4 = UserRole(user_id=user4.id, role_id=user_role.id)

            caregiver_role1 = UserRole(user_id=caregiver1.id, role_id=caregiver_role.id)
            caregiver_role2 = UserRole(user_id=caregiver2.id, role_id=caregiver_role.id)
            caregiver_role3 = UserRole(user_id=caregiver3.id, role_id=caregiver_role.id)

            db.session.add_all([user_role1, user_role2, user_role3, user_role4, caregiver_role1, caregiver_role2, caregiver_role3])
            db.session.commit()

        print("✅ Database seeded successfully!")
        print(f"Created {User.query.count()} users")
        print(f"Created {Role.query.count()} roles")

if __name__ == '__main__':
    import sys
    clear_first = '--clear' in sys.argv or '-c' in sys.argv
    seed_database(clear_first=clear_first)
