import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import api from "../../services/api";
import "./EmployeeDashboard.css";
import { useAuth } from "../../context/AuthContext";

function EmployeeDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { user } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/dashboard/employee");

      setDashboard(response.data);
    } catch (err) {
      console.error(err);

      setError(err.response?.data?.detail || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="employee-dashboard-state">
          <div className="employee-dashboard-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="employee-dashboard-error">
          <div className="employee-dashboard-error-icon">!</div>

          <div>
            <strong>Unable to load dashboard</strong>
            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={fetchDashboard}
            className="employee-dashboard-retry"
          >
            Try again
          </button>
        </div>
      </Layout>
    );
  }

  const ticketSummary = dashboard?.ticket_summary || {};
  const prioritySummary = dashboard?.priority_summary || {};
  const assignmentSummary = dashboard?.assignment_summary || {};
  const departmentSummary = dashboard?.department_summary || {};

  const totalTickets = ticketSummary.total || 0;
  const openTickets = ticketSummary.open || 0;
  const inProgressTickets = ticketSummary.in_progress || 0;
  const resolvedTickets = ticketSummary.resolved || 0;

  return (
    <Layout>
      <div className="employee-dashboard">
        {/* Header */}
        <div className="employee-dashboard-header">
          <div>
            <span className="employee-dashboard-eyebrow">WORKSPACE</span>

            <h1>Employee Dashboard</h1>

            <p>
              Welcome back, {user?.full_name}. Here's an overview of your ticket
              activity.
            </p>
          </div>

          <button
            type="button"
            className="employee-create-ticket"
            onClick={() => navigate("/employee/tickets")}
          >
            <span className="employee-create-ticket-icon">+</span>
            <span>Create Ticket</span>
          </button>
        </div>

        {/* Statistics */}
        <div className="employee-stats-grid">
          <div className="employee-stat-card">
            <div className="employee-stat-top">
              <div className="employee-stat-icon employee-stat-icon-blue">
                ▤
              </div>

              <span className="employee-stat-badge">TOTAL</span>
            </div>

            <div className="employee-stat-value">{totalTickets}</div>

            <div className="employee-stat-label">My Tickets</div>

            <p>Tickets created by you</p>
          </div>

          <div className="employee-stat-card">
            <div className="employee-stat-top">
              <div className="employee-stat-icon employee-stat-icon-orange">
                ◷
              </div>

              <span className="employee-stat-badge">OPEN</span>
            </div>

            <div className="employee-stat-value">{openTickets}</div>

            <div className="employee-stat-label">Open Tickets</div>

            <p>Waiting to be handled</p>
          </div>

          <div className="employee-stat-card">
            <div className="employee-stat-top">
              <div className="employee-stat-icon employee-stat-icon-purple">
                ◌
              </div>

              <span className="employee-stat-badge">ACTIVE</span>
            </div>

            <div className="employee-stat-value">{inProgressTickets}</div>

            <div className="employee-stat-label">In Progress</div>

            <p>Currently being worked on</p>
          </div>

          <div className="employee-stat-card">
            <div className="employee-stat-top">
              <div className="employee-stat-icon employee-stat-icon-green">
                ✓
              </div>

              <span className="employee-stat-badge">DONE</span>
            </div>

            <div className="employee-stat-value">{resolvedTickets}</div>

            <div className="employee-stat-label">Resolved</div>

            <p>Successfully resolved</p>
          </div>
        </div>

        {/* Main dashboard content */}
        <div className="employee-dashboard-grid">
          {/* Priority Summary */}
          <div className="employee-dashboard-card">
            <div className="employee-card-header">
              <div>
                <span className="employee-card-kicker">TICKETS</span>

                <h2>Priority Summary</h2>
              </div>

              <div className="employee-card-header-icon">!</div>
            </div>

            <div className="employee-priority-list">
              <div className="employee-priority-row">
                <div className="employee-priority-name">
                  <span className="priority-dot priority-critical"></span>
                  <span>Critical</span>
                </div>

                <strong>{prioritySummary.critical || 0}</strong>
              </div>

              <div className="employee-priority-row">
                <div className="employee-priority-name">
                  <span className="priority-dot priority-high"></span>
                  <span>High</span>
                </div>

                <strong>{prioritySummary.high || 0}</strong>
              </div>

              <div className="employee-priority-row">
                <div className="employee-priority-name">
                  <span className="priority-dot priority-medium"></span>
                  <span>Medium</span>
                </div>

                <strong>{prioritySummary.medium || 0}</strong>
              </div>

              <div className="employee-priority-row">
                <div className="employee-priority-name">
                  <span className="priority-dot priority-low"></span>
                  <span>Low</span>
                </div>

                <strong>{prioritySummary.low || 0}</strong>
              </div>
            </div>
          </div>

          {/* Assignment Summary */}
          <div className="employee-dashboard-card">
            <div className="employee-card-header">
              <div>
                <span className="employee-card-kicker">WORKLOAD</span>

                <h2>Assignment Summary</h2>
              </div>

              <div className="employee-card-header-icon">♙</div>
            </div>

            <div className="employee-assignment-content">
              <div className="employee-assignment-main">
                <span>Assigned to me</span>

                <strong>{assignmentSummary.assigned_to_me || 0}</strong>

                <p>Tickets currently assigned to you</p>
              </div>

              <div className="employee-assignment-divider"></div>

              <div className="employee-assignment-secondary">
                <span>Unassigned</span>

                <strong>{assignmentSummary.unassigned || 0}</strong>

                <p>Tickets awaiting assignment</p>
              </div>
            </div>
          </div>

          {/* Department Summary */}
          <div className="employee-dashboard-card employee-dashboard-card-full">
            <div className="employee-card-header">
              <div>
                <span className="employee-card-kicker">DEPARTMENT</span>

                <h2>Department Summary</h2>
              </div>

              <div className="employee-card-header-icon">▦</div>
            </div>

            {Object.keys(departmentSummary).length === 0 ? (
              <div className="employee-empty-state">
                <div className="employee-empty-icon">▤</div>

                <strong>No department data</strong>

                <p>No department ticket data is currently available.</p>
              </div>
            ) : (
              <div className="employee-table-wrapper">
                <table className="employee-dashboard-table">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Tickets</th>
                    </tr>
                  </thead>

                  <tbody>
                    {Object.entries(departmentSummary).map(
                      ([department, count]) => (
                        <tr key={department}>
                          <td>
                            <div className="employee-department-name">
                              <span className="employee-department-dot"></span>
                              {department}
                            </div>
                          </td>

                          <td>
                            <span className="employee-ticket-count">
                              {count}
                            </span>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default EmployeeDashboard;
