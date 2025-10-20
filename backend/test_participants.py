#!/usr/bin/env python3
"""Test script for conversation participants functionality"""

import requests
import json

BASE_URL = "http://localhost:5001/api"
AUTH_URL = f"{BASE_URL}/auth"
CONV_URL = f"{BASE_URL}/conversations"


def test_participants():
    """Test the complete participants workflow"""

    # Step 1: Login as john_doe
    print("Step 1: Logging in as john_doe...")
    login_response = requests.post(
        f"{AUTH_URL}/login",
        json={
            "username": "john_doe",
            "password": "password123"
        }
    )

    if login_response.status_code != 200:
        print(f"Login failed: {login_response.json()}")
        return

    token = login_response.json()['token']
    user_id = login_response.json()['user']['id']
    print(f"✓ Login successful! User ID: {user_id}")

    headers = {"Authorization": f"Bearer {token}"}

    # Step 2: Create a new conversation
    print("\nStep 2: Creating a new conversation...")
    create_conv_response = requests.post(
        CONV_URL,
        headers=headers,
        json={"configuration": "1:1"}
    )

    if create_conv_response.status_code != 201:
        print(f"Failed to create conversation: {create_conv_response.json()}")
        return

    conversation_id = create_conv_response.json()['id']
    print(f"✓ Conversation created! ID: {conversation_id}")

    # Step 3: Get list of users to find jane_smith
    print("\nStep 3: Fetching users list...")
    users_response = requests.get(f"{AUTH_URL}/users", headers=headers)

    if users_response.status_code != 200:
        print(f"Failed to fetch users: {users_response.json()}")
        return

    users = users_response.json()['users']
    jane = next((u for u in users if u['username'] == 'jane_smith'), None)

    if not jane:
        print("Could not find jane_smith in users list")
        return

    print(f"✓ Found jane_smith! User ID: {jane['id']}")

    # Step 4: Add jane_smith as a participant
    print(f"\nStep 4: Adding jane_smith (ID: {jane['id']}) as participant...")
    add_participant_response = requests.post(
        f"{CONV_URL}/{conversation_id}/participants",
        headers=headers,
        json={"user_id": jane['id']}
    )

    if add_participant_response.status_code != 201:
        print(f"Failed to add participant: {add_participant_response.json()}")
        return

    print(f"✓ jane_smith added as participant!")
    print(f"  Response: {json.dumps(add_participant_response.json(), indent=2)}")

    # Step 5: Get list of participants
    print(f"\nStep 5: Fetching participants for conversation {conversation_id}...")
    get_participants_response = requests.get(
        f"{CONV_URL}/{conversation_id}/participants",
        headers=headers
    )

    if get_participants_response.status_code != 200:
        print(f"Failed to fetch participants: {get_participants_response.json()}")
        return

    participants = get_participants_response.json()['participants']
    print(f"✓ Found {len(participants)} participant(s):")
    for p in participants:
        print(f"  - {p['username']} (ID: {p['user_id']}, Type: {p['user_type']})")

    # Step 6: Try to add the same user again (should fail)
    print(f"\nStep 6: Trying to add jane_smith again (should fail)...")
    duplicate_response = requests.post(
        f"{CONV_URL}/{conversation_id}/participants",
        headers=headers,
        json={"user_id": jane['id']}
    )

    if duplicate_response.status_code == 409:
        print(f"✓ Correctly rejected duplicate participant: {duplicate_response.json()['error']}")
    else:
        print(f"⚠ Expected 409 error, got {duplicate_response.status_code}")

    # Step 7: Login as jane_smith and verify she can access the conversation
    print("\nStep 7: Logging in as jane_smith to verify participant access...")
    jane_login_response = requests.post(
        f"{AUTH_URL}/login",
        json={
            "username": "jane_smith",
            "password": "password123"
        }
    )

    if jane_login_response.status_code != 200:
        print(f"Jane's login failed: {jane_login_response.json()}")
        return

    jane_token = jane_login_response.json()['token']
    jane_headers = {"Authorization": f"Bearer {jane_token}"}
    print("✓ Jane logged in successfully")

    # Step 8: Verify jane can see the conversation in her conversations list
    print("\nStep 8: Checking if jane can see the conversation...")
    jane_convs_response = requests.get(CONV_URL, headers=jane_headers)

    if jane_convs_response.status_code != 200:
        print(f"Failed to fetch Jane's conversations: {jane_convs_response.json()}")
        return

    jane_convs = jane_convs_response.json()['conversations']
    target_conv = next((c for c in jane_convs if c['id'] == conversation_id), None)

    if target_conv:
        print(f"✓ Jane can see the conversation in her list!")
        print(f"  Conversation: {json.dumps(target_conv, indent=2)}")
    else:
        print("⚠ Jane cannot see the conversation (unexpected)")

    # Step 9: Verify jane can access the conversation details
    print(f"\nStep 9: Checking if jane can access conversation {conversation_id}...")
    jane_conv_details = requests.get(f"{CONV_URL}/{conversation_id}", headers=jane_headers)

    if jane_conv_details.status_code == 200:
        print(f"✓ Jane can access the conversation details!")
    else:
        print(f"⚠ Jane cannot access conversation: {jane_conv_details.json()}")

    # Step 10: Remove jane_smith as participant (back to john_doe)
    print(f"\nStep 10: Removing jane_smith from conversation...")
    remove_participant_response = requests.delete(
        f"{CONV_URL}/{conversation_id}/participants/{jane['id']}",
        headers=headers  # john_doe's token
    )

    if remove_participant_response.status_code != 200:
        print(f"Failed to remove participant: {remove_participant_response.json()}")
        return

    print(f"✓ jane_smith removed from conversation!")

    # Step 11: Verify participant was removed
    print(f"\nStep 11: Verifying participant was removed...")
    verify_participants_response = requests.get(
        f"{CONV_URL}/{conversation_id}/participants",
        headers=headers
    )

    if verify_participants_response.status_code == 200:
        remaining_participants = verify_participants_response.json()['participants']
        print(f"✓ Now {len(remaining_participants)} participant(s) remain")

    # Step 12: Verify jane can no longer access the conversation
    print(f"\nStep 12: Verifying jane can no longer access conversation...")
    jane_access_check = requests.get(f"{CONV_URL}/{conversation_id}", headers=jane_headers)

    if jane_access_check.status_code == 404:
        print(f"✓ Jane correctly denied access: {jane_access_check.json()['error']}")
    else:
        print(f"⚠ Expected 404, got {jane_access_check.status_code}")

    print("\n" + "="*60)
    print("✅ All participant tests completed successfully!")
    print("="*60)


if __name__ == "__main__":
    try:
        test_participants()
    except Exception as e:
        print(f"\n❌ Error during testing: {str(e)}")
        import traceback
        traceback.print_exc()
