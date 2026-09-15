import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../services/api";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/dashboard/admin");

      setDashboard(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load admin dashboard.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="admin-dashboard-state">
          <div className="admin-dashboard-spinner"></div>

          <h3>Loading admin dashboard</h3>

          <p>Preparing system overview and reports...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="admin-dashboard-error">
          <div className="admin-dashboard-error-icon">!</div>

          <div>
            <strong>Unable to load dashboard</strong>
            <p>{error}</p>
          </div>

          <button onClick={fetchDashboard}>Retry</button>
        </div>
      </Layout>
    );
  }

  if (!dashboard) {
    return (
      <Layout>
        <div className="admin-dashboard-empty">
          <div className="admin-dashboard-empty-icon">◌</div>

          <h3>No dashboard data available</h3>

          <p>There is currently no information to display.</p>
        </div>
      </Layout>
    );
  }

  const overview = dashboard.overview || {};
  const ticketStatus = dashboard.ticket_status || {};
  const ticketPriority = dashboard.ticket_priority || {};
  const resolution = dashboard.resolution_summary || {};

  return (
    <Layout>
      <div className="admin-dashboard">
        {/* =====================================================
            HEADER
        ====================================================== */}
        <div className="admin-dashboard-header">
          <div>
            <div className="admin-dashboard-eyebrow">ADMINISTRATION CENTER</div>

            <h1>Admin Dashboard</h1>

            <p>
              System-wide overview of users, support activity, teams, projects,
              and ticket performance.
            </p>
          </div>

          <button
            className="admin-refresh-btn"
            onClick={fetchDashboard}
            disabled={loading}
          >
            <span>↻</span>
            Refresh Data
          </button>
        </div>

        {/* =====================================================
            OVERVIEW
        ====================================================== */}
        <section className="admin-dashboard-section">
          <div className="admin-section-heading">
            <div>
              <span>PLATFORM OVERVIEW</span>
              <h2>System Statistics</h2>
            </div>
          </div>

          <div className="admin-stats-grid">
            <div className="admin-stat-card users">
              <div className="admin-stat-top">
                <div className="admin-stat-icon">U</div>
                <span>USERS</span>
              </div>

              <div className="admin-stat-value">
                {overview.total_users ?? 0}
              </div>

              <p>Total registered users</p>
            </div>

            <div className="admin-stat-card departments">
              <div className="admin-stat-top">
                <div className="admin-stat-icon">D</div>
                <span>STRUCTURE</span>
              </div>

              <div className="admin-stat-value">
                {overview.total_departments ?? 0}
              </div>

              <p>Active departments</p>
            </div>

            <div className="admin-stat-card teams">
              <div className="admin-stat-top">
                <div className="admin-stat-icon">T</div>
                <span>TEAMS</span>
              </div>

              <div className="admin-stat-value">
                {overview.total_teams ?? 0}
              </div>

              <p>Total support teams</p>
            </div>

            <div className="admin-stat-card projects">
              <div className="admin-stat-top">
                <div className="admin-stat-icon">P</div>
                <span>PROJECTS</span>
              </div>

              <div className="admin-stat-value">
                {overview.total_projects ?? 0}
              </div>

              <p>Managed projects</p>
            </div>

            <div className="admin-stat-card tickets">
              <div className="admin-stat-top">
                <div className="admin-stat-icon">#</div>
                <span>TICKETS</span>
              </div>

              <div className="admin-stat-value">
                {overview.total_tickets ?? 0}
              </div>

              <p>Total support tickets</p>
            </div>
          </div>
        </section>

        {/* =====================================================
            STATUS + PRIORITY
        ====================================================== */}
        <div className="admin-analysis-grid">
          {/* Ticket Status */}
          <section className="admin-panel status-panel">
            <div className="admin-panel-header">
              <div>
                <span>WORKFLOW ANALYSIS</span>
                <h2>Tickets by Status</h2>
              </div>

              <div className="admin-panel-icon indigo">S</div>
            </div>

            <div className="admin-summary-list">
              {Object.entries(ticketStatus).length === 0 ? (
                <div className="admin-inline-empty">
                  No status data available.
                </div>
              ) : (
                Object.entries(ticketStatus).map(([status, count]) => (
                  <div className="admin-summary-row" key={status}>
                    <div className="admin-summary-label">
                      <span
                        className={`admin-status-dot ${status
                          .toLowerCase()
                          .replace("_", "-")}`}
                      ></span>

                      <span>{status}</span>
                    </div>

                    <strong>{count}</strong>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Ticket Priority */}
          <section className="admin-panel priority-panel">
            <div className="admin-panel-header">
              <div>
                <span>RISK ANALYSIS</span>
                <h2>Tickets by Priority</h2>
              </div>

              <div className="admin-panel-icon gold">!</div>
            </div>

            <div className="admin-summary-list">
              {Object.entries(ticketPriority).length === 0 ? (
                <div className="admin-inline-empty">
                  No priority data available.
                </div>
              ) : (
                Object.entries(ticketPriority).map(([priority, count]) => (
                  <div className="admin-summary-row" key={priority}>
                    <div className="admin-summary-label">
                      <span
                        className={`admin-priority-dot ${priority.toLowerCase()}`}
                      ></span>

                      <span>{priority}</span>
                    </div>

                    <strong>{count}</strong>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* =====================================================
            DEPARTMENT
        ====================================================== */}
        <section className="admin-panel admin-table-panel">
          <div className="admin-panel-header">
            <div>
              <span>ORGANIZATIONAL ANALYSIS</span>
              <h2>Tickets by Department</h2>
            </div>

            <div className="admin-panel-icon emerald">D</div>
          </div>

          {dashboard.tickets_by_department?.length === 0 ? (
            <div className="admin-inline-empty large">
              No department data available.
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Tickets</th>
                  </tr>
                </thead>

                <tbody>
                  {dashboard.tickets_by_department?.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <div className="admin-table-name">
                          <span className="admin-table-avatar department">
                            D
                          </span>

                          <span>
                            {item.department_name ??
                              item.name ??
                              `Department #${item.department_id}`}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="admin-count-badge blue">
                          {item.ticket_count ?? item.count ?? 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* =====================================================
            PROJECT
        ====================================================== */}
        <section className="admin-panel admin-table-panel">
          <div className="admin-panel-header">
            <div>
              <span>PROJECT ANALYSIS</span>
              <h2>Tickets by Project</h2>
            </div>

            <div className="admin-panel-icon purple">P</div>
          </div>

          {dashboard.tickets_by_project?.length === 0 ? (
            <div className="admin-inline-empty large">
              No project data available.
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Tickets</th>
                  </tr>
                </thead>

                <tbody>
                  {dashboard.tickets_by_project?.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <div className="admin-table-name">
                          <span className="admin-table-avatar project">P</span>

                          <span>
                            {item.project_name ??
                              item.name ??
                              `Project #${item.project_id}`}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="admin-count-badge purple">
                          {item.ticket_count ?? item.count ?? 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* =====================================================
            TEAM
        ====================================================== */}
        <section className="admin-panel admin-table-panel">
          <div className="admin-panel-header">
            <div>
              <span>TEAM PERFORMANCE</span>
              <h2>Tickets by Team</h2>
            </div>

            <div className="admin-panel-icon teal">T</div>
          </div>

          {dashboard.tickets_by_team?.length === 0 ? (
            <div className="admin-inline-empty large">
              No team data available.
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Tickets</th>
                  </tr>
                </thead>

                <tbody>
                  {dashboard.tickets_by_team?.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <div className="admin-table-name">
                          <span className="admin-table-avatar team">T</span>

                          <span>
                            {item.team_name ??
                              item.name ??
                              `Team #${item.team_id}`}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="admin-count-badge teal">
                          {item.ticket_count ?? item.count ?? 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* =====================================================
            RESOLUTION SUMMARY
        ====================================================== */}
        <section className="admin-panel admin-resolution-panel">
          <div className="admin-panel-header">
            <div>
              <span>PERFORMANCE METRICS</span>
              <h2>Resolution Summary</h2>
            </div>

            <div className="admin-panel-icon green">✓</div>
          </div>

          <div className="admin-resolution-grid">
            <div className="admin-resolution-card resolved">
              <span>RESOLVED TICKETS</span>

              <strong>{resolution.resolved_tickets ?? 0}</strong>

              <p>Tickets successfully resolved</p>
            </div>

            <div className="admin-resolution-card closed">
              <span>CLOSED TICKETS</span>

              <strong>{resolution.closed_tickets ?? 0}</strong>

              <p>Tickets fully completed</p>
            </div>

            <div className="admin-resolution-card time">
              <span>AVERAGE RESOLUTION TIME</span>

              <strong>{resolution.average_resolution_time ?? "N/A"}</strong>

              <p>Average time required to resolve</p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default AdminDashboard;
