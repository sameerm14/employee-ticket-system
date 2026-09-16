from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.auth import router as auth_router
from app.routes.users import router as user_router
from app.routes.departments import router as department_router
from app.routes.teams import router as team_router
from app.routes.projects import router as project_router
from app.routes.tickets import router as ticket_router
from app.routes.assignments import router as assignment_router
from app.routes.workflow import router as workflow_router
from app.routes.comments import router as comment_router
from app.routes.attachments import router as attachment_router
from app.routes.notifications import router as notification_router
from app.routes.dashboard import router as dashboard_router


app = FastAPI(
    title="Employee Ticket & Workflow Management System",
    version="1.0.0"
)


# CORS - allow React frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://employee-ticket-frontend.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 1. Authentication
app.include_router(auth_router)

# 2. Users
app.include_router(user_router)

# 3. Organization structure
app.include_router(department_router)
app.include_router(team_router)
app.include_router(project_router)

# 4. Tickets
app.include_router(ticket_router)

# 5. Ticket assignment
app.include_router(assignment_router)

# 6. Ticket workflow / status
app.include_router(workflow_router)

# 7. Ticket discussions
app.include_router(comment_router)

# 8. Ticket files
app.include_router(attachment_router)

# 9. Notifications
app.include_router(notification_router)

# 10. Dashboards
app.include_router(dashboard_router)


@app.get("/")
def root():
    return {
        "message": "Employee Ticket Management API is running"
    }