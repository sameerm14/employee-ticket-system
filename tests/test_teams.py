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

    assert response.status_code == 201

    return response.json()


def create_team(client, token, department_id, name=None):
    if name is None:
        name = f"Team {uuid4().hex[:8]}"

    return client.post(
        "/api/teams",
        json={
            "name": name,
            "description": "Test team",
            "department_id": department_id,
        },
        headers={
            "Authorization": f"Bearer {token}"
        },
    )


def test_create_team(client):
    token = create_admin(client)

    department = create_department(client, token)

    response = create_team(
        client,
        token,
        department["id"],
    )

    assert response.status_code == 201

    data = response.json()

    assert "id" in data
    assert data["department_id"] == department["id"]
    assert data["description"] == "Test team"
    assert data["is_active"] is True


def test_duplicate_team_same_department(client):
    token = create_admin(client)

    department = create_department(client, token)

    team_name = f"Duplicate Team {uuid4().hex[:8]}"

    first_response = create_team(
        client,
        token,
        department["id"],
        team_name,
    )

    assert first_response.status_code == 201

    second_response = create_team(
        client,
        token,
        department["id"],
        team_name,
    )

    assert second_response.status_code in [400, 409]


def test_same_team_name_different_departments(client):
    token = create_admin(client)

    department_one = create_department(client, token)
    department_two = create_department(client, token)

    team_name = f"Common Team {uuid4().hex[:8]}"

    first_response = create_team(
        client,
        token,
        department_one["id"],
        team_name,
    )

    assert first_response.status_code == 201

    second_response = create_team(
        client,
        token,
        department_two["id"],
        team_name,
    )

    assert second_response.status_code == 201


def test_get_teams(client):
    token = create_admin(client)

    department = create_department(client, token)

    create_response = create_team(
        client,
        token,
        department["id"],
    )

    assert create_response.status_code == 201

    response = client.get(
        "/api/teams",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "teams" in data
    assert "total" in data
    assert "page" in data
    assert "page_size" in data
    assert "total_pages" in data
    assert data["total"] >= 1


def test_search_team(client):
    token = create_admin(client)

    department = create_department(client, token)

    team_name = f"SearchTeam{uuid4().hex[:8]}"

    create_response = create_team(
        client,
        token,
        department["id"],
        team_name,
    )

    assert create_response.status_code == 201

    response = client.get(
        "/api/teams",
        params={
            "search": team_name,
        },
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total"] >= 1
    assert any(
        team["name"] == team_name
        for team in data["teams"]
    )


def test_filter_by_department(client):
    token = create_admin(client)

    department_one = create_department(client, token)
    department_two = create_department(client, token)

    team_one = create_team(
        client,
        token,
        department_one["id"],
    )

    team_two = create_team(
        client,
        token,
        department_two["id"],
    )

    assert team_one.status_code == 201
    assert team_two.status_code == 201

    response = client.get(
        "/api/teams",
        params={
            "department_id": department_one["id"],
        },
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    for team in data["teams"]:
        assert team["department_id"] == department_one["id"]


def test_filter_active_teams(client):
    token = create_admin(client)

    department = create_department(client, token)

    response = create_team(
        client,
        token,
        department["id"],
    )

    assert response.status_code == 201

    team_id = response.json()["id"]

    # Deactivate the team
    update_response = client.put(
        f"/api/teams/{team_id}",
        json={
            "is_active": False,
        },
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert update_response.status_code == 200

    response = client.get(
        "/api/teams",
        params={
            "is_active": True,
        },
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    for team in data["teams"]:
        assert team["is_active"] is True


def test_pagination(client):
    token = create_admin(client)

    department = create_department(client, token)

    for _ in range(3):
        response = create_team(
            client,
            token,
            department["id"],
        )

        assert response.status_code == 201

    response = client.get(
        "/api/teams",
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
    assert len(data["teams"]) <= 2


def test_update_team(client):
    token = create_admin(client)

    department = create_department(client, token)

    create_response = create_team(
        client,
        token,
        department["id"],
    )

    assert create_response.status_code == 201

    team_id = create_response.json()["id"]

    updated_name = f"Updated Team {uuid4().hex[:8]}"

    response = client.put(
        f"/api/teams/{team_id}",
        json={
            "name": updated_name,
            "description": "Updated team",
        },
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == updated_name
    assert data["description"] == "Updated team"


def test_delete_team(client):
    token = create_admin(client)

    department = create_department(client, token)

    create_response = create_team(
        client,
        token,
        department["id"],
    )

    assert create_response.status_code == 201

    team_id = create_response.json()["id"]

    response = client.delete(
        f"/api/teams/{team_id}",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code in [200, 204]


def test_employee_cannot_create_team(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    employee_token = create_employee(client)

    response = create_team(
        client,
        employee_token,
        department["id"],
    )

    assert response.status_code == 403


def test_employee_can_view_teams(client):
    token = create_employee(client)

    response = client.get(
        "/api/teams",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200


def test_employee_cannot_update_team(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    create_response = create_team(
        client,
        admin_token,
        department["id"],
    )

    assert create_response.status_code == 201

    team_id = create_response.json()["id"]

    employee_token = create_employee(client)

    response = client.put(
        f"/api/teams/{team_id}",
        json={
            "name": f"Unauthorized Team {uuid4().hex[:8]}",
        },
        headers={
            "Authorization": f"Bearer {employee_token}"
        },
    )

    assert response.status_code == 403


def test_employee_cannot_delete_team(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    create_response = create_team(
        client,
        admin_token,
        department["id"],
    )

    assert create_response.status_code == 201

    team_id = create_response.json()["id"]

    employee_token = create_employee(client)

    response = client.delete(
        f"/api/teams/{team_id}",
        headers={
            "Authorization": f"Bearer {employee_token}"
        },
    )

    assert response.status_code == 403


def test_team_invalid_department(client):
    token = create_admin(client)

    response = create_team(
        client,
        token,
        department_id=999999,
    )

    assert response.status_code in [400, 404]

