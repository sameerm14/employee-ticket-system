import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Layout from "../../components/Layout";
import api from "../../services/api";
import "./TeamLeadTickets.css";

function TeamLeadTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const navigate = useNavigate();

  useEffect(() => {
    fetchTickets();
  }, [page, search, status, priority]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/tickets", {
        params: {
          page,
          page_size: pageSize,
          search: search || undefined,
          status: status || undefined,
          priority: priority || undefined,
        },
      });

      setTickets(response.data.tickets);
      setTotalPages(response.data.total_pages);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
    setPage(1);
  };

  const handlePriorityChange = (e) => {
    setPriority(e.target.value);
    setPage(1);
  };

  const getStatusClass = (ticketStatus) => {
    return `team-lead-status-badge status-${ticketStatus
      .toLowerCase()
      .replace("_", "-")}`;
  };

  const getPriorityClass = (ticketPriority) => {
    return `team-lead-priority-badge priority-${ticketPriority.toLowerCase()}`;
  };

  const formatStatus = (value) => {
    return value.replace(/_/g, " ");
  };

  return (
    <Layout>
      <div className="team-lead-tickets-page">
        {/* Header */}
        <div className="team-lead-tickets-header">
          <div>
            <span className="team-lead-tickets-eyebrow">TEAM OPERATIONS</span>

            <h1>Team Tickets</h1>

            <p>Manage and monitor tickets belonging to your department.</p>
          </div>

          <div className="team-lead-ticket-summary">
            <span className="team-lead-ticket-summary-label">
              Tickets shown
            </span>

            <strong>{tickets.length}</strong>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="team-lead-tickets-error">
            <div className="team-lead-tickets-error-icon">!</div>

            <div className="team-lead-tickets-error-content">
              <strong>Unable to load tickets</strong>
              <p>{error}</p>
            </div>

            <button
              type="button"
              className="team-lead-tickets-retry"
              onClick={fetchTickets}
            >
              Try again
            </button>

            <button
              type="button"
              className="team-lead-tickets-error-close"
              onClick={() => setError("")}
            >
              ×
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="team-lead-filter-panel">
          <div className="team-lead-filter-heading">
            <div>
              <span className="team-lead-filter-kicker">SEARCH & FILTER</span>

              <h2>Find tickets</h2>
            </div>

            {(search || status || priority) && (
              <button
                type="button"
                className="team-lead-clear-filters"
                onClick={() => {
                  setSearch("");
                  setStatus("");
                  setPriority("");
                  setPage(1);
                }}
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="team-lead-filters">
            <div className="team-lead-search-box">
              <span className="team-lead-search-icon">⌕</span>

              <input
                type="text"
                placeholder="Search ticket number or title..."
                value={search}
                onChange={handleSearchChange}
              />
            </div>

            <div className="team-lead-select-wrapper">
              <label>Status</label>

              <select value={status} onChange={handleStatusChange}>
                <option value="">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="REOPENED">Reopened</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div className="team-lead-select-wrapper">
              <label>Priority</label>

              <select value={priority} onChange={handlePriorityChange}>
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ticket List */}
        <div className="team-lead-ticket-panel">
          <div className="team-lead-ticket-panel-header">
            <div>
              <span className="team-lead-ticket-panel-kicker">TICKET LIST</span>

              <h2>Department tickets</h2>
            </div>

            {!loading && tickets.length > 0 && (
              <span className="team-lead-page-indicator">
                Page {page} of {totalPages}
              </span>
            )}
          </div>

          {loading ? (
            <div className="team-lead-tickets-loading">
              <div className="team-lead-ticket-spinner"></div>

              <h3>Loading tickets</h3>

              <p>Fetching your department's tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="team-lead-tickets-empty">
              <div className="team-lead-empty-icon">✓</div>

              <h3>No tickets found</h3>

              <p>There are no tickets matching your current filters.</p>

              {(search || status || priority) && (
                <button
                  type="button"
                  className="team-lead-empty-clear"
                  onClick={() => {
                    setSearch("");
                    setStatus("");
                    setPriority("");
                    setPage(1);
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="team-lead-table-wrapper">
                <table className="team-lead-ticket-table">
                  <thead>
                    <tr>
                      <th>Ticket</th>
                      <th>Title</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {tickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td>
                          <div className="team-lead-ticket-number">
                            {ticket.ticket_number}
                          </div>
                        </td>

                        <td>
                          <div className="team-lead-ticket-title">
                            {ticket.title}
                          </div>
                        </td>

                        <td>
                          <span className={getPriorityClass(ticket.priority)}>
                            <span className="team-lead-badge-dot"></span>
                            {ticket.priority}
                          </span>
                        </td>

                        <td>
                          <span className={getStatusClass(ticket.status)}>
                            <span className="team-lead-badge-dot"></span>
                            {formatStatus(ticket.status)}
                          </span>
                        </td>

                        <td>
                          <span className="team-lead-ticket-date">
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="team-lead-view-ticket"
                            onClick={() =>
                              navigate(`/team-lead/tickets/${ticket.id}`)
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

              {/* Pagination */}
              <div className="team-lead-ticket-pagination">
                <span className="team-lead-pagination-text">
                  Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                </span>

                <div className="team-lead-pagination-buttons">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    ← Previous
                  </button>

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default TeamLeadTickets;
