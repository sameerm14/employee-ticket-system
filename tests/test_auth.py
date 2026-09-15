
from uuid import uuid4


def test_root(client):
    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["message"] == "Employee Ticket Management API is running"


def test_register_user(client):
    email = f"test_{uuid4().hex[:8]}@example.com"

    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Test User",
            "email": email,
            "password": "Test@12345",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["email"] == email
    assert data["full_name"] == "Test User"
    assert "password" not in data
    assert "password_hash" not in data


def test_duplicate_email(client):
    email = f"duplicate_{uuid4().hex[:8]}@example.com"

    first_response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Test User",
            "email": email,
            "password": "Test@12345",
        },
    )

    assert first_response.status_code == 201

    second_response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Another User",
            "email": email,
            "password": "Test@12345",
        },
    )

    assert second_response.status_code in [400, 409]


def test_login(client):
    email = f"login_{uuid4().hex[:8]}@example.com"
    password = "Test@12345"

    register_response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Login User",
            "email": email,
            "password": password,
        },
    )

    assert register_response.status_code == 201

    response = client.post(
        "/api/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_wrong_password(client):
    email = f"wrongpass_{uuid4().hex[:8]}@example.com"
    password = "Test@12345"

    register_response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Wrong Password User",
            "email": email,
            "password": password,
        },
    )

    assert register_response.status_code == 201

    response = client.post(
        "/api/auth/login",
        json={
            "email": email,
            "password": "WrongPassword@123",
        },
    )

    assert response.status_code == 401


def test_me_without_token(client):
    response = client.get("/api/auth/me")

    assert response.status_code in [401, 403]


def test_me_with_token(client):
    email = f"me_{uuid4().hex[:8]}@example.com"
    password = "Test@12345"

    register_response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Me User",
            "email": email,
            "password": password,
        },
    )

    assert register_response.status_code == 201

    login_response = client.post(
        "/api/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    response = client.get(
        "/api/auth/me",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["email"] == email
    assert data["full_name"] == "Me User"

