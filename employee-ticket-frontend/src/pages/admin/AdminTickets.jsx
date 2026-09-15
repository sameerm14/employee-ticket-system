import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import api from "../../services/api";
import "./AdminTickets.css";

function AdminTickets() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);

  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTickets();
  }, [page, departmentId, projectId, priority, status]);

  useEffect(() => {
    fetchDepartments();
    fetchProjects();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        page_size: pageSize,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (departmentId) {
        params.department_id = Number(departmentId);
      }

      if (projectId) {
        params.project_id = Number(projectId);
      }

      if (priority) {
        params.priority = priority;
      }

      if (status) {
        params.status = status;
      }

      const response = await api.get("/api/tickets", {
        params,
      });

      setTickets(response.data.tickets || []);
      setTotalPages(response.data.total_pages || 1);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/api/departments", {
        params: {
          page: 1,
          page_size: 100,
          is_active: true,
        },
      });

      setDepartments(response.data.departments || []);
    } catch (err) {
      console.error("Failed to load departments.", err);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get("/api/projects", {
        params: {
          page: 1,
          page_size: 100,
        },
      });

      setProjects(response.data.projects || []);
    } catch (err) {
      console.error("Failed to load projects.", err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTickets();
  };

  const getDepartmentName = (id) => {
    const department = departments.find((item) => item.id === id);

    return department ? department.name : `Department #${id}`;
  };

  const getProjectName = (id) => {
    if (!id) {
      return "No Project";
    }

    const project = projects.find((item) => item.id === id);

    return project ? project.name : `Project #${id}`;
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  return (
    <Layout>
      <div className="admin-tickets-page">
        {/* Header */}
        <div className="admin-tickets-header">
          <div>
            <div className="admin-tickets-eyebrow">
              ADMIN CONTROL CENTER · SUPPORT OPERATIONS
            </div>

            <h1>Ticket Management</h1>

            <p>Monitor, filter, and manage all employee support tickets.</p>
          </div>

          <div className="admin-tickets-header-badge">
            <span className="admin-tickets-header-dot"></span>
            Ticket Operations
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="admin-tickets-alert">
            <div className="admin-tickets-alert-icon">!</div>

            <div>
              <strong>Unable to load tickets</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <section className="admin-tickets-card admin-tickets-filter-card">
          <div className="admin-tickets-card-header">
            <div>
              <span>SEARCH & FILTERS</span>
              <h2>Ticket Discovery</h2>
            </div>
          </div>

          <form onSubmit={handleSearch}>
            <div className="admin-tickets-filter-grid">
              <div className="admin-tickets-field search-field">
                <label>Search</label>

                <input
                  type="text"
                  placeholder="Ticket number or title"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="admin-tickets-field">
                <label>Department</label>

                <select
                  value={departmentId}
                  onChange={(e) => {
                    setDepartmentId(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Departments</option>

                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-tickets-field">
                <label>Project</label>

                <select
                  value={projectId}
                  onChange={(e) => {
                    setProjectId(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Projects</option>

                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-tickets-field">
                <label>Priority</label>

                <select
                  value={priority}
                  onChange={(e) => {
                    setPriority(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div className="admin-tickets-field">
                <label>Status</label>

                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                  <option value="REOPENED">Reopened</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div className="admin-tickets-field admin-tickets-search-action">
                <label>&nbsp;</label>

                <button type="submit" className="admin-tickets-search-btn">
                  Search Tickets
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* Tickets */}
        <section className="admin-tickets-card">
          <div className="admin-tickets-card-header">
            <div>
              <span>SUPPORT QUEUE</span>
              <h2>All Tickets</h2>
            </div>

            {!loading && (
              <div className="admin-tickets-count">
                {tickets.length} on this page
              </div>
            )}
          </div>

          {loading ? (
            <div className="admin-tickets-loading">
              <div className="admin-tickets-spinner"></div>

              <strong>Loading tickets</strong>

              <span>Fetching support ticket records...</span>
            </div>
          ) : tickets.length === 0 ? (
            <div className="admin-tickets-empty">
              <div className="admin-tickets-empty-icon">T</div>

              <strong>No tickets found</strong>

              <p>No tickets match the selected search and filter criteria.</p>
            </div>
          ) : (
            <div className="admin-tickets-table-wrap">
              <table className="admin-tickets-table">
                <thead>
                  <tr>
                    <th>TICKET</th>
                    <th>TITLE</th>
                    <th>DEPARTMENT</th>
                    <th>PROJECT</th>
                    <th>PRIORITY</th>
                    <th>STATUS</th>
                    <th>CREATED BY</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td>
                        <strong className="admin-tickets-number">
                          {ticket.ticket_number}
                        </strong>
                      </td>

                      <td>
                        <div className="admin-tickets-title">
                          {ticket.title}
                        </div>
                      </td>

                      <td>
                        <span className="admin-tickets-department">
                          {getDepartmentName(ticket.department_id)}
                        </span>
                      </td>

                      <td>
                        <span className="admin-tickets-project">
                          {getProjectName(ticket.project_id)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`admin-tickets-priority ${ticket.priority.toLowerCase()}`}
                        >
                          <i></i>
                          {ticket.priority}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`admin-tickets-status ${ticket.status
                            .toLowerCase()
                            .replace("_", "-")}`}
                        >
                          {ticket.status.replace("_", " ")}
                        </span>
                      </td>

                      <td>
                        <span className="admin-tickets-created-by">
                          User #{ticket.created_by}
                        </span>
                      </td>

                      <td>
                        <button
                          className="admin-tickets-view-btn"
                          onClick={() =>
                            navigate(`/admin/tickets/${ticket.id}`)
                          }
                        >
                          View Ticket
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Pagination */}
        <div className="admin-tickets-pagination">
          <button
            className="admin-tickets-page-btn"
            onClick={handlePreviousPage}
            disabled={page === 1}
          >
            ← Previous
          </button>

          <div className="admin-tickets-page-indicator">
            <span>PAGE</span>
            <strong>{page}</strong>
            <small>OF {totalPages}</small>
          </div>

          <button
            className="admin-tickets-page-btn"
            onClick={handleNextPage}
            disabled={page === totalPages}
          >
            Next →
          </button>
        </div>
      </div>
    </Layout>
  );
}

export default AdminTickets;
