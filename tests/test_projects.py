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
    return register_and_login(client, "ADMIN")


def create_employee(client):
    return register_and_login(client, "EMPLOYEE")


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

    assert response.status_code == 201
    return response.json()


def create_project(
    client,
    token,
    department_id,
    name=None,
    priority="MEDIUM",
    status="ACTIVE",
):
    if name is None:
        name = f"Project {uuid4().hex[:8]}"

    return client.post(
        "/api/projects",
        json={
            "name": name,
            "description": "Test project",
            "department_id": department_id,
            "priority": priority,
            "status": status,
        },
        headers={
            "Authorization": f"Bearer {token}"
        },
    )


def test_create_project(client):
    token = create_admin(client)
    department = create_department(client, token)

    response = create_project(
        client,
        token,
        department["id"],
    )

    assert response.status_code == 201

    data = response.json()

    assert "id" in data
    assert data["department_id"] == department["id"]
    assert data["priority"] == "MEDIUM"
    assert data["status"] == "ACTIVE"
    assert data["is_active"] is True


def test_duplicate_project_same_department(client):
    token = create_admin(client)
    department = create_department(client, token)

    project_name = f"Duplicate Project {uuid4().hex[:8]}"

    first_response = create_project(
        client,
        token,
        department["id"],
        project_name,
    )

    assert first_response.status_code == 201

    second_response = create_project(
        client,
        token,
        department["id"],
        project_name,
    )

    assert second_response.status_code in [400, 409]


def test_same_project_name_different_departments(client):
    token = create_admin(client)

    department_one = create_department(client, token)
    department_two = create_department(client, token)

    project_name = f"Common Project {uuid4().hex[:8]}"

    first_response = create_project(
        client,
        token,
        department_one["id"],
        project_name,
    )

    assert first_response.status_code == 201

    second_response = create_project(
        client,
        token,
        department_two["id"],
        project_name,
    )

    assert second_response.status_code == 201


