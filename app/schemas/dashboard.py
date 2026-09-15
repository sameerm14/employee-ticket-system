from pydantic import BaseModel


class UserDashboardResponse(BaseModel):
    user: dict
    ticket_summary: dict
    priority_summary: dict
    assignment_summary: dict
    department_summary: dict


class AdminDashboardResponse(BaseModel):
    overview: dict
    ticket_status: dict
    ticket_priority: dict
    tickets_by_department: list
    tickets_by_project: list
    tickets_by_team: list
    resolution_summary: dict

class TeamLeadDashboardResponse(BaseModel):
    team_lead: dict
    ticket_summary: dict
    priority_summary: dict