import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout";
import api from "../../services/api";
import "./AdminTicketDetail.css";

function AdminTicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [history, setHistory] = useState([]);

  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);

  const [selectedUser, setSelectedUser] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [statusComment, setStatusComment] = useState("");

  const [comment, setComment] = useState("");
  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [showDeleteAttachmentModal, setShowDeleteAttachmentModal] =
    useState(false);
  const [showDeleteTicketModal, setShowDeleteTicketModal] = useState(false);
  const [selectedAttachmentId, setSelectedAttachmentId] = useState(null);

  const statuses = [
    "OPEN",
    "ASSIGNED",
    "IN_PROGRESS",
    "RESOLVED",
    "CLOSED",
    "REOPENED",
    "ON_HOLD",
    "REJECTED",
  ];

  useEffect(() => {
    loadTicketData();
    loadUsers();
    loadTeams();
    loadDepartments();
    loadProjects();
  }, [id]);

  const loadTicketData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        ticketResponse,
        commentsResponse,
        attachmentsResponse,
        historyResponse,
      ] = await Promise.all([
        api.get(`/api/tickets/${id}`),
        api.get(`/api/comments/tickets/${id}`),
        api.get(`/api/attachments/tickets/${id}`),
        api.get(`/api/workflow/tickets/${id}/history`),
      ]);

      setTicket(ticketResponse.data);
      setComments(commentsResponse.data || []);
      setAttachments(attachmentsResponse.data || []);
      setHistory(historyResponse.data || []);

      setNewStatus(ticketResponse.data.status);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load ticket.");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get("/api/users", {
        params: {
          page: 1,
          page_size: 100,
          is_active: true,
        },
      });

      setUsers(response.data.users || []);
    } catch (err) {
      console.error("Failed to load users.", err);
    }
  };

  const loadTeams = async () => {
    try {
      const response = await api.get("/api/teams", {
        params: {
          page: 1,
          page_size: 100,
          is_active: true,
        },
      });

      setTeams(response.data.teams || []);
    } catch (err) {
      console.error("Failed to load teams.", err);
    }
  };

  const loadDepartments = async () => {
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

  const loadProjects = async () => {
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

  const getUserName = (userId) => {
    const user = users.find((item) => item.id === userId);

    return user ? `${user.full_name} (${user.email})` : `User #${userId}`;
  };

  const getTeamName = (teamId) => {
    const team = teams.find((item) => item.id === teamId);

    return team ? team.name : `Team #${teamId}`;
  };

  const getDepartmentName = (departmentId) => {
    const department = departments.find((item) => item.id === departmentId);

    return department ? department.name : `Department #${departmentId}`;
  };

  const getProjectName = (projectId) => {
    const project = projects.find((item) => item.id === projectId);

    return project ? project.name : `Project #${projectId}`;
  };

  const assignUser = async () => {
    if (!selectedUser) {
      setError("Please select a user.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await api.post(`/api/assignments/user/${id}/${selectedUser}`);

      setSelectedUser("");
      await loadTicketData();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to assign ticket to user.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const assignTeam = async () => {
    if (!selectedTeam) {
      setError("Please select a team.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await api.post(`/api/assignments/team/${id}/${selectedTeam}`);

      setSelectedTeam("");
      await loadTicketData();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to assign ticket to team.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const autoAssign = async () => {
    try {
      setActionLoading(true);
      setError("");

      await api.post(`/api/assignments/auto/${id}`);

      await loadTicketData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to auto assign ticket.");
    } finally {
      setActionLoading(false);
    }
  };

  const openUnassignModal = () => {
    setShowUnassignModal(true);
  };

  const unassign = async () => {
    try {
      setActionLoading(true);
      setError("");

      await api.delete(`/api/assignments/${id}`);

      setShowUnassignModal(false);
      await loadTicketData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to unassign ticket.");
    } finally {
      setActionLoading(false);
    }
  };

  const updateStatus = async () => {
    if (!newStatus || newStatus === ticket.status) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await api.patch(`/api/workflow/tickets/${id}/status`, {
        status: newStatus,
        comment: statusComment || null,
      });

      setStatusComment("");
      await loadTicketData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update ticket status.");
    } finally {
      setActionLoading(false);
    }
  };

  const addComment = async (e) => {
    e.preventDefault();

    if (!comment.trim()) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await api.post(`/api/comments/tickets/${id}`, {
        content: comment.trim(),
      });

      setComment("");

      const response = await api.get(`/api/comments/tickets/${id}`);

      setComments(response.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to add comment.");
    } finally {
      setActionLoading(false);
    }
  };

  const uploadAttachment = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a file.");
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      const formData = new FormData();
      formData.append("file", file);

      await api.post(`/api/attachments/tickets/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setFile(null);

      const fileInput = document.getElementById("attachment-file");

      if (fileInput) {
        fileInput.value = "";
      }

      const response = await api.get(`/api/attachments/tickets/${id}`);

      setAttachments(response.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to upload attachment.");
    } finally {
      setActionLoading(false);
    }
  };

  const downloadAttachment = async (attachment) => {
    try {
      const response = await api.get(
        `/api/attachments/${attachment.id}/download`,
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));

      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.original_filename;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to download attachment.");
    }
  };

  const openDeleteAttachmentModal = (attachmentId) => {
    setSelectedAttachmentId(attachmentId);
    setShowDeleteAttachmentModal(true);
  };

  const deleteAttachment = async () => {
    if (!selectedAttachmentId) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await api.delete(`/api/attachments/${selectedAttachmentId}`);

      setAttachments((previous) =>
        previous.filter((item) => item.id !== selectedAttachmentId),
      );

      setSelectedAttachmentId(null);
      setShowDeleteAttachmentModal(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete attachment.");
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteTicketModal = () => {
    setShowDeleteTicketModal(true);
  };

  const deleteTicket = async () => {
    try {
      setActionLoading(true);
      setError("");

      await api.delete(`/api/tickets/${id}`);

      navigate("/admin/tickets");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete ticket.");
    } finally {
      setActionLoading(false);
      setShowDeleteTicketModal(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="admin-ticket-detail-state">
          <div className="admin-ticket-detail-spinner"></div>

          <strong>Loading ticket</strong>

          <span>Fetching ticket details...</span>
        </div>
      </Layout>
    );
  }

  if (!ticket) {
    return (
      <Layout>
        <div className="admin-ticket-detail-error">
          <strong>Ticket not found</strong>

          <p>The requested ticket could not be loaded.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="admin-ticket-detail-page">
        {/* Header */}
        <div className="admin-ticket-detail-header">
          <div>
            <button
              className="admin-ticket-detail-back"
              onClick={() => navigate("/admin/tickets")}
            >
              ← Back to Tickets
            </button>

            <div className="admin-ticket-detail-eyebrow">
              ADMIN CONTROL CENTER · TICKET
            </div>

            <h1>{ticket.ticket_number}</h1>

            <p>{ticket.title}</p>
          </div>

          <button
            className="admin-ticket-detail-delete"
            onClick={openDeleteTicketModal}
            disabled={actionLoading}
          >
            Delete Ticket
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="admin-ticket-detail-alert">
            <div className="admin-ticket-detail-alert-icon">!</div>

            <div>
              <strong>Action could not be completed</strong>

              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Ticket Information */}
        <section className="admin-ticket-detail-card">
          <div className="admin-ticket-detail-card-header">
            <div>
              <span>TICKET OVERVIEW</span>

              <h2>Ticket Information</h2>
            </div>

            <div className="admin-ticket-detail-status-pill">
              {ticket.status}
            </div>
          </div>

          <div className="admin-ticket-detail-info-grid">
            <div className="admin-ticket-detail-info-item">
              <span>Ticket Number</span>

              <strong>{ticket.ticket_number}</strong>
            </div>

            <div className="admin-ticket-detail-info-item">
              <span>Title</span>

              <strong>{ticket.title}</strong>
            </div>

            <div className="admin-ticket-detail-info-item">
              <span>Department</span>

              <strong>{getDepartmentName(ticket.department_id)}</strong>
            </div>

            <div className="admin-ticket-detail-info-item">
              <span>Project</span>

              <strong>
                {ticket.project_id
                  ? getProjectName(ticket.project_id)
                  : "No Project"}
              </strong>
            </div>

            <div className="admin-ticket-detail-info-item">
              <span>Priority</span>

              <strong
                className={`admin-ticket-detail-priority ${ticket.priority.toLowerCase()}`}
              >
                <i></i>

                {ticket.priority}
              </strong>
            </div>

            <div className="admin-ticket-detail-info-item">
              <span>Created By</span>

              <strong>{getUserName(ticket.created_by)}</strong>
            </div>

            <div className="admin-ticket-detail-info-item">
              <span>Current Status</span>

              <strong>{ticket.status}</strong>
            </div>

            <div className="admin-ticket-detail-info-item">
              <span>Created At</span>

              <strong>{new Date(ticket.created_at).toLocaleString()}</strong>
            </div>
          </div>

          <div className="admin-ticket-detail-description">
            <span>Description</span>

            <p>{ticket.description}</p>
          </div>
        </section>

        {/* Assignment */}
        <section className="admin-ticket-detail-card">
          <div className="admin-ticket-detail-card-header">
            <div>
              <span>OWNERSHIP & ROUTING</span>

              <h2>Assignment</h2>
            </div>
          </div>

          <div className="admin-ticket-detail-assignment-summary">
            <div className="admin-ticket-detail-assignee">
              <div className="admin-ticket-detail-assignee-icon">U</div>

              <div>
                <span>Assigned User</span>

                <strong>
                  {ticket.assigned_user_id
                    ? getUserName(ticket.assigned_user_id)
                    : "Not assigned"}
                </strong>
              </div>
            </div>

            <div className="admin-ticket-detail-assignee">
              <div className="admin-ticket-detail-assignee-icon team">T</div>

              <div>
                <span>Assigned Team</span>

                <strong>
                  {ticket.assigned_team_id
                    ? getTeamName(ticket.assigned_team_id)
                    : "Not assigned"}
                </strong>
              </div>
            </div>
          </div>

          <div className="admin-ticket-detail-action-grid">
            <div className="admin-ticket-detail-action-box">
              <label>Assign to User</label>

              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">Select User</option>

                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} - {user.email}
                  </option>
                ))}
              </select>

              <button
                className="admin-ticket-detail-primary-btn"
                onClick={assignUser}
                disabled={actionLoading}
              >
                Assign User
              </button>
            </div>

            <div className="admin-ticket-detail-action-box">
              <label>Assign to Team</label>

              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
              >
                <option value="">Select Team</option>

                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>

              <button
                className="admin-ticket-detail-primary-btn teal"
                onClick={assignTeam}
                disabled={actionLoading}
              >
                Assign Team
              </button>
            </div>
          </div>

          <div className="admin-ticket-detail-secondary-actions">
            <button
              className="admin-ticket-detail-auto-btn"
              onClick={autoAssign}
              disabled={actionLoading}
            >
              Auto Assign
            </button>

            <button
              className="admin-ticket-detail-unassign-btn"
              onClick={openUnassignModal}
              disabled={
                actionLoading ||
                (!ticket.assigned_user_id && !ticket.assigned_team_id)
              }
            >
              Unassign
            </button>
          </div>
        </section>

        {/* Workflow */}
        <section className="admin-ticket-detail-card">
          <div className="admin-ticket-detail-card-header">
            <div>
              <span>WORKFLOW CONTROL</span>

              <h2>Status Management</h2>
            </div>
          </div>

          <div className="admin-ticket-detail-workflow-grid">
            <div>
              <label>Status</label>

              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Status Comment</label>

              <input
                type="text"
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
                placeholder="Optional comment"
              />
            </div>
          </div>

          <button
            className="admin-ticket-detail-primary-btn workflow"
            onClick={updateStatus}
            disabled={actionLoading || newStatus === ticket.status}
          >
            Update Status
          </button>
        </section>

        {/* Status History */}
        <section className="admin-ticket-detail-card">
          <div className="admin-ticket-detail-card-header">
            <div>
              <span>AUDIT TRAIL</span>

              <h2>Status History</h2>
            </div>

            <div className="admin-ticket-detail-count">
              {history.length} events
            </div>
          </div>

          {history.length === 0 ? (
            <div className="admin-ticket-detail-empty">
              No status history found.
            </div>
          ) : (
            <div className="admin-ticket-detail-table-wrap">
              <table className="admin-ticket-detail-table">
                <thead>
                  <tr>
                    <th>OLD STATUS</th>
                    <th>NEW STATUS</th>
                    <th>CHANGED BY</th>
                    <th>COMMENT</th>
                    <th>DATE</th>
                  </tr>
                </thead>

                <tbody>
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="admin-ticket-detail-history-old">
                          {item.old_status || "-"}
                        </span>
                      </td>

                      <td>
                        <span className="admin-ticket-detail-history-new">
                          {item.new_status}
                        </span>
                      </td>

                      <td>
                        {item.changed_by ? getUserName(item.changed_by) : "-"}
                      </td>

                      <td>{item.comment || "-"}</td>

                      <td>{new Date(item.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Comments */}
        <section className="admin-ticket-detail-card">
          <div className="admin-ticket-detail-card-header">
            <div>
              <span>COLLABORATION</span>

              <h2>Comments</h2>
            </div>

            <div className="admin-ticket-detail-count">
              {comments.length} comments
            </div>
          </div>

          <form onSubmit={addComment}>
            <textarea
              className="admin-ticket-detail-comment-input"
              rows="4"
              placeholder="Write a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <button
              type="submit"
              className="admin-ticket-detail-primary-btn"
              disabled={actionLoading || !comment.trim()}
            >
              Add Comment
            </button>
          </form>

          <div className="admin-ticket-detail-comments">
            {comments.length === 0 ? (
              <div className="admin-ticket-detail-empty">No comments yet.</div>
            ) : (
              comments.map((item) => (
                <div className="admin-ticket-detail-comment" key={item.id}>
                  <div className="admin-ticket-detail-comment-top">
                    <div className="admin-ticket-detail-comment-user">
                      <div>
                        {getUserName(item.user_id).charAt(0).toUpperCase()}
                      </div>

                      <strong>{getUserName(item.user_id)}</strong>
                    </div>

                    <span>{new Date(item.created_at).toLocaleString()}</span>
                  </div>

                  <p>{item.content}</p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Attachments */}
        <section className="admin-ticket-detail-card">
          <div className="admin-ticket-detail-card-header">
            <div>
              <span>FILE MANAGEMENT</span>

              <h2>Attachments</h2>
            </div>

            <div className="admin-ticket-detail-count">
              {attachments.length} files
            </div>
          </div>

          <form
            onSubmit={uploadAttachment}
            className="admin-ticket-detail-upload"
          >
            <div>
              <label>Upload File</label>

              <input
                id="attachment-file"
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </div>

            <button
              type="submit"
              className="admin-ticket-detail-primary-btn teal"
              disabled={actionLoading || !file}
            >
              Upload Attachment
            </button>
          </form>

          <div className="admin-ticket-detail-attachments">
            {attachments.length === 0 ? (
              <div className="admin-ticket-detail-empty">No attachments.</div>
            ) : (
              attachments.map((attachment) => (
                <div
                  className="admin-ticket-detail-attachment"
                  key={attachment.id}
                >
                  <div className="admin-ticket-detail-file">
                    <div className="admin-ticket-detail-file-icon">F</div>

                    <div>
                      <strong>{attachment.original_filename}</strong>

                      <span>{Math.round(attachment.file_size / 1024)} KB</span>
                    </div>
                  </div>

                  <div className="admin-ticket-detail-file-actions">
                    <button
                      type="button"
                      className="admin-ticket-detail-download"
                      onClick={() => downloadAttachment(attachment)}
                    >
                      Download
                    </button>

                    <button
                      type="button"
                      className="admin-ticket-detail-file-delete"
                      onClick={() => openDeleteAttachmentModal(attachment.id)}
                      disabled={actionLoading}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Unassign Modal */}
      {showUnassignModal && (
        <div
          className="admin-ticket-detail-modal-overlay"
          onClick={() => setShowUnassignModal(false)}
        >
          <div
            className="admin-ticket-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-ticket-detail-modal-icon warning">!</div>

            <h3>Unassign Ticket?</h3>

            <p>
              This will remove the current user/team assignment from this
              ticket.
            </p>

            <div className="admin-ticket-detail-modal-actions">
              <button
                className="admin-ticket-detail-modal-cancel"
                onClick={() => setShowUnassignModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>

              <button
                className="admin-ticket-detail-modal-danger"
                onClick={unassign}
                disabled={actionLoading}
              >
                {actionLoading ? "Unassigning..." : "Unassign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Attachment Modal */}
      {showDeleteAttachmentModal && (
        <div
          className="admin-ticket-detail-modal-overlay"
          onClick={() => setShowDeleteAttachmentModal(false)}
        >
          <div
            className="admin-ticket-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-ticket-detail-modal-icon danger">×</div>

            <h3>Delete Attachment?</h3>

            <p>
              Are you sure you want to delete this attachment? This action
              cannot be undone.
            </p>

            <div className="admin-ticket-detail-modal-actions">
              <button
                className="admin-ticket-detail-modal-cancel"
                onClick={() => setShowDeleteAttachmentModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>

              <button
                className="admin-ticket-detail-modal-danger"
                onClick={deleteAttachment}
                disabled={actionLoading}
              >
                {actionLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Ticket Modal */}
      {showDeleteTicketModal && (
        <div
          className="admin-ticket-detail-modal-overlay"
          onClick={() => setShowDeleteTicketModal(false)}
        >
          <div
            className="admin-ticket-detail-modal delete-ticket"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-ticket-detail-modal-icon danger">×</div>

            <h3>Delete Ticket?</h3>

            <p>
              Delete ticket <strong>{ticket.ticket_number}</strong>? This action
              cannot be undone.
            </p>

            <div className="admin-ticket-detail-modal-actions">
              <button
                className="admin-ticket-detail-modal-cancel"
                onClick={() => setShowDeleteTicketModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>

              <button
                className="admin-ticket-detail-modal-danger"
                onClick={deleteTicket}
                disabled={actionLoading}
              >
                {actionLoading ? "Deleting..." : "Delete Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default AdminTicketDetail;
