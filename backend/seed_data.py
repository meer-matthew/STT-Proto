"""
Seed the database with initial data
"""
from app import create_app, db
from app.models import User, Role, UserRole, Conversation, Message
from datetime import datetime

def seed_database():
    app = create_app()

    with app.app_context():
        print("Creating database tables...")
        db.create_all()

        # Check if data already exists
        if Role.query.first():
            print("Database already seeded. Skipping...")
            return

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

        print("Creating sample conversations...")
        # Create sample conversations
        conv1 = Conversation(user_id=user1.id, configuration='1:1')
        conv2 = Conversation(user_id=user2.id, configuration='2:1')

        db.session.add_all([conv1, conv2])
        db.session.commit()

        print("Creating sample messages...")
        # Create sample messages
        msg1 = Message(
            conversation_id=conv1.id,
            sender=user1.username,
            sender_type='user',
            message='Hello, this is my first message!',
            has_audio=False
        )
        msg2 = Message(
            conversation_id=conv1.id,
            sender='alice_care',
            sender_type='caregiver',
            message='Hi! How can I help you today?',
            has_audio=False
        )
        msg3 = Message(
            conversation_id=conv2.id,
            sender=user2.username,
            sender_type='user',
            message='Testing speech to text',
            has_audio=True
        )

        db.session.add_all([msg1, msg2, msg3])
        db.session.commit()

        print("✅ Database seeded successfully!")
        print(f"Created {User.query.count()} users")
        print(f"Created {Role.query.count()} roles")
        print(f"Created {Conversation.query.count()} conversations")
        print(f"Created {Message.query.count()} messages")

if __name__ == '__main__':
    seed_database()
