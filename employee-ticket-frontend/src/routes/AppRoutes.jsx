import { Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/auth/Login";

import EmployeeDashboard from "../pages/employee/EmployeeDashboard";
import EmployeeTickets from "../pages/employee/EmployeeTickets";
import EmployeeTicketDetail from "../pages/employee/EmployeeTicketDetail";
import EmployeeNotifications from "../pages/employee/EmployeeNotifications";
import CreateTicket from "../pages/employee/CreateTicket";

import TeamLeadDashboard from "../pages/team-lead/TeamLeadDashboard";
import TeamLeadTickets from "../pages/team-lead/TeamLeadTickets";
import TeamLeadTicketDetail from "../pages/team-lead/TeamLeadTicketDetail";
import TeamLeadTeam from "../pages/team-lead/TeamLeadTeam";
import TeamLeadNotifications from "../pages/team-lead/TeamLeadNotifications";

import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminDepartments from "../pages/admin/AdminDepartments";
import AdminTeams from "../pages/admin/AdminTeams";
import AdminProjects from "../pages/admin/AdminProjects";
import AdminTickets from "../pages/admin/AdminTickets";
import AdminTicketDetail from "../pages/admin/AdminTicketDetail";
import AdminNotifications from "../pages/admin/AdminNotifications";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/users" element={<AdminUsers />} />
      <Route path="/admin/departments" element={<AdminDepartments />} />
      <Route path="/admin/teams" element={<AdminTeams />} />
      <Route path="/admin/projects" element={<AdminProjects />} />
      <Route path="/admin/tickets" element={<AdminTickets />} />
      <Route path="/admin/tickets/:id" element={<AdminTicketDetail />} />
      <Route path="/admin/notifications" element={<AdminNotifications />} />

      {/* Team Lead */}
      <Route path="/team-lead/dashboard" element={<TeamLeadDashboard />} />
      <Route path="/team-lead/tickets" element={<TeamLeadTickets />} />
      <Route path="/team-lead/tickets/:id" element={<TeamLeadTicketDetail />} />
      <Route path="/team-lead/team" element={<TeamLeadTeam />} />
      <Route
        path="/team-lead/notifications"
        element={<TeamLeadNotifications />}
      />

      {/* Employee */}
      <Route path="/employee/dashboard" element={<EmployeeDashboard />} />

      <Route path="/employee/tickets" element={<EmployeeTickets />} />

      <Route path="/employee/tickets/create" element={<CreateTicket />} />

      <Route path="/employee/tickets/:id" element={<EmployeeTicketDetail />} />

      <Route
        path="/employee/notifications"
        element={<EmployeeNotifications />}
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;
