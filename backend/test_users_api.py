#!/usr/bin/env python3
"""Test script for the users API endpoint"""

import requests
import json

BASE_URL = "http://localhost:5001/api/auth"

def test_users_endpoint():
    # Step 1: Login to get token
    print("Step 1: Logging in...")
    login_response = requests.post(
        f"{BASE_URL}/login",
        json={
            "username": "john_doe",
            "password": "password123"
        }
    )

    if login_response.status_code != 200:
        print(f"Login failed: {login_response.json()}")
        return

    token = login_response.json()['token']
    print(f"Login successful! Token: {token[:20]}...")

    # Step 2: Get all users
    print("\nStep 2: Fetching all users...")
    headers = {"Authorization": f"Bearer {token}"}

    users_response = requests.get(f"{BASE_URL}/users", headers=headers)

    if users_response.status_code != 200:
        print(f"Failed to fetch users: {users_response.json()}")
        return

    users_data = users_response.json()
    print(f"Successfully fetched {len(users_data['users'])} users:")
    print(json.dumps(users_data, indent=2))

    # Step 3: Test filtering by user_type
    print("\nStep 3: Fetching only 'user' type users...")
    users_response = requests.get(
        f"{BASE_URL}/users?user_type=user",
        headers=headers
    )

    if users_response.status_code == 200:
        filtered_data = users_response.json()
        print(f"Found {len(filtered_data['users'])} users with type 'user'")
        for user in filtered_data['users']:
            print(f"  - {user['username']} ({user['user_type']})")

    # Step 4: Test excluding self
    print("\nStep 4: Fetching users excluding self...")
    users_response = requests.get(
        f"{BASE_URL}/users?include_self=false",
        headers=headers
    )

    if users_response.status_code == 200:
        filtered_data = users_response.json()
        print(f"Found {len(filtered_data['users'])} users (excluding self)")
        for user in filtered_data['users']:
            print(f"  - {user['username']} ({user['user_type']})")

if __name__ == "__main__":
    test_users_endpoint()
