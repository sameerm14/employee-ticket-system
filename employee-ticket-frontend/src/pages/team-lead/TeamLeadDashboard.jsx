import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import api from "../../services/api";
import "./TeamLeadDashboard.css";

function TeamLeadDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [departmentName, setDepartmentName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/dashboard/team-lead");

      const dashboardData = response.data;

      setDashboard(dashboardData);

      // Fetch department name
      if (dashboardData.team_lead?.department_id) {
        const departmentResponse = await api.get("/api/departments");

        const departments =
          departmentResponse.data?.departments ||
          departmentResponse.data?.items ||
          departmentResponse.data ||
          [];

        const department = departments.find(
          (item) => item.id === dashboardData.team_lead.department_id,
        );

        setDepartmentName(department?.name || "Unknown Department");
      } else {
        setDepartmentName("Not assigned");
      }

      // Fetch team name
      if (dashboardData.team_lead?.team_id) {
        const teamResponse = await api.get("/api/teams");

        const teams =
          teamResponse.data?.teams ||
          teamResponse.data?.items ||
          teamResponse.data ||
          [];

        const team = teams.find(
          (item) => item.id === dashboardData.team_lead.team_id,
        );

        setTeamName(team?.name || "Unknown Team");
      } else {
        setTeamName("Not assigned");
      }
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to load Team Lead dashboard.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="team-lead-dashboard-state">
          <div className="team-lead-spinner"></div>
          <h3>Loading dashboard</h3>
          <p>Preparing your team workspace...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="team-lead-dashboard-error">
          <div className="team-lead-error-icon">!</div>

          <div>
            <strong>Unable to load dashboard</strong>
            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={fetchDashboard}
            className="team-lead-retry-btn"
          >
            Try again
          </button>
        </div>
      </Layout>
    );
  }

  const summary = dashboard.ticket_summary;
  const priority = dashboard.priority_summary;

  return (
    <Layout>
      <div className="team-lead-dashboard">
        {/* Header */}
        <div className="team-lead-dashboard-header">
          <div>
            <span className="team-lead-eyebrow">TEAM OPERATIONS</span>

            <h1>Team Lead Dashboard</h1>

            <p>
              Welcome back, {dashboard.team_lead.full_name}. Here's an overview
              of your team's ticket activity.
            </p>
          </div>

          <button
            type="button"
            className="team-lead-view-tickets-btn"
            onClick={() => navigate("/team-lead/tickets")}
          >
            <span>View Tickets</span>
            <span className="team-lead-arrow">→</span>
          </button>
        </div>

        {/* Overview */}
        <section className="team-lead-section">
          <div className="team-lead-section-heading">
            <div>
              <span className="team-lead-section-kicker">OVERVIEW</span>

              <h2>Ticket workload</h2>
            </div>
          </div>

          <div className="team-lead-stats-grid">
            <div className="team-lead-stat-card total">
              <div className="team-lead-stat-top">
                <span>Total Tickets</span>
                <div className="team-lead-stat-icon">▣</div>
              </div>

              <strong>{summary.total}</strong>

              <p>Tickets in your department</p>
            </div>

            <div className="team-lead-stat-card open">
              <div className="team-lead-stat-top">
                <span>Open</span>
                <div className="team-lead-stat-icon">○</div>
              </div>

              <strong>{summary.open}</strong>

              <p>Waiting to be assigned</p>
            </div>

            <div className="team-lead-stat-card assigned">
              <div className="team-lead-stat-top">
                <span>Assigned</span>
                <div className="team-lead-stat-icon">↗</div>
              </div>

              <strong>{summary.assigned}</strong>

              <p>Currently assigned tickets</p>
            </div>

            <div className="team-lead-stat-card progress">
              <div className="team-lead-stat-top">
                <span>In Progress</span>
                <div className="team-lead-stat-icon">◐</div>
              </div>

              <strong>{summary.in_progress}</strong>

              <p>Currently being worked on</p>
            </div>

            <div className="team-lead-stat-card resolved">
              <div className="team-lead-stat-top">
                <span>Resolved</span>
                <div className="team-lead-stat-icon">✓</div>
              </div>

              <strong>{summary.resolved}</strong>

              <p>Waiting for closure</p>
            </div>

            <div className="team-lead-stat-card closed">
              <div className="team-lead-stat-top">
                <span>Closed</span>
                <div className="team-lead-stat-icon">✓</div>
              </div>

              <strong>{summary.closed}</strong>

              <p>Successfully completed</p>
            </div>
          </div>
        </section>

        {/* Status + Priority */}
        <div className="team-lead-analysis-grid">
          <div className="team-lead-panel">
            <div className="team-lead-panel-header">
              <div>
                <span className="team-lead-panel-kicker">WORKFLOW</span>

                <h2>Ticket Status</h2>
              </div>

              <span className="team-lead-panel-badge">Current</span>
            </div>

            <div className="team-lead-status-list">
              <div className="team-lead-status-row">
                <div>
                  <span className="team-lead-status-dot open"></span>
                  <span>Open</span>
                </div>
                <strong>{summary.open}</strong>
              </div>

              <div className="team-lead-status-row">
                <div>
                  <span className="team-lead-status-dot assigned"></span>
                  <span>Assigned</span>
                </div>
                <strong>{summary.assigned}</strong>
              </div>

              <div className="team-lead-status-row">
                <div>
                  <span className="team-lead-status-dot progress"></span>
                  <span>In Progress</span>
                </div>
                <strong>{summary.in_progress}</strong>
              </div>

              <div className="team-lead-status-row">
                <div>
                  <span className="team-lead-status-dot resolved"></span>
                  <span>Resolved</span>
                </div>
                <strong>{summary.resolved}</strong>
              </div>

              <div className="team-lead-status-row">
                <div>
                  <span className="team-lead-status-dot closed"></span>
                  <span>Closed</span>
                </div>
                <strong>{summary.closed}</strong>
              </div>

              <div className="team-lead-status-row">
                <div>
                  <span className="team-lead-status-dot hold"></span>
                  <span>On Hold</span>
                </div>
                <strong>{summary.on_hold}</strong>
              </div>
            </div>
          </div>

          <div className="team-lead-panel">
            <div className="team-lead-panel-header">
              <div>
                <span className="team-lead-panel-kicker">PRIORITY</span>

                <h2>Priority Summary</h2>
              </div>

              <span className="team-lead-panel-badge">Tickets</span>
            </div>

            <div className="team-lead-priority-list">
              <div className="team-lead-priority-row">
                <div className="team-lead-priority-label">
                  <span className="priority-marker low"></span>
                  <span>Low</span>
                </div>

                <strong>{priority.low}</strong>
              </div>

              <div className="team-lead-priority-row">
                <div className="team-lead-priority-label">
                  <span className="priority-marker medium"></span>
                  <span>Medium</span>
                </div>

                <strong>{priority.medium}</strong>
              </div>

              <div className="team-lead-priority-row">
                <div className="team-lead-priority-label">
                  <span className="priority-marker high"></span>
                  <span>High</span>
                </div>

                <strong>{priority.high}</strong>
              </div>

              <div className="team-lead-priority-row">
                <div className="team-lead-priority-label">
                  <span className="priority-marker critical"></span>
                  <span>Critical</span>
                </div>

                <strong>{priority.critical}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Team Lead Information */}
        <div className="team-lead-profile-panel">
          <div className="team-lead-profile-header">
            <div className="team-lead-profile-avatar">
              {dashboard.team_lead.full_name?.charAt(0)?.toUpperCase()}
            </div>

            <div>
              <span className="team-lead-panel-kicker">ACCOUNT</span>

              <h2>Team Lead Information</h2>
              <p>Your current team and department details.</p>
            </div>
          </div>

          <div className="team-lead-profile-grid">
            <div className="team-lead-profile-item">
              <span>Name</span>
              <strong>{dashboard.team_lead.full_name}</strong>
            </div>

            <div className="team-lead-profile-item">
              <span>Email</span>
              <strong>{dashboard.team_lead.email}</strong>
            </div>

            <div className="team-lead-profile-item">
              <span>Department</span>
              <strong>{departmentName || "Loading..."}</strong>
            </div>

            <div className="team-lead-profile-item">
              <span>Team</span>
              <strong>{teamName || "Loading..."}</strong>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default TeamLeadDashboard;
