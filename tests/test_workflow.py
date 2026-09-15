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


def create_employee(client, department_id=None):
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
            "description": "Workflow test department",
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
            "title": f"Workflow Ticket {uuid4().hex[:8]}",
            "description": "Ticket for workflow testing",
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


def assign_ticket(client, admin_token, ticket_id, user_id):
    response = client.post(
        "/api/assignments",
        json={
            "ticket_id": ticket_id,
            "user_id": user_id,
        },
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 201

    return response.json()


def update_status(
    client,
    token,
    ticket_id,
    new_status,
    comment=None
):
    payload = {
        "status": new_status,
    }

    if comment is not None:
        payload["comment"] = comment

    return client.patch(
        f"/api/workflow/tickets/{ticket_id}/status",
        json=payload,
        headers={
            "Authorization": f"Bearer {token}"
        },
    )


# ============================================================
# 1. ASSIGNED -> IN_PROGRESS
# ============================================================

def test_assigned_to_in_progress(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    employee_token = create_employee(
        client,
        department["id"],
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

    assign_ticket(
        client,
        admin_token,
        ticket["id"],
        user_id,
    )

    response = update_status(
        client,
        admin_token,
        ticket["id"],
        "IN_PROGRESS",
        "Work started",
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == ticket["id"]
    assert data["status"] == "IN_PROGRESS"


# ============================================================
# 2. IN_PROGRESS -> RESOLVED
# ============================================================

def test_in_progress_to_resolved(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    employee_token = create_employee(
        client,
        department["id"],
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

    assign_ticket(
        client,
        admin_token,
        ticket["id"],
        user_id,
    )

    update_status(
        client,
        admin_token,
        ticket["id"],
        "IN_PROGRESS",
    )

    response = update_status(
        client,
        admin_token,
        ticket["id"],
        "RESOLVED",
        "Issue fixed",
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "RESOLVED"
    assert data["resolved_at"] is not None


# ============================================================
# 3. RESOLVED -> CLOSED
# ============================================================

def test_resolved_to_closed(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    employee_token = create_employee(
        client,
        department["id"],
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

    assign_ticket(
        client,
        admin_token,
        ticket["id"],
        user_id,
    )

    update_status(
        client,
        admin_token,
        ticket["id"],
        "IN_PROGRESS",
    )

    update_status(
        client,
        admin_token,
        ticket["id"],
        "RESOLVED",
    )

    response = update_status(
        client,
        admin_token,
        ticket["id"],
        "CLOSED",
        "Closing ticket",
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "CLOSED"
    assert data["closed_at"] is not None


# ============================================================
# 4. REOPEN CLOSED TICKET
# ============================================================

def test_reopen_closed_ticket(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    employee_token = create_employee(
        client,
        department["id"],
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

    assign_ticket(
        client,
        admin_token,
        ticket["id"],
        user_id,
    )

    update_status(
        client,
        admin_token,
        ticket["id"],
        "IN_PROGRESS",
    )

    update_status(
        client,
        admin_token,
        ticket["id"],
        "RESOLVED",
    )

    update_status(
        client,
        admin_token,
        ticket["id"],
        "CLOSED",
    )

    response = update_status(
        client,
        admin_token,
        ticket["id"],
        "REOPENED",
        "Issue occurred again",
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "REOPENED"
    assert data["closed_at"] is None


# ============================================================
# 5. INVALID STATUS TRANSITION
# ============================================================

def test_invalid_status_transition(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    employee_token = create_employee(
        client,
        department["id"],
    )

    ticket = create_ticket(
        client,
        employee_token,
        department["id"],
    )

    # OPEN -> RESOLVED is not allowed
    response = update_status(
        client,
        admin_token,
        ticket["id"],
        "RESOLVED",
    )

    assert response.status_code == 400


# ============================================================
# 6. IN_PROGRESS REQUIRES ASSIGNMENT
# ============================================================

def test_in_progress_requires_assignment(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    employee_token = create_employee(
        client,
        department["id"],
    )

    ticket = create_ticket(
        client,
        employee_token,
        department["id"],
    )

    response = update_status(
        client,
        admin_token,
        ticket["id"],
        "IN_PROGRESS",
    )

    assert response.status_code == 400

    assert (
        response.json()["detail"]
        == "Cannot change ticket status from OPEN to IN_PROGRESS"
    )


# ============================================================
# 7. STATUS HISTORY
# ============================================================

def test_status_history(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    employee_token = create_employee(
        client,
        department["id"],
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

    assign_ticket(
        client,
        admin_token,
        ticket["id"],
        user_id,
    )

    update_status(
        client,
        admin_token,
        ticket["id"],
        "IN_PROGRESS",
    )

    update_status(
        client,
        admin_token,
        ticket["id"],
        "RESOLVED",
    )

    response = client.get(
        f"/api/workflow/tickets/{ticket['id']}/history",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert len(data) >= 2

    statuses = [
        item["new_status"]
        for item in data
    ]

    assert "IN_PROGRESS" in statuses
    assert "RESOLVED" in statuses


# ============================================================
# 8. STATUS HISTORY COMMENT
# ============================================================

def test_status_history_comment(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    employee_token = create_employee(
        client,
        department["id"],
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

    assign_ticket(
        client,
        admin_token,
        ticket["id"],
        user_id,
    )

    update_status(
        client,
        admin_token,
        ticket["id"],
        "IN_PROGRESS",
        "Started working on issue",
    )

    response = client.get(
        f"/api/workflow/tickets/{ticket['id']}/history",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    matching_history = [
        item
        for item in data
        if item["new_status"] == "IN_PROGRESS"
    ]

    assert len(matching_history) >= 1
    assert (
        matching_history[0]["comment"]
        == "Started working on issue"
    )


# ============================================================
# 9. NON-EXISTENT TICKET
# ============================================================

def test_workflow_ticket_not_found(client):
    admin_token = create_admin(client)

    response = update_status(
        client,
        admin_token,
        999999,
        "ASSIGNED",
    )

    assert response.status_code == 404


# ============================================================
# 10. UNAUTHORIZED REQUEST
# ============================================================

def test_workflow_without_token(client):
    response = client.patch(
        "/api/workflow/tickets/1/status",
        json={
            "status": "IN_PROGRESS"
        },
    )

    assert response.status_code in [401, 403]


# ============================================================
# 11. SAME STATUS
# ============================================================

def test_same_status_not_allowed(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    employee_token = create_employee(
        client,
        department["id"],
    )

    ticket = create_ticket(
        client,
        employee_token,
        department["id"],
    )

    response = update_status(
        client,
        admin_token,
        ticket["id"],
        "OPEN",
    )

    assert response.status_code == 400

    assert (
        response.json()["detail"]
        == "Ticket is already in this status"
    )


# ============================================================
# 12. INVALID STATUS NAME
# ============================================================

def test_invalid_status_name(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    employee_token = create_employee(
        client,
        department["id"],
    )

    ticket = create_ticket(
        client,
        employee_token,
        department["id"],
    )

    response = update_status(
        client,
        admin_token,
        ticket["id"],
        "INVALID_STATUS",
    )

    assert response.status_code == 400


# ============================================================
# 13. ON HOLD FLOW
# ============================================================

def test_on_hold_flow(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    employee_token = create_employee(
        client,
        department["id"],
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

    assign_ticket(
        client,
        admin_token,
        ticket["id"],
        user_id,
    )

    response = update_status(
        client,
        admin_token,
        ticket["id"],
        "ON_HOLD",
    )

    assert response.status_code == 200
    assert response.json()["status"] == "ON_HOLD"

    response = update_status(
        client,
        admin_token,
        ticket["id"],
        "IN_PROGRESS",
    )

    assert response.status_code == 200
    assert response.json()["status"] == "IN_PROGRESS"


# ============================================================
# 14. REJECT TICKET
# ============================================================

def test_reject_ticket(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    employee_token = create_employee(
        client,
        department["id"],
    )

    ticket = create_ticket(
        client,
        employee_token,
        department["id"],
    )

    response = update_status(
        client,
        admin_token,
        ticket["id"],
        "REJECTED",
        "Invalid support request",
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "REJECTED"


# ============================================================
# 15. REOPEN REJECTED TICKET
# ============================================================

def test_reopen_rejected_ticket(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    employee_token = create_employee(
        client,
        department["id"],
    )

    ticket = create_ticket(
        client,
        employee_token,
        department["id"],
    )

    update_status(
        client,
        admin_token,
        ticket["id"],
        "REJECTED",
    )

    response = update_status(
        client,
        admin_token,
        ticket["id"],
        "REOPENED",
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "REOPENED"


# ============================================================
# 16. EMPLOYEE CAN UPDATE AUTHENTICATED TICKET
# ============================================================

def test_employee_can_update_own_ticket(client):
    admin_token = create_admin(client)

    department = create_department(
        client,
        admin_token,
    )

    employee_token = create_employee(
        client,
        department["id"],
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

    assign_ticket(
        client,
        admin_token,
        ticket["id"],
        user_id,
    )

    response = update_status(
        client,
        employee_token,
        ticket["id"],
        "IN_PROGRESS",
    )

    assert response.status_code == 200

    assert response.json()["status"] == "IN_PROGRESS"