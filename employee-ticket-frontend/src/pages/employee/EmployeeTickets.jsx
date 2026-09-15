import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/Layout";
import api from "../../services/api";
import "./EmployeeTickets.css";

function EmployeeTickets() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchTickets();
  }, [page, search, status, priority]);

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

      if (status) {
        params.status = status;
      }

      if (priority) {
        params.priority = priority;
      }

      const response = await api.get("/api/tickets", {
        params,
      });

      setTickets(response.data.tickets || []);
      setTotalPages(response.data.total_pages || 0);
    } catch (err) {
      console.error(err);

      setError(err.response?.data?.detail || "Unable to load tickets.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    setPage(1);
  };

  const handlePriorityChange = (event) => {
    setPriority(event.target.value);
    setPage(1);
  };

  const getStatusClass = (ticketStatus) => {
    const statusMap = {
      OPEN: "employee-ticket-badge-open",
      ASSIGNED: "employee-ticket-badge-assigned",
      IN_PROGRESS: "employee-ticket-badge-progress",
      RESOLVED: "employee-ticket-badge-resolved",
      CLOSED: "employee-ticket-badge-closed",
      ON_HOLD: "employee-ticket-badge-hold",
      REJECTED: "employee-ticket-badge-rejected",
      REOPENED: "employee-ticket-badge-open",
    };

    return statusMap[ticketStatus] || "employee-ticket-badge-default";
  };

  const getPriorityClass = (ticketPriority) => {
    const priorityMap = {
      CRITICAL: "employee-ticket-badge-critical",
      HIGH: "employee-ticket-badge-high",
      MEDIUM: "employee-ticket-badge-medium",
      LOW: "employee-ticket-badge-low",
    };

    return priorityMap[ticketPriority] || "employee-ticket-badge-default";
  };

  const formatStatus = (value) => {
    return value.replace(/_/g, " ");
  };

  return (
    <Layout>
      <div className="employee-tickets-page">
        {/* PAGE HEADER */}
        <div className="employee-tickets-header">
          <div>
            <span className="employee-tickets-eyebrow">SUPPORT CENTER</span>

            <h1>My Tickets</h1>

            <p>View and track the support tickets you created.</p>
          </div>

          <button
            type="button"
            className="employee-create-ticket-btn"
            onClick={() => navigate("/employee/tickets/create")}
          >
            <span className="employee-create-ticket-icon">+</span>
            Create Ticket
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="employee-tickets-error">
            <div className="employee-tickets-error-icon">!</div>

            <div className="employee-tickets-error-content">
              <strong>Something went wrong</strong>
              <p>{error}</p>
            </div>

            <button
              type="button"
              className="employee-tickets-error-close"
              onClick={() => setError("")}
            >
              ×
            </button>
          </div>
        )}

        {/* FILTER CARD */}
        <div className="employee-ticket-filter-card">
          <div className="employee-ticket-filter-header">
            <div>
              <span className="employee-ticket-filter-kicker">FILTERS</span>

              <h2>Find a ticket</h2>
            </div>

            <span className="employee-ticket-count">
              {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="employee-ticket-filters">
            <div className="employee-ticket-search-wrapper">
              <span className="employee-ticket-search-icon">⌕</span>

              <input
                type="text"
                className="employee-ticket-search"
                placeholder="Search ticket number or title..."
                value={search}
                onChange={handleSearchChange}
              />
            </div>

            <select
              className="employee-ticket-filter-select"
              value={status}
              onChange={handleStatusChange}
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

            <select
              className="employee-ticket-filter-select"
              value={priority}
              onChange={handlePriorityChange}
            >
              <option value="">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* TICKET CONTENT */}
        <div className="employee-ticket-list-card">
          <div className="employee-ticket-list-header">
            <div>
              <span className="employee-ticket-list-kicker">TICKET LIST</span>

              <h2>Your support tickets</h2>
            </div>

            {!loading && tickets.length > 0 && (
              <span className="employee-ticket-page-label">
                Page {page} of {totalPages}
              </span>
            )}
          </div>

          {loading ? (
            <div className="employee-tickets-loading">
              <div className="employee-tickets-spinner"></div>
              <p>Loading tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="employee-tickets-empty">
              <div className="employee-tickets-empty-icon">✓</div>

              <h3>No tickets found</h3>

              <p>You haven't created any tickets matching these filters.</p>

              <button
                type="button"
                className="employee-empty-create-btn"
                onClick={() => navigate("/employee/tickets/create")}
              >
                Create a ticket
              </button>
            </div>
          ) : (
            <>
              <div className="employee-ticket-table-wrapper">
                <table className="employee-ticket-table">
                  <thead>
                    <tr>
                      <th>Ticket</th>
                      <th>Title</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {tickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td>
                          <div className="employee-ticket-number">
                            {ticket.ticket_number}
                          </div>
                        </td>

                        <td>
                          <div className="employee-ticket-title">
                            {ticket.title}
                          </div>
                        </td>

                        <td>
                          <span
                            className={`employee-ticket-badge ${getPriorityClass(
                              ticket.priority,
                            )}`}
                          >
                            <span className="employee-ticket-badge-dot"></span>
                            {ticket.priority}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`employee-ticket-badge ${getStatusClass(
                              ticket.status,
                            )}`}
                          >
                            <span className="employee-ticket-badge-dot"></span>
                            {formatStatus(ticket.status)}
                          </span>
                        </td>

                        <td>
                          <span className="employee-ticket-date">
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="employee-view-ticket-btn"
                            onClick={() =>
                              navigate(`/employee/tickets/${ticket.id}`)
                            }
                          >
                            View
                            <span>→</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              {totalPages > 0 && (
                <div className="employee-ticket-pagination">
                  <span>
                    Page <strong>{page}</strong> of{" "}
                    <strong>{totalPages}</strong>
                  </span>

                  <div className="employee-ticket-pagination-buttons">
                    <button
                      type="button"
                      className="employee-ticket-pagination-btn"
                      disabled={page <= 1}
                      onClick={() => setPage((current) => current - 1)}
                    >
                      ← Previous
                    </button>

                    <button
                      type="button"
                      className="employee-ticket-pagination-btn"
                      disabled={page >= totalPages || totalPages === 0}
                      onClick={() => setPage((current) => current + 1)}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default EmployeeTickets;
