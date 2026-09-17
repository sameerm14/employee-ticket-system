import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import api from "../../services/api";
import "./TeamLeadTicketDetail.css";

function TeamLeadTicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);

  const [departmentName, setDepartmentName] = useState("");
  const [projectName, setProjectName] = useState("");

  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [history, setHistory] = useState([]);

  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);

  const [assignedUserName, setAssignedUserName] = useState("");
  const [assignedTeamName, setAssignedTeamName] = useState("");

  const [userNames, setUserNames] = useState({});

  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");

  const [assignmentLoading, setAssignmentLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newStatus, setNewStatus] = useState("");
  const [statusComment, setStatusComment] = useState("");

  const [comment, setComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [confirmation, setConfirmation] = useState({
    open: false,
    type: "",
  });

  const allowedTransitions = {
    OPEN: ["ASSIGNED", "REJECTED"],
    ASSIGNED: ["IN_PROGRESS", "ON_HOLD", "REJECTED"],
    IN_PROGRESS: ["RESOLVED", "ON_HOLD"],
    ON_HOLD: ["IN_PROGRESS", "REJECTED"],
    RESOLVED: ["CLOSED", "REOPENED"],
    CLOSED: ["REOPENED"],
    REOPENED: ["ASSIGNED", "IN_PROGRESS"],
    REJECTED: ["REOPENED"],
  };

  useEffect(() => {
    fetchTicketData();
  }, [id]);

  const fetchTicketData = async () => {
    try {
      setLoading(true);
      setError("");

      // First get the main ticket data
      const ticketResponse = await api.get(`/api/tickets/${id}`);

      const ticketData = ticketResponse.data;

      setTicket(ticketData);

      // Fetch all other ticket-related data
      const [
        commentsResponse,
        attachmentsResponse,
        historyResponse,
        workloadResponse,
        departmentsResponse,
        projectsResponse,
        teamsResponse,
      ] = await Promise.all([
        api.get(`/api/comments/tickets/${id}`),
        api.get(`/api/attachments/tickets/${id}`),
        api.get(`/api/workflow/tickets/${id}/history`),
        api.get("/api/assignments/team-lead/workload"),
        api.get("/api/departments"),
        api.get("/api/projects"),
        api.get("/api/teams"),
      ]);

      setComments(commentsResponse.data);
      setAttachments(attachmentsResponse.data);
      setHistory(historyResponse.data);

      // --------------------------------------------------
      // DEPARTMENT NAME
      // --------------------------------------------------

      const departments =
        departmentsResponse.data?.departments ||
        departmentsResponse.data?.items ||
        departmentsResponse.data ||
        [];

      const department = departments.find(
        (item) => item.id === ticketData.department_id,
      );

      if (department) {
        setDepartmentName(department.name);
      } else {
        setDepartmentName("Unknown Department");
      }

      // --------------------------------------------------
      // PROJECT NAME
      // --------------------------------------------------

      const projects =
        projectsResponse.data?.projects ||
        projectsResponse.data?.items ||
        projectsResponse.data ||
        [];

      if (ticketData.project_id) {
        const project = projects.find(
          (item) => item.id === ticketData.project_id,
        );

        if (project) {
          setProjectName(project.name);
        } else {
          setProjectName("Unknown Project");
        }
      } else {
        setProjectName("Not assigned");
      }

      // --------------------------------------------------
      // TEAM LEAD WORKLOAD / USERS
      // --------------------------------------------------

      const members = workloadResponse.data?.members || [];

      const teamMembers = members.map((member) => ({
        id: member.user_id,
        full_name: member.user_name,
      }));

      setUsers(teamMembers);

      // --------------------------------------------------
      // USER NAME LOOKUP
      // --------------------------------------------------

      const names = {};

      teamMembers.forEach((member) => {
        names[member.id] = member.full_name;
      });

      setUserNames(names);

      // --------------------------------------------------
      // ASSIGNED USER NAME
      // --------------------------------------------------

      if (ticketData.assigned_user_id) {
        const assignedUser = teamMembers.find(
          (user) => user.id === ticketData.assigned_user_id,
        );

        if (assignedUser) {
          setAssignedUserName(assignedUser.full_name);
        } else {
          setAssignedUserName("Unknown User");
        }
      } else {
        setAssignedUserName("Not assigned");
      }

      // --------------------------------------------------
      // TEAMS
      // --------------------------------------------------

      const teamList =
        teamsResponse.data?.teams ||
        teamsResponse.data?.items ||
        teamsResponse.data ||
        [];

      setTeams(teamList);

      // --------------------------------------------------
      // ASSIGNED TEAM NAME
      // --------------------------------------------------

      if (ticketData.assigned_team_id) {
        const assignedTeam = teamList.find(
          (team) => team.id === ticketData.assigned_team_id,
        );

        if (assignedTeam) {
          setAssignedTeamName(assignedTeam.name);
        } else {
          setAssignedTeamName("Unknown Team");
        }
      } else {
        setAssignedTeamName("Not assigned");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load ticket.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) {
      return;
    }

    try {
      setError("");

      await api.patch(`/api/workflow/tickets/${id}/status`, {
        status: newStatus,
        comment: statusComment || null,
      });

      setNewStatus("");
      setStatusComment("");

      await fetchTicketData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update ticket status.");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!comment.trim()) {
      return;
    }

    try {
      setCommentLoading(true);
      setError("");

      await api.post(`/api/comments/tickets/${id}`, {
        content: comment,
      });

      setComment("");

      const response = await api.get(`/api/comments/tickets/${id}`);

      setComments(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to add comment.");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      return;
    }

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();

      formData.append("file", selectedFile);

      await api.post(`/api/attachments/tickets/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSelectedFile(null);

      const fileInput = document.getElementById("attachment-file");

      if (fileInput) {
        fileInput.value = "";
      }

      const response = await api.get(`/api/attachments/tickets/${id}`);

      setAttachments(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to upload attachment.");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (attachment) => {
    try {
      setError("");

      const response = await api.get(
        `/api/attachments/${attachment.id}/download`,
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));

      const link = document.createElement("a");

      link.href = url;

      link.setAttribute("download", attachment.original_filename);

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to download attachment.");
    }
  };

  const openConfirmation = (type) => {
    setConfirmation({
      open: true,
      type,
    });
  };

  const closeConfirmation = () => {
    if (assignmentLoading) {
      return;
    }

    setConfirmation({
      open: false,
      type: "",
    });
  };

  const handleConfirmedAction = async () => {
    const action = confirmation.type;

    try {
      setAssignmentLoading(true);
      setError("");

      if (action === "delete-attachment") {
        await api.delete(`/api/attachments/${confirmation.attachmentId}`);

        const response = await api.get(`/api/attachments/tickets/${id}`);

        setAttachments(response.data);
      }

      if (action === "unassign") {
        await api.delete(`/api/assignments/${id}`);

        await fetchTicketData();
      }
    } catch (err) {
      if (action === "delete-attachment") {
        setError(err.response?.data?.detail || "Failed to delete attachment.");
      }

      if (action === "unassign") {
        setError(err.response?.data?.detail || "Failed to unassign ticket.");
      }
    } finally {
      setAssignmentLoading(false);

      setConfirmation({
        open: false,
        type: "",
      });
    }
  };

  const handleDeleteAttachment = (attachmentId) => {
    setConfirmation({
      open: true,
      type: "delete-attachment",
      attachmentId,
    });
  };

  const handleAssignUser = async () => {
    if (!selectedUserId) {
      return;
    }

    try {
      setAssignmentLoading(true);
      setError("");

      await api.post(`/api/assignments/user/${id}/${selectedUserId}`);

      setSelectedUserId("");

      await fetchTicketData();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to assign ticket to user.",
      );
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleAssignTeam = async () => {
    if (!selectedTeamId) {
      return;
    }

    try {
      setAssignmentLoading(true);
      setError("");

      await api.post(`/api/assignments/team/${id}/${selectedTeamId}`);

      setSelectedTeamId("");

      await fetchTicketData();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to assign ticket to team.",
      );
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    try {
      setAssignmentLoading(true);
      setError("");

      await api.post(`/api/assignments/auto/${id}`);

      await fetchTicketData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to auto assign ticket.");
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleUnassign = () => {
    openConfirmation("unassign");
  };

  if (loading) {
    return (
      <Layout>
        <div className="team-lead-ticket-state">
          <div className="team-lead-ticket-spinner"></div>

          <h3>Loading ticket</h3>

          <p>Fetching ticket details and activity...</p>
        </div>
      </Layout>
    );
  }

  if (error && !ticket) {
    return (
      <Layout>
        <div className="team-lead-ticket-error-page">
          <div className="team-lead-ticket-error-icon">!</div>

          <h2>Unable to load ticket</h2>

          <p>{error}</p>

          <button
            className="team-lead-ticket-back-btn"
            onClick={() => navigate("/team-lead/tickets")}
          >
            ← Back to Tickets
          </button>
        </div>
      </Layout>
    );
  }

  if (!ticket) {
    return (
      <Layout>
        <div className="team-lead-ticket-empty">
          <div className="team-lead-ticket-empty-icon">?</div>

          <h2>Ticket not found</h2>

          <p>The requested ticket could not be found.</p>

          <button
            className="team-lead-ticket-back-btn"
            onClick={() => navigate("/team-lead/tickets")}
          >
            Back to Tickets
          </button>
        </div>
      </Layout>
    );
  }

  const transitions = allowedTransitions[ticket.status] || [];

  const statusClass = ticket.status.toLowerCase().replace("_", "-");

  const priorityClass = ticket.priority.toLowerCase();

  const confirmationTitle =
    confirmation.type === "unassign"
      ? "Unassign ticket?"
      : "Delete attachment?";

  const confirmationMessage =
    confirmation.type === "unassign"
      ? "This will remove the current assignment from this ticket. You can assign it again later."
      : "This attachment will be permanently removed from the ticket.";

  return (
    <Layout>
      <div className="team-lead-ticket-detail">
        {/* Header */}

        <div className="team-lead-ticket-header">
          <div className="team-lead-ticket-header-left">
            <button
              className="team-lead-ticket-back-link"
              onClick={() => navigate("/team-lead/tickets")}
            >
              ← Back to Tickets
            </button>

            <div className="team-lead-ticket-heading">
              <div className="team-lead-ticket-heading-meta">
                <span className="team-lead-ticket-label">SUPPORT TICKET</span>

                <span
                  className={`team-lead-ticket-status-badge ${statusClass}`}
                >
                  {ticket.status}
                </span>
              </div>

              <h1>{ticket.ticket_number}</h1>

              <p>{ticket.title}</p>
            </div>
          </div>

          <div className="team-lead-ticket-header-priority">
            <span>Priority</span>

            <strong className={`priority-${priorityClass}`}>
              {ticket.priority}
            </strong>
          </div>
        </div>

        {error && (
          <div className="team-lead-ticket-alert">
            <div className="team-lead-ticket-alert-icon">!</div>

            <div>
              <strong>Action could not be completed</strong>

              <p>{error}</p>
            </div>

            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        {/* Main ticket overview */}

        <div className="team-lead-ticket-overview-grid">
          <section className="team-lead-ticket-panel team-lead-ticket-main-panel">
            <div className="team-lead-ticket-panel-header">
              <div>
                <span className="team-lead-ticket-panel-kicker">
                  TICKET OVERVIEW
                </span>

                <h2>Ticket Information</h2>
              </div>

              <div className="team-lead-ticket-panel-icon blue">T</div>
            </div>

            <div className="team-lead-ticket-info-grid">
              <div className="team-lead-ticket-info-item">
                <span>Ticket Number</span>

                <strong>{ticket.ticket_number}</strong>
              </div>

              <div className="team-lead-ticket-info-item">
                <span>Department</span>

                <strong>{departmentName || "Loading..."}</strong>
              </div>

              <div className="team-lead-ticket-info-item">
                <span>Project</span>

                <strong>{projectName || "Not assigned"}</strong>
              </div>

              <div className="team-lead-ticket-info-item">
                <span>Created</span>

                <strong>{new Date(ticket.created_at).toLocaleString()}</strong>
              </div>

              <div className="team-lead-ticket-info-item">
                <span>Last Updated</span>

                <strong>{new Date(ticket.updated_at).toLocaleString()}</strong>
              </div>

              <div className="team-lead-ticket-info-item">
                <span>Current Status</span>

                <strong
                  className={`team-lead-ticket-inline-status ${statusClass}`}
                >
                  {ticket.status}
                </strong>
              </div>
            </div>

            <div className="team-lead-ticket-description">
              <span>Description</span>

              <p>{ticket.description}</p>
            </div>
          </section>

          {/* Current assignment summary */}

          <section className="team-lead-ticket-panel team-lead-ticket-assignment-summary">
            <div className="team-lead-ticket-panel-header">
              <div>
                <span className="team-lead-ticket-panel-kicker">OWNERSHIP</span>

                <h2>Current Assignment</h2>
              </div>

              <div className="team-lead-ticket-panel-icon purple">A</div>
            </div>

            <div className="team-lead-current-assignment">
              <div className="team-lead-current-assignment-block user">
                <div className="team-lead-assignment-avatar">
                  {ticket.assigned_user_id
                    ? assignedUserName?.charAt(0)?.toUpperCase()
                    : "—"}
                </div>

                <div>
                  <span>Assigned User</span>

                  <strong>{assignedUserName || "Loading..."}</strong>
                </div>
              </div>

              <div className="team-lead-assignment-divider"></div>

              <div className="team-lead-current-assignment-block team">
                <div className="team-lead-assignment-avatar">
                  {ticket.assigned_team_id
                    ? assignedTeamName?.charAt(0)?.toUpperCase()
                    : "—"}
                </div>

                <div>
                  <span>Assigned Team</span>

                  <strong>{assignedTeamName || "Loading..."}</strong>
                </div>
              </div>
            </div>

            {(ticket.assigned_user_id || ticket.assigned_team_id) && (
              <button
                className="team-lead-unassign-outline"
                onClick={handleUnassign}
                disabled={assignmentLoading}
              >
                Remove Current Assignment
              </button>
            )}
          </section>
        </div>

        {/* Management controls */}

        <div className="team-lead-ticket-management-grid">
          {/* Status */}

          <section className="team-lead-ticket-panel">
            <div className="team-lead-ticket-panel-header">
              <div>
                <span className="team-lead-ticket-panel-kicker">WORKFLOW</span>

                <h2>Update Status</h2>
              </div>

              <div className="team-lead-ticket-panel-icon orange">↗</div>
            </div>

            {transitions.length === 0 ? (
              <div className="team-lead-ticket-no-action">
                <span>✓</span>

                <div>
                  <strong>No status changes available</strong>

                  <p>
                    This ticket currently has no valid workflow transitions.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="team-lead-form-group">
                  <label>New Status</label>

                  <select
                    className="team-lead-form-control"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="">Select status</option>

                    {transitions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="team-lead-form-group">
                  <label>Status Comment</label>

                  <textarea
                    className="team-lead-form-control"
                    rows="4"
                    value={statusComment}
                    onChange={(e) => setStatusComment(e.target.value)}
                    placeholder="Add an optional note about this status change..."
                  />
                </div>

                <button
                  className="team-lead-primary-btn"
                  onClick={handleStatusUpdate}
                  disabled={!newStatus}
                >
                  Update Ticket Status
                </button>
              </>
            )}
          </section>

          {/* Assignment controls */}

          <section className="team-lead-ticket-panel">
            <div className="team-lead-ticket-panel-header">
              <div>
                <span className="team-lead-ticket-panel-kicker">
                  ASSIGNMENT
                </span>

                <h2>Assign Ticket</h2>
              </div>

              <div className="team-lead-ticket-panel-icon teal">+</div>
            </div>

            <div className="team-lead-form-group">
              <label>Assign to User</label>

              <select
                className="team-lead-form-control"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">Select team member</option>

                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="team-lead-secondary-action teal"
              onClick={handleAssignUser}
              disabled={assignmentLoading || !selectedUserId}
            >
              {assignmentLoading ? "Assigning..." : "Assign to User"}
            </button>

            <div className="team-lead-assignment-separator">
              <span>OR</span>
            </div>

            <div className="team-lead-form-group">
              <label>Assign to Team</label>

              <select
                className="team-lead-form-control"
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
              >
                <option value="">Select team</option>

                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="team-lead-secondary-action purple"
              onClick={handleAssignTeam}
              disabled={assignmentLoading || !selectedTeamId}
            >
              {assignmentLoading ? "Assigning..." : "Assign to Team"}
            </button>

            <button
              className="team-lead-auto-assign-btn"
              onClick={handleAutoAssign}
              disabled={assignmentLoading}
            >
              <span>⚡</span>

              {assignmentLoading ? "Assigning..." : "Auto Assign"}
            </button>
          </section>
        </div>

        {/* Comments + Attachments */}

        <div className="team-lead-ticket-content-grid">
          {/* Comments */}

          <section className="team-lead-ticket-panel">
            <div className="team-lead-ticket-panel-header">
              <div>
                <span className="team-lead-ticket-panel-kicker">
                  COLLABORATION
                </span>

                <h2>Comments</h2>
              </div>

              <div className="team-lead-ticket-count-badge">
                {comments.length}
              </div>
            </div>

            <form
              className="team-lead-comment-form"
              onSubmit={handleAddComment}
            >
              <textarea
                className="team-lead-form-control"
                rows="4"
                placeholder="Write an update or comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />

              <div className="team-lead-comment-form-footer">
                <span>Keep the team updated with useful information.</span>

                <button
                  type="submit"
                  className="team-lead-primary-btn"
                  disabled={commentLoading || !comment.trim()}
                >
                  {commentLoading ? "Adding..." : "Add Comment"}
                </button>
              </div>
            </form>

            <div className="team-lead-comments-list">
              {comments.length === 0 ? (
                <div className="team-lead-ticket-empty-inline">
                  <span>💬</span>

                  <strong>No comments yet</strong>

                  <p>Be the first to add an update to this ticket.</p>
                </div>
              ) : (
                comments.map((item) => (
                  <div className="team-lead-comment-item" key={item.id}>
                    <div className="team-lead-comment-avatar">
                      {userNames[item.user_id]?.charAt(0)?.toUpperCase() || "U"}
                    </div>

                    <div className="team-lead-comment-body">
                      <div className="team-lead-comment-header">
                        <strong>
                          {userNames[item.user_id] || "Unknown User"}
                        </strong>

                        <span>
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>

                      <p>{item.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Attachments */}

          <section className="team-lead-ticket-panel">
            <div className="team-lead-ticket-panel-header">
              <div>
                <span className="team-lead-ticket-panel-kicker">FILES</span>

                <h2>Attachments</h2>
              </div>

              <div className="team-lead-ticket-count-badge green">
                {attachments.length}
              </div>
            </div>

            <div className="team-lead-upload-box">
              <div className="team-lead-upload-icon">↑</div>

              <div className="team-lead-form-group">
                <label>Select File</label>

                <input
                  id="attachment-file"
                  type="file"
                  className="team-lead-file-input"
                  onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                />
              </div>

              <button
                className="team-lead-primary-btn"
                onClick={handleUpload}
                disabled={uploading || !selectedFile}
              >
                {uploading ? "Uploading..." : "Upload Attachment"}
              </button>
            </div>

            <div className="team-lead-attachments-list">
              {attachments.length === 0 ? (
                <div className="team-lead-ticket-empty-inline">
                  <span>📎</span>

                  <strong>No attachments</strong>

                  <p>Files uploaded for this ticket will appear here.</p>
                </div>
              ) : (
                attachments.map((attachment) => (
                  <div
                    className="team-lead-attachment-item"
                    key={attachment.id}
                  >
                    <div className="team-lead-attachment-icon">📄</div>

                    <div className="team-lead-attachment-info">
                      <strong>{attachment.original_filename}</strong>

                      <span>{(attachment.file_size / 1024).toFixed(2)} KB</span>
                    </div>

                    <div className="team-lead-attachment-actions">
                      <button
                        className="team-lead-small-btn download"
                        onClick={() => handleDownload(attachment)}
                      >
                        Download
                      </button>

                      <button
                        className="team-lead-small-btn delete"
                        onClick={() => handleDeleteAttachment(attachment.id)}
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

        {/* Status history */}

        <section className="team-lead-ticket-panel team-lead-history-panel">
          <div className="team-lead-ticket-panel-header">
            <div>
              <span className="team-lead-ticket-panel-kicker">AUDIT TRAIL</span>

              <h2>Status History</h2>
            </div>

            <div className="team-lead-ticket-count-badge orange">
              {history.length}
            </div>
          </div>

          {history.length === 0 ? (
            <div className="team-lead-ticket-empty-inline">
              <span>↻</span>

              <strong>No status history</strong>

              <p>Status changes will appear here as the ticket progresses.</p>
            </div>
          ) : (
            <div className="team-lead-history-list">
              {history.map((item, index) => (
                <div className="team-lead-history-item" key={item.id}>
                  <div className="team-lead-history-line">
                    <div className="team-lead-history-dot"></div>

                    {index !== history.length - 1 && (
                      <div className="team-lead-history-connector"></div>
                    )}
                  </div>

                  <div className="team-lead-history-content">
                    <div className="team-lead-history-top">
                      <div className="team-lead-history-transition">
                        <span>{item.old_status || "NEW"}</span>

                        <strong>→</strong>

                        <span className="current">{item.new_status}</span>
                      </div>

                      <time>{new Date(item.created_at).toLocaleString()}</time>
                    </div>

                    <div className="team-lead-history-meta">
                      <span>
                        Changed by{" "}
                        <strong>
                          {item.changed_by
                            ? userNames[item.changed_by] || "Unknown User"
                            : "System"}
                        </strong>
                      </span>

                      {item.comment && (
                        <span className="team-lead-history-comment">
                          {item.comment}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Confirmation Modal */}

      {confirmation.open && (
        <div className="team-lead-confirm-overlay" onClick={closeConfirmation}>
          <div
            className="team-lead-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="team-lead-confirm-icon">!</div>

            <h2>{confirmationTitle}</h2>

            <p>{confirmationMessage}</p>

            <div className="team-lead-confirm-actions">
              <button
                className="team-lead-confirm-cancel"
                onClick={closeConfirmation}
                disabled={assignmentLoading}
              >
                Cancel
              </button>

              <button
                className="team-lead-confirm-danger"
                onClick={handleConfirmedAction}
                disabled={assignmentLoading}
              >
                {assignmentLoading ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default TeamLeadTicketDetail;
