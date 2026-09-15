from uuid import uuid4


# ============================================================
# HELPERS
# ============================================================

def create_admin(client):
    email = f"admin_{uuid4().hex[:8]}@example.com"
    password = "Admin@12345"

    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Test Admin",
            "email": email,
            "password": password,
            "role": "ADMIN",
        },
    )

    assert response.status_code == 201

    response = client.post(
        "/api/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )

    assert response.status_code == 200

    return response.json()["access_token"]


def create_employee(client, department_id=None, team_id=None):
    email = f"employee_{uuid4().hex[:8]}@example.com"
    password = "Test@12345"

    payload = {
        "full_name": "Test Employee",
        "email": email,
        "password": password,
        "role": "EMPLOYEE",
    }

    if department_id is not None:
        payload["department_id"] = department_id

    if team_id is not None:
        payload["team_id"] = team_id

    response = client.post(
        "/api/auth/register",
        json=payload,
    )

    assert response.status_code == 201

    response = client.post(
        "/api/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )

    assert response.status_code == 200

    return response.json()["access_token"]


def create_department(client, admin_token):
    response = client.post(
        "/api/departments",
        json={
            "name": f"Department {uuid4().hex[:8]}",
            "description": "Assignment test department",
        },
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 201

    return response.json()


def create_team(client, admin_token, department_id):
    response = client.post(
        "/api/teams",
        json={
            "name": f"Team {uuid4().hex[:8]}",
            "description": "Assignment test team",
            "department_id": department_id,
        },
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 201

    return response.json()


def create_ticket(client, employee_token, department_id):
    response = client.post(
        "/api/tickets",
        json={
            "title": f"Assignment Ticket {uuid4().hex[:8]}",
            "description": "Ticket for assignment testing",
            "department_id": department_id,
            "priority": "MEDIUM",
        },
        headers={
            "Authorization": f"Bearer {employee_token}"
        },
    )

    assert response.status_code == 201

    return response.json()


def get_user_id(client, token):
    response = client.get(
        "/api/auth/me",
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 200

    return response.json()["id"]


# ============================================================
# 1. MANUAL USER ASSIGNMENT
# ============================================================

def test_assign_ticket_to_user(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    employee_token = create_employee(
        client,
        department_id=department["id"],
    )

    user_id = get_user_id(
        client,
        employee_token,
    )

    ticket = create_ticket(
        client,
        employee_token,
        department["id"],
    )

    response = client.post(
        "/api/assignments",
        json={
            "ticket_id": ticket["id"],
            "user_id": user_id,
            "reason": "Manual assignment",
        },
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["ticket_id"] == ticket["id"]
    assert data["user_id"] == user_id
    assert data["team_id"] is None


# ============================================================
# 2. TEAM ASSIGNMENT
# ============================================================

def test_assign_ticket_to_team(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    team = create_team(
        client,
        admin_token,
        department["id"],
    )

    employee_token = create_employee(
        client,
        department_id=department["id"],
        team_id=team["id"],
    )

    ticket = create_ticket(
        client,
        employee_token,
        department["id"],
    )

    response = client.post(
        "/api/assignments",
        json={
            "ticket_id": ticket["id"],
            "team_id": team["id"],
            "reason": "Team assignment",
        },
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["ticket_id"] == ticket["id"]
    assert data["team_id"] == team["id"]
    assert data["user_id"] is None


# ============================================================
# 3. DIRECT USER ASSIGNMENT
# ============================================================

def test_direct_user_assignment(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    employee_token = create_employee(
        client,
        department_id=department["id"],
    )

    user_id = get_user_id(
        client,
        employee_token,
    )

    ticket = create_ticket(
        client,
        employee_token,
        department["id"],
    )

    response = client.post(
        f"/api/assignments/user/{ticket['id']}/{user_id}",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["ticket_id"] == ticket["id"]
    assert data["user_id"] == user_id


# ============================================================
# 4. DIRECT TEAM ASSIGNMENT
# ============================================================

def test_direct_team_assignment(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    team = create_team(
        client,
        admin_token,
        department["id"],
    )

    employee_token = create_employee(
        client,
        department_id=department["id"],
        team_id=team["id"],
    )

    ticket = create_ticket(
        client,
        employee_token,
        department["id"],
    )

    response = client.post(
        f"/api/assignments/team/{ticket['id']}/{team['id']}",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["ticket_id"] == ticket["id"]
    assert data["team_id"] == team["id"]


# ============================================================
# 5. AUTO ASSIGNMENT
# ============================================================

def test_auto_assignment(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    employee1_token = create_employee(
        client,
        department_id=department["id"],
    )

    employee2_token = create_employee(
        client,
        department_id=department["id"],
    )

    ticket = create_ticket(
        client,
        employee1_token,
        department["id"],
    )

    response = client.post(
        f"/api/assignments/auto/{ticket['id']}",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["ticket_id"] == ticket["id"]
    assert data["user_id"] is not None


# ============================================================
# 6. GET CURRENT ASSIGNMENT
# ============================================================

def test_get_current_assignment(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    employee_token = create_employee(
        client,
        department_id=department["id"],
    )

    user_id = get_user_id(
        client,
        employee_token,
    )

    ticket = create_ticket(
        client,
        employee_token,
        department["id"],
    )

    assign_response = client.post(
        "/api/assignments",
        json={
            "ticket_id": ticket["id"],
            "user_id": user_id,
        },
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert assign_response.status_code == 201

    response = client.get(
        f"/api/assignments/{ticket['id']}/current",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["ticket_id"] == ticket["id"]
    assert data["user_id"] == user_id
    assert data["unassigned_at"] is None


# ============================================================
# 7. ASSIGNMENT HISTORY
# ============================================================

def test_assignment_history(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    employee1_token = create_employee(
        client,
        department_id=department["id"],
    )

    employee2_token = create_employee(
        client,
        department_id=department["id"],
    )

    user1_id = get_user_id(
        client,
        employee1_token,
    )

    user2_id = get_user_id(
        client,
        employee2_token,
    )

    ticket = create_ticket(
        client,
        employee1_token,
        department["id"],
    )

    response = client.post(
        "/api/assignments",
        json={
            "ticket_id": ticket["id"],
            "user_id": user1_id,
        },
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 201

    response = client.post(
        "/api/assignments",
        json={
            "ticket_id": ticket["id"],
            "user_id": user2_id,
            "reason": "Reassigned",
        },
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 201

    response = client.get(
        f"/api/assignments/{ticket['id']}/history",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert len(data) >= 2

    user_ids = [item["user_id"] for item in data]

    assert user1_id in user_ids
    assert user2_id in user_ids


# ============================================================
# 8. REASSIGN
# ============================================================

def test_reassign_ticket(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    employee1_token = create_employee(
        client,
        department_id=department["id"],
    )

    employee2_token = create_employee(
        client,
        department_id=department["id"],
    )

    user1_id = get_user_id(
        client,
        employee1_token,
    )

    user2_id = get_user_id(
        client,
        employee2_token,
    )

    ticket = create_ticket(
        client,
        employee1_token,
        department["id"],
    )

    response = client.post(
        "/api/assignments",
        json={
            "ticket_id": ticket["id"],
            "user_id": user1_id,
        },
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 201

    response = client.post(
        "/api/assignments",
        json={
            "ticket_id": ticket["id"],
            "user_id": user2_id,
            "reason": "Reassignment test",
        },
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["ticket_id"] == ticket["id"]
    assert data["user_id"] == user2_id


# ============================================================
# 9. UNASSIGN
# ============================================================

def test_unassign_ticket(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    employee_token = create_employee(
        client,
        department_id=department["id"],
    )

    user_id = get_user_id(
        client,
        employee_token,
    )

    ticket = create_ticket(
        client,
        employee_token,
        department["id"],
    )

    response = client.post(
        "/api/assignments",
        json={
            "ticket_id": ticket["id"],
            "user_id": user_id,
        },
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 201

    response = client.delete(
        f"/api/assignments/{ticket['id']}",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["message"] == "Ticket unassigned successfully"

    # Verify no current assignment exists
    response = client.get(
        f"/api/assignments/{ticket['id']}/current",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 404


# ============================================================
# 10. USER WORKLOAD
# ============================================================

def test_user_workload(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    employee_token = create_employee(
        client,
        department_id=department["id"],
    )

    user_id = get_user_id(
        client,
        employee_token,
    )

    response = client.get(
        f"/api/assignments/workload/user/{user_id}",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["user_id"] == user_id
    assert "user_name" in data
    assert "active_tickets" in data
    assert data["active_tickets"] == 0


# ============================================================
# 11. USER WORKLOAD AFTER ASSIGNMENT
# ============================================================

def test_user_workload_after_assignment(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    employee_token = create_employee(
        client,
        department_id=department["id"],
    )

    user_id = get_user_id(
        client,
        employee_token,
    )

    ticket = create_ticket(
        client,
        employee_token,
        department["id"],
    )

    response = client.post(
        "/api/assignments",
        json={
            "ticket_id": ticket["id"],
            "user_id": user_id,
        },
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 201

    response = client.get(
        f"/api/assignments/workload/user/{user_id}",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["user_id"] == user_id
    assert data["active_tickets"] == 1


# ============================================================
# 12. TEAM WORKLOAD
# ============================================================

def test_team_workload(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    team = create_team(
        client,
        admin_token,
        department["id"],
    )

    employee_token = create_employee(
        client,
        department_id=department["id"],
        team_id=team["id"],
    )

    response = client.get(
        f"/api/assignments/workload/team/{team['id']}",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["team_id"] == team["id"]
    assert data["total_members"] == 1
    assert data["assigned_tickets"] == 0
    assert isinstance(data["members"], list)
    assert len(data["members"]) == 1


# ============================================================
# 13. INVALID USER
# ============================================================

def test_assign_to_invalid_user(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    employee_token = create_employee(
        client,
        department_id=department["id"],
    )

    ticket = create_ticket(
        client,
        employee_token,
        department["id"],
    )

    response = client.post(
        "/api/assignments",
        json={
            "ticket_id": ticket["id"],
            "user_id": 999999,
        },
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 404


# ============================================================
# 14. WRONG DEPARTMENT USER
# ============================================================

def test_assign_user_from_different_department(client):
    admin_token = create_admin(client)

    department1 = create_department(
        client,
        admin_token,
    )

    department2 = create_department(
        client,
        admin_token,
    )

    employee1_token = create_employee(
        client,
        department_id=department1["id"],
    )

    employee2_token = create_employee(
        client,
        department_id=department2["id"],
    )

    user2_id = get_user_id(
        client,
        employee2_token,
    )

    ticket = create_ticket(
        client,
        employee1_token,
        department1["id"],
    )

    response = client.post(
        "/api/assignments",
        json={
            "ticket_id": ticket["id"],
            "user_id": user2_id,
        },
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 400


# ============================================================
# 15. EMPLOYEE CANNOT ASSIGN
# ============================================================

def test_employee_cannot_assign_ticket(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    employee1_token = create_employee(
        client,
        department_id=department["id"],
    )

    employee2_token = create_employee(
        client,
        department_id=department["id"],
    )

    user2_id = get_user_id(
        client,
        employee2_token,
    )

    ticket = create_ticket(
        client,
        employee1_token,
        department["id"],
    )

    response = client.post(
        "/api/assignments",
        json={
            "ticket_id": ticket["id"],
            "user_id": user2_id,
        },
        headers={
            "Authorization": f"Bearer {employee1_token}"
        },
    )

    assert response.status_code == 403


# ============================================================
# 16. EITHER USER OR TEAM IS REQUIRED
# ============================================================

def test_assignment_requires_user_or_team(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    employee_token = create_employee(
        client,
        department_id=department["id"],
    )

    ticket = create_ticket(
        client,
        employee_token,
        department["id"],
    )

    response = client.post(
        "/api/assignments",
        json={
            "ticket_id": ticket["id"],
        },
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 400


# ============================================================
# 17. USER AND TEAM CANNOT BOTH BE PROVIDED
# ============================================================

def test_assignment_cannot_have_user_and_team(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    team = create_team(
        client,
        admin_token,
        department["id"],
    )

    employee_token = create_employee(
        client,
        department_id=department["id"],
        team_id=team["id"],
    )

    user_id = get_user_id(
        client,
        employee_token,
    )

    ticket = create_ticket(
        client,
        employee_token,
        department["id"],
    )

    response = client.post(
        "/api/assignments",
        json={
            "ticket_id": ticket["id"],
            "user_id": user_id,
            "team_id": team["id"],
        },
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 400


# ============================================================
# 18. INVALID TEAM
# ============================================================

def test_assign_to_invalid_team(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    employee_token = create_employee(
        client,
        department_id=department["id"],
    )

    ticket = create_ticket(
        client,
        employee_token,
        department["id"],
    )

    response = client.post(
        "/api/assignments",
        json={
            "ticket_id": ticket["id"],
            "team_id": 999999,
        },
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 404