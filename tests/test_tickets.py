from uuid import uuid4


# ============================================================
# HELPERS
# ============================================================

def create_admin(client):
    email = f"admin_{uuid4().hex[:8]}@example.com"
    password = "Admin@12345"

    register_response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Test Admin",
            "email": email,
            "password": password,
            "role": "ADMIN",
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

    return login_response.json()["access_token"]


def create_employee(client):
    email = f"user_{uuid4().hex[:8]}@example.com"
    password = "Test@12345"

    register_response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Test User",
            "email": email,
            "password": password,
            "role": "EMPLOYEE",
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

    return login_response.json()["access_token"]


def create_department(client, admin_token, name=None):
    if name is None:
        name = f"Department {uuid4().hex[:8]}"

    response = client.post(
        "/api/departments",
        json={
            "name": name,
            "description": "Test department",
        },
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 201

    return response.json()


def create_project(client, admin_token, department_id, name=None):
    if name is None:
        name = f"Project {uuid4().hex[:8]}"

    response = client.post(
        "/api/projects",
        json={
            "name": name,
            "description": "Test project",
            "department_id": department_id,
            "priority": "MEDIUM",
            "status": "ACTIVE",
        },
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 201

    return response.json()


def create_ticket(
    client,
    token,
    department_id,
    project_id=None,
    title=None,
    priority="MEDIUM",
):
    if title is None:
        title = f"Test Ticket {uuid4().hex[:8]}"

    response = client.post(
        "/api/tickets",
        json={
            "title": title,
            "description": "Test ticket description",
            "department_id": department_id,
            "project_id": project_id,
            "priority": priority,
        },
        headers={
            "Authorization": f"Bearer {token}"
        },
    )

    assert response.status_code == 201

    return response.json()


# ============================================================
# CREATE TICKET
# ============================================================

def test_create_ticket(client):
    admin_token = create_admin(client)
    employee_token = create_employee(client)

    department = create_department(client, admin_token)

    ticket = create_ticket(
        client,
        employee_token,
        department["id"],
    )

    assert ticket["id"] is not None
    assert ticket["ticket_number"].startswith("TKT-")
    assert ticket["title"].startswith("Test Ticket")
    assert ticket["description"] == "Test ticket description"
    assert ticket["department_id"] == department["id"]
    assert ticket["priority"] == "MEDIUM"
    assert ticket["status"] == "OPEN"
    assert ticket["created_by"] is not None


# ============================================================
# TICKET NUMBER
# ============================================================

def test_ticket_number_is_unique(client):
    admin_token = create_admin(client)
    employee_token = create_employee(client)

    department = create_department(client, admin_token)

    ticket1 = create_ticket(
        client,
        employee_token,
        department["id"],
    )

    ticket2 = create_ticket(
        client,
        employee_token,
        department["id"],
    )

    assert ticket1["ticket_number"] != ticket2["ticket_number"]


# ============================================================
# GET SINGLE TICKET
# ============================================================

def test_get_ticket(client):
    admin_token = create_admin(client)
    employee_token = create_employee(client)

    department = create_department(client, admin_token)

    ticket = create_ticket(
        client,
        employee_token,
        department["id"],
    )

    response = client.get(
        f"/api/tickets/{ticket['id']}",
        headers={
            "Authorization": f"Bearer {employee_token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == ticket["id"]
    assert data["ticket_number"] == ticket["ticket_number"]
    assert data["title"] == ticket["title"]


# ============================================================
# GET TICKETS
# ============================================================

def test_get_tickets(client):
    admin_token = create_admin(client)
    employee_token = create_employee(client)

    department = create_department(client, admin_token)

    create_ticket(
        client,
        employee_token,
        department["id"],
    )

    response = client.get(
        "/api/tickets",
        headers={
            "Authorization": f"Bearer {employee_token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "total" in data
    assert "page" in data
    assert "page_size" in data
    assert "total_pages" in data
    assert "tickets" in data

    assert data["total"] >= 1


# ============================================================
# SEARCH BY TITLE
# ============================================================

def test_search_ticket_by_title(client):
    admin_token = create_admin(client)
    employee_token = create_employee(client)

    department = create_department(client, admin_token)

    unique_title = f"Login Issue {uuid4().hex[:8]}"

    create_ticket(
        client,
        employee_token,
        department["id"],
        title=unique_title,
    )

    response = client.get(
        "/api/tickets",
        params={
            "search": unique_title
        },
        headers={
            "Authorization": f"Bearer {employee_token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total"] >= 1
    assert any(
        ticket["title"] == unique_title
        for ticket in data["tickets"]
    )


# ============================================================
# SEARCH BY TICKET NUMBER
# ============================================================

def test_search_ticket_by_ticket_number(client):
    admin_token = create_admin(client)
    employee_token = create_employee(client)

    department = create_department(client, admin_token)

    ticket = create_ticket(
        client,
        employee_token,
        department["id"],
    )

    response = client.get(
        "/api/tickets",
        params={
            "search": ticket["ticket_number"]
        },
        headers={
            "Authorization": f"Bearer {employee_token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total"] >= 1
    assert any(
        item["ticket_number"] == ticket["ticket_number"]
        for item in data["tickets"]
    )


# ============================================================
# FILTER BY DEPARTMENT
# ============================================================

def test_filter_by_department(client):
    admin_token = create_admin(client)
    employee_token = create_employee(client)

    department1 = create_department(client, admin_token)
    department2 = create_department(client, admin_token)

    create_ticket(
        client,
        employee_token,
        department1["id"],
    )

    response = client.get(
        "/api/tickets",
        params={
            "department_id": department1["id"]
        },
        headers={
            "Authorization": f"Bearer {employee_token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    for ticket in data["tickets"]:
        assert ticket["department_id"] == department1["id"]


# ============================================================
# FILTER BY PROJECT
# ============================================================

def test_filter_by_project(client):
    admin_token = create_admin(client)
    employee_token = create_employee(client)

    department = create_department(client, admin_token)

    project = create_project(
        client,
        admin_token,
        department["id"],
    )

    create_ticket(
        client,
        employee_token,
        department["id"],
        project_id=project["id"],
    )

    response = client.get(
        "/api/tickets",
        params={
            "project_id": project["id"]
        },
        headers={
            "Authorization": f"Bearer {employee_token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    for ticket in data["tickets"]:
        assert ticket["project_id"] == project["id"]


# ============================================================
# FILTER BY STATUS
# ============================================================

def test_filter_by_status(client):
    admin_token = create_admin(client)
    employee_token = create_employee(client)

    department = create_department(client, admin_token)

    create_ticket(
        client,
        employee_token,
        department["id"],
    )

    response = client.get(
        "/api/tickets",
        params={
            "status": "OPEN"
        },
        headers={
            "Authorization": f"Bearer {employee_token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    for ticket in data["tickets"]:
        assert ticket["status"] == "OPEN"


# ============================================================
# FILTER BY PRIORITY
# ============================================================

def test_filter_by_priority(client):
    admin_token = create_admin(client)
    employee_token = create_employee(client)

    department = create_department(client, admin_token)

    create_ticket(
        client,
        employee_token,
        department["id"],
        priority="HIGH",
    )

    response = client.get(
        "/api/tickets",
        params={
            "priority": "HIGH"
        },
        headers={
            "Authorization": f"Bearer {employee_token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    for ticket in data["tickets"]:
        assert ticket["priority"] == "HIGH"


# ============================================================
# PAGINATION
# ============================================================

def test_pagination(client):
    admin_token = create_admin(client)
    employee_token = create_employee(client)

    department = create_department(client, admin_token)

    for _ in range(3):
        create_ticket(
            client,
            employee_token,
            department["id"],
        )

    response = client.get(
        "/api/tickets",
        params={
            "page": 1,
            "page_size": 2,
        },
        headers={
            "Authorization": f"Bearer {employee_token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["page"] == 1
    assert data["page_size"] == 2
    assert len(data["tickets"]) <= 2
    assert data["total"] >= 3


# ============================================================
# EMPLOYEE UPDATE OWN TICKET
# ============================================================

def test_employee_can_update_own_ticket(client):
    admin_token = create_admin(client)
    employee_token = create_employee(client)

    department = create_department(client, admin_token)

    ticket = create_ticket(
        client,
        employee_token,
        department["id"],
    )

    response = client.put(
        f"/api/tickets/{ticket['id']}",
        json={
            "title": "Updated Ticket Title",
            "description": "Updated description",
            "priority": "HIGH",
        },
        headers={
            "Authorization": f"Bearer {employee_token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["title"] == "Updated Ticket Title"
    assert data["description"] == "Updated description"
    assert data["priority"] == "HIGH"
    assert data["status"] == "OPEN"


# ============================================================
# EMPLOYEE CANNOT UPDATE ANOTHER USER'S TICKET
# ============================================================

def test_employee_cannot_update_another_users_ticket(client):
    admin_token = create_admin(client)

    employee1_token = create_employee(client)
    employee2_token = create_employee(client)

    department = create_department(client, admin_token)

    ticket = create_ticket(
        client,
        employee1_token,
        department["id"],
    )

    response = client.put(
        f"/api/tickets/{ticket['id']}",
        json={
            "title": "Unauthorized Update",
        },
        headers={
            "Authorization": f"Bearer {employee2_token}"
        },
    )

    assert response.status_code == 403


# ============================================================
# EMPLOYEE CANNOT DELETE
# ============================================================

def test_employee_cannot_delete_ticket(client):
    admin_token = create_admin(client)
    employee_token = create_employee(client)

    department = create_department(client, admin_token)

    ticket = create_ticket(
        client,
        employee_token,
        department["id"],
    )

    response = client.delete(
        f"/api/tickets/{ticket['id']}",
        headers={
            "Authorization": f"Bearer {employee_token}"
        },
    )

    assert response.status_code == 403


# ============================================================
# ADMIN CAN DELETE
# ============================================================

def test_admin_can_delete_ticket(client):
    admin_token = create_admin(client)
    employee_token = create_employee(client)

    department = create_department(client, admin_token)

    ticket = create_ticket(
        client,
        employee_token,
        department["id"],
    )

    response = client.delete(
        f"/api/tickets/{ticket['id']}",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code in [200, 204]


# ============================================================
# INVALID DEPARTMENT
# ============================================================

def test_invalid_department(client):
    employee_token = create_employee(client)

    response = client.post(
        "/api/tickets",
        json={
            "title": "Invalid Department Ticket",
            "description": "Test description",
            "department_id": 999999,
            "priority": "MEDIUM",
        },
        headers={
            "Authorization": f"Bearer {employee_token}"
        },
    )

    assert response.status_code in [400, 404]


# ============================================================
# PROJECT MUST BELONG TO DEPARTMENT
# ============================================================

def test_project_must_belong_to_department(client):
    admin_token = create_admin(client)
    employee_token = create_employee(client)

    department1 = create_department(client, admin_token)
    department2 = create_department(client, admin_token)

    project = create_project(
        client,
        admin_token,
        department1["id"],
    )

    response = client.post(
        "/api/tickets",
        json={
            "title": "Wrong Department Project",
            "description": "Test description",
            "department_id": department2["id"],
            "project_id": project["id"],
            "priority": "MEDIUM",
        },
        headers={
            "Authorization": f"Bearer {employee_token}"
        },
    )

    assert response.status_code in [400, 404]


# ============================================================
# INVALID PROJECT
# ============================================================

def test_invalid_project(client):
    admin_token = create_admin(client)
    employee_token = create_employee(client)

    department = create_department(client, admin_token)

    response = client.post(
        "/api/tickets",
        json={
            "title": "Invalid Project Ticket",
            "description": "Test description",
            "department_id": department["id"],
            "project_id": 999999,
            "priority": "MEDIUM",
        },
        headers={
            "Authorization": f"Bearer {employee_token}"
        },
    )

    assert response.status_code in [400, 404]


# ============================================================
# INVALID PRIORITY
# ============================================================

def test_invalid_priority(client):
    admin_token = create_admin(client)
    employee_token = create_employee(client)

    department = create_department(client, admin_token)

    response = client.post(
        "/api/tickets",
        json={
            "title": "Invalid Priority Ticket",
            "description": "Test description",
            "department_id": department["id"],
            "priority": "INVALID_PRIORITY",
        },
        headers={
            "Authorization": f"Bearer {employee_token}"
        },
    )

    assert response.status_code == 400


# ============================================================
# STATUS CANNOT BE UPDATED THROUGH NORMAL TICKET UPDATE
# ============================================================

def test_ticket_status_cannot_be_updated_through_ticket_update(client):
    admin_token = create_admin(client)
    employee_token = create_employee(client)

    department = create_department(client, admin_token)

    ticket = create_ticket(
        client,
        employee_token,
        department["id"],
    )

    response = client.put(
        f"/api/tickets/{ticket['id']}",
        json={
            "status": "CLOSED",
        },
        headers={
            "Authorization": f"Bearer {employee_token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    # Status must remain OPEN because workflow API
    # is responsible for changing ticket status.
    assert data["status"] == "OPEN"