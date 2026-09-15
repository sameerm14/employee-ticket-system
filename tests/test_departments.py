
from uuid import uuid4


def register_and_login(client, role="EMPLOYEE"):
    email = f"user_{uuid4().hex[:8]}@example.com"
    password = "Test@12345"

    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Test User",
            "email": email,
            "password": password,
            "role": role,
        },
    )

    assert response.status_code == 201

    login_response = client.post(
        "/api/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )

    assert login_response.status_code == 200

    return login_response.json()["access_token"]


def create_admin(client):
    return register_and_login(client, role="ADMIN")


def create_employee(client):
    return register_and_login(client, role="EMPLOYEE")


def create_department(client, token, name=None):
    if name is None:
        name = f"Department {uuid4().hex[:8]}"

    response = client.post(
        "/api/departments",
        json={
            "name": name,
            "description": "Test department",
        },
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    return response


def test_create_department(client):
    token = create_admin(client)

    response = create_department(client, token)

    assert response.status_code == 201

    data = response.json()

    assert "id" in data
    assert data["name"].startswith("Department")
    assert data["description"] == "Test department"
    assert data["is_active"] is True


def test_duplicate_department(client):
    token = create_admin(client)

    name = f"Duplicate Department {uuid4().hex[:8]}"

    first_response = create_department(
        client,
        token,
        name,
    )

    assert first_response.status_code == 201

    second_response = create_department(
        client,
        token,
        name,
    )

    assert second_response.status_code in [400, 409]


def test_get_departments(client):
    token = create_admin(client)

    create_response = create_department(client, token)

    assert create_response.status_code == 201

    response = client.get(
        "/api/departments",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "departments" in data
    assert "total" in data
    assert "page" in data
    assert "page_size" in data
    assert "total_pages" in data
    assert data["total"] >= 1


def test_search_department(client):
    token = create_admin(client)

    unique_name = f"SearchDepartment{uuid4().hex[:8]}"

    create_response = create_department(
        client,
        token,
        unique_name,
    )

    assert create_response.status_code == 201

    response = client.get(
        "/api/departments",
        params={
            "search": unique_name,
        },
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total"] >= 1
    assert any(
        department["name"] == unique_name
        for department in data["departments"]
    )


def test_filter_active_departments(client):
    token = create_admin(client)

    response = client.get(
        "/api/departments",
        params={
            "is_active": True,
        },
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    for department in data["departments"]:
        assert department["is_active"] is True


def test_pagination(client):
    token = create_admin(client)

    for _ in range(3):
        response = create_department(client, token)
        assert response.status_code == 201

    response = client.get(
        "/api/departments",
        params={
            "page": 1,
            "page_size": 2,
        },
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["page"] == 1
    assert data["page_size"] == 2
    assert len(data["departments"]) <= 2


def test_update_department(client):
    token = create_admin(client)

    create_response = create_department(client, token)

    assert create_response.status_code == 201

    department_id = create_response.json()["id"]

    response = client.put(
        f"/api/departments/{department_id}",
        json={
            "name": f"Updated Department {uuid4().hex[:8]}",
            "description": "Updated description",
        },
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["description"] == "Updated description"


def test_delete_department(client):
    token = create_admin(client)

    create_response = create_department(client, token)

    assert create_response.status_code == 201

    department_id = create_response.json()["id"]

    response = client.delete(
        f"/api/departments/{department_id}",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code in [200, 204]


def test_employee_cannot_create_department(client):
    token = create_employee(client)

    response = create_department(client, token)

    assert response.status_code == 403


def test_employee_can_view_departments(client):
    token = create_employee(client)

    response = client.get(
        "/api/departments",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200


def test_employee_cannot_update_department(client):
    admin_token = create_admin(client)

    create_response = create_department(
        client,
        admin_token,
    )

    assert create_response.status_code == 201

    department_id = create_response.json()["id"]

    employee_token = create_employee(client)

    response = client.put(
        f"/api/departments/{department_id}",
        json={
            "name": f"Unauthorized Update {uuid4().hex[:8]}",
            "description": "Should not update",
        },
        headers={
            "Authorization": f"Bearer {employee_token}"
        },
    )

    assert response.status_code == 403


def test_employee_cannot_delete_department(client):
    admin_token = create_admin(client)

    create_response = create_department(
        client,
        admin_token,
    )

    assert create_response.status_code == 201

    department_id = create_response.json()["id"]

    employee_token = create_employee(client)

    response = client.delete(
        f"/api/departments/{department_id}",
        headers={
            "Authorization": f"Bearer {employee_token}"
        },
    )

    assert response.status_code == 403