def test_get_projects(client):
    token = create_admin(client)
    department = create_department(client, token)

    create_response = create_project(
        client,
        token,
        department["id"],
    )

    assert create_response.status_code == 201

    response = client.get(
        "/api/projects",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "projects" in data
    assert "total" in data
    assert "page" in data
    assert "page_size" in data
    assert "total_pages" in data
    assert data["total"] >= 1


def test_search_project(client):
    token = create_admin(client)
    department = create_department(client, token)

    project_name = f"SearchProject{uuid4().hex[:8]}"

    create_response = create_project(
        client,
        token,
        department["id"],
        project_name,
    )

    assert create_response.status_code == 201

    response = client.get(
        "/api/projects",
        params={
            "search": project_name,
        },
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total"] >= 1

    assert any(
        project["name"] == project_name
        for project in data["projects"]
    )


def test_filter_by_department(client):
    token = create_admin(client)

    department_one = create_department(client, token)
    department_two = create_department(client, token)

    project_one = create_project(
        client,
        token,
        department_one["id"],
    )

    project_two = create_project(
        client,
        token,
        department_two["id"],
    )

    assert project_one.status_code == 201
    assert project_two.status_code == 201

    response = client.get(
        "/api/projects",
        params={
            "department_id": department_one["id"],
        },
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    for project in data["projects"]:
        assert project["department_id"] == department_one["id"]


def test_filter_by_priority(client):
    token = create_admin(client)
    department = create_department(client, token)

    project = create_project(
        client,
        token,
        department["id"],
        priority="HIGH",
    )

    assert project.status_code == 201

    response = client.get(
        "/api/projects",
        params={
            "priority": "HIGH",
        },
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    for project in data["projects"]:
        assert project["priority"] == "HIGH"


def test_filter_by_status(client):
    token = create_admin(client)
    department = create_department(client, token)

    project = create_project(
        client,
        token,
        department["id"],
        status="COMPLETED",
    )

    assert project.status_code == 201

    response = client.get(
        "/api/projects",
        params={
            "status": "COMPLETED",
        },
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    for project in data["projects"]:
        assert project["status"] == "COMPLETED"


def test_filter_active_projects(client):
    token = create_admin(client)
    department = create_department(client, token)

    create_response = create_project(
        client,
        token,
        department["id"],
    )

    assert create_response.status_code == 201

    project_id = create_response.json()["id"]

    update_response = client.put(
        f"/api/projects/{project_id}",
        json={
            "is_active": False,
        },
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert update_response.status_code == 200

    response = client.get(
        "/api/projects",
        params={
            "is_active": True,
        },
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    for project in data["projects"]:
        assert project["is_active"] is True


def test_pagination(client):
    token = create_admin(client)
    department = create_department(client, token)

    for _ in range(3):
        response = create_project(
            client,
            token,
            department["id"],
        )

        assert response.status_code == 201

    response = client.get(
        "/api/projects",
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
    assert len(data["projects"]) <= 2


def test_update_project(client):
    token = create_admin(client)
    department = create_department(client, token)

    create_response = create_project(
        client,
        token,
        department["id"],
    )

    assert create_response.status_code == 201

    project_id = create_response.json()["id"]

    updated_name = f"Updated Project {uuid4().hex[:8]}"

    response = client.put(
        f"/api/projects/{project_id}",
        json={
            "name": updated_name,
            "description": "Updated project",
            "priority": "HIGH",
            "status": "ON_HOLD",
        },
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == updated_name
    assert data["description"] == "Updated project"
    assert data["priority"] == "HIGH"
    assert data["status"] == "ON_HOLD"


def test_delete_project(client):
    token = create_admin(client)
    department = create_department(client, token)

    create_response = create_project(
        client,
        token,
        department["id"],
    )

    assert create_response.status_code == 201

    project_id = create_response.json()["id"]

    response = client.delete(
        f"/api/projects/{project_id}",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code in [200, 204]


def test_employee_cannot_create_project(client):
    admin_token = create_admin(client)
    department = create_department(client, admin_token)

    employee_token = create_employee(client)

    response = create_project(
        client,
        employee_token,
        department["id"],
    )

    assert response.status_code == 403


def test_employee_can_view_projects(client):
    token = create_employee(client)

    response = client.get(
        "/api/projects",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200


def test_employee_cannot_update_project(client):
    admin_token = create_admin(client)
    department = create_department(client, admin_token)

    create_response = create_project(
        client,
        admin_token,
        department["id"],
    )

    assert create_response.status_code == 201

    project_id = create_response.json()["id"]

    employee_token = create_employee(client)

    response = client.put(
        f"/api/projects/{project_id}",
        json={
            "name": f"Unauthorized Project {uuid4().hex[:8]}",
        },
        headers={
            "Authorization": f"Bearer {employee_token}"
        },
    )

    assert response.status_code == 403


def test_employee_cannot_delete_project(client):
    admin_token = create_admin(client)
    department = create_department(client, admin_token)

    create_response = create_project(
        client,
        admin_token,
        department["id"],
    )

    assert create_response.status_code == 201

    project_id = create_response.json()["id"]

    employee_token = create_employee(client)

    response = client.delete(
        f"/api/projects/{project_id}",
        headers={
            "Authorization": f"Bearer {employee_token}"
        },
    )

    assert response.status_code == 403


def test_project_invalid_department(client):
    token = create_admin(client)

    response = create_project(
        client,
        token,
        department_id=999999,
    )

    assert response.status_code in [400, 404]


def test_invalid_priority(client):
    token = create_admin(client)
    department = create_department(client, token)

    response = create_project(
        client,
        token,
        department["id"],
        priority="INVALID",
    )

    assert response.status_code in [400, 422]


def test_invalid_status(client):
    token = create_admin(client)
    department = create_department(client, token)

    response = create_project(
        client,
        token,
        department["id"],
        status="INVALID",
    )

    assert response.status_code in [400, 422]