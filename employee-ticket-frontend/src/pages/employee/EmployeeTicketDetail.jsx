import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import Layout from "../../components/Layout";
import "./EmployeeTicketDetail.css";

function EmployeeTicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [statusHistory, setStatusHistory] = useState([]);

  const [newComment, setNewComment] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const [newStatus, setNewStatus] = useState("");
  const [statusComment, setStatusComment] = useState("");

  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [deleteAttachmentId, setDeleteAttachmentId] = useState(null);
  const [deleteAttachmentName, setDeleteAttachmentName] = useState("");

  // =========================
  // FETCH TICKET
  // =========================

  const fetchTicket = async () => {
    const response = await api.get(`/api/tickets/${id}`);
    setTicket(response.data);
  };

  // =========================
  // FETCH COMMENTS
  // =========================

  const fetchComments = async () => {
    const response = await api.get(`/api/comments/tickets/${id}`);
    setComments(response.data);
  };

  // =========================
  // FETCH ATTACHMENTS
  // =========================

  const fetchAttachments = async () => {
    const response = await api.get(`/api/attachments/tickets/${id}`);
    setAttachments(response.data);
  };

  // =========================
  // FETCH STATUS HISTORY
  // =========================

  const fetchStatusHistory = async () => {
    const response = await api.get(`/api/workflow/tickets/${id}/history`);
    setStatusHistory(response.data);
  };

  // =========================
  // LOAD ALL DATA
  // =========================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        fetchTicket(),
        fetchComments(),
        fetchAttachments(),
        fetchStatusHistory(),
      ]);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load ticket details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // =========================
  // RESET STATUS
  // =========================

  useEffect(() => {
    if (ticket) {
      setNewStatus("");
    }
  }, [ticket?.status]);

  // =========================
  // ALLOWED TRANSITIONS
  // =========================

  const getNextStatuses = (currentStatus) => {
    const transitions = {
      OPEN: ["ASSIGNED", "REJECTED"],
      ASSIGNED: ["IN_PROGRESS", "ON_HOLD", "REJECTED"],
      IN_PROGRESS: ["RESOLVED", "ON_HOLD"],
      ON_HOLD: ["IN_PROGRESS", "REJECTED"],
      RESOLVED: ["CLOSED", "REOPENED"],
      CLOSED: ["REOPENED"],
      REOPENED: ["ASSIGNED", "IN_PROGRESS"],
      REJECTED: ["REOPENED"],
    };

    return transitions[currentStatus] || [];
  };

  // =========================
  // UPDATE STATUS
  // =========================

  const handleStatusUpdate = async (e) => {
    e.preventDefault();

    if (!newStatus) {
      setError("Please select a status.");
      return;
    }

    try {
      setStatusLoading(true);
      setError("");
      setSuccess("");

      await api.patch(`/api/workflow/tickets/${id}/status`, {
        status: newStatus,
        comment: statusComment.trim() || null,
      });

      setSuccess(`Ticket status updated to ${newStatus}.`);

      setNewStatus("");
      setStatusComment("");

      await Promise.all([fetchTicket(), fetchStatusHistory()]);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update ticket status.");
    } finally {
      setStatusLoading(false);
    }
  };

  // =========================
  // ADD COMMENT
  // =========================

  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!newComment.trim()) {
      setError("Comment cannot be empty.");
      return;
    }

    try {
      setCommentLoading(true);
      setError("");
      setSuccess("");

      await api.post(`/api/comments/tickets/${id}`, {
        content: newComment.trim(),
      });

      setNewComment("");

      await fetchComments();

      setSuccess("Comment added successfully.");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to add comment.");
    } finally {
      setCommentLoading(false);
    }
  };

  // =========================
  // UPLOAD ATTACHMENT
  // =========================

  const handleFileUpload = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setError("Please select a file.");
      return;
    }

    try {
      setUploadLoading(true);
      setError("");
      setSuccess("");

      const formData = new FormData();
      formData.append("file", selectedFile);

      await api.post(`/api/attachments/tickets/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSelectedFile(null);
      e.target.reset();

      await fetchAttachments();

      setSuccess("File uploaded successfully.");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to upload file.");
    } finally {
      setUploadLoading(false);
    }
  };

  // =========================
  // DOWNLOAD ATTACHMENT
  // =========================

  const handleDownload = async (attachmentId, filename) => {
    try {
      setError("");

      const response = await api.get(
        `/api/attachments/${attachmentId}/download`,
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", filename);

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to download attachment.");
    }
  };

  // =========================
  // OPEN DELETE MODAL
  // =========================

  const openDeleteModal = (attachmentId, filename) => {
    setDeleteAttachmentId(attachmentId);
    setDeleteAttachmentName(filename);
  };

  // =========================
  // CLOSE DELETE MODAL
  // =========================

  const closeDeleteModal = () => {
    setDeleteAttachmentId(null);
    setDeleteAttachmentName("");
  };

  // =========================
  // DELETE ATTACHMENT
  // =========================

  const handleDeleteAttachment = async () => {
    if (!deleteAttachmentId) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.delete(`/api/attachments/${deleteAttachmentId}`);

      await fetchAttachments();

      closeDeleteModal();

      setSuccess("Attachment deleted successfully.");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete attachment.");
    }
  };

  // =========================
  // FILE SIZE
  // =========================

  const formatFileSize = (bytes) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // =========================
  // STATUS CLASS
  // =========================

  const getStatusClass = (status) => {
    const classes = {
      OPEN: "employee-status-open",
      ASSIGNED: "employee-status-assigned",
      IN_PROGRESS: "employee-status-in-progress",
      RESOLVED: "employee-status-resolved",
      CLOSED: "employee-status-closed",
      REOPENED: "employee-status-reopened",
      ON_HOLD: "employee-status-on-hold",
      REJECTED: "employee-status-rejected",
    };

    return classes[status] || "";
  };

  // =========================
  // PRIORITY CLASS
  // =========================

  const getPriorityClass = (priority) => {
    const classes = {
      LOW: "employee-priority-low",
      MEDIUM: "employee-priority-medium",
      HIGH: "employee-priority-high",
      CRITICAL: "employee-priority-critical",
    };

    return classes[priority] || "";
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <Layout>
        <div className="employee-ticket-detail-loading">
          <div className="employee-ticket-spinner"></div>
          <p>Loading ticket details...</p>
        </div>
      </Layout>
    );
  }

  // =========================
  // NOT FOUND
  // =========================

  if (!ticket) {
    return (
      <Layout>
        <div className="employee-ticket-not-found">
          <div className="employee-ticket-not-found-icon">?</div>
          <h3>Ticket not found</h3>
          <p>The ticket could not be found or you don't have access to it.</p>

          <button
            type="button"
            className="employee-ticket-back-button"
            onClick={() => navigate("/employee/tickets")}
          >
            ← Back to My Tickets
          </button>
        </div>
      </Layout>
    );
  }

  const nextStatuses = getNextStatuses(ticket.status);

  // =========================
  // PAGE
  // =========================

  return (
    <Layout>
      <div className="employee-ticket-detail">
        {/* HEADER */}

        <div className="employee-ticket-header">
          <button
            type="button"
            className="employee-ticket-back-button"
            onClick={() => navigate("/employee/tickets")}
          >
            ← Back to My Tickets
          </button>

          <div className="employee-ticket-heading">
            <div>
              <span className="employee-ticket-eyebrow">TICKET DETAILS</span>

              <h1>{ticket.ticket_number}</h1>

              <p>{ticket.title}</p>
            </div>

            <div className="employee-ticket-header-status">
              <span
                className={`employee-ticket-status ${getStatusClass(
                  ticket.status,
                )}`}
              >
                {ticket.status.replace("_", " ")}
              </span>

              <span
                className={`employee-ticket-priority ${getPriorityClass(
                  ticket.priority,
                )}`}
              >
                {ticket.priority}
              </span>
            </div>
          </div>
        </div>

        {/* ALERTS */}

        {error && (
          <div className="employee-ticket-alert employee-ticket-alert-error">
            <div className="employee-ticket-alert-icon">!</div>

            <div className="employee-ticket-alert-content">
              <strong>Something went wrong</strong>
              <p>{error}</p>
            </div>

            <button
              type="button"
              className="employee-ticket-alert-close"
              onClick={() => setError("")}
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="employee-ticket-alert employee-ticket-alert-success">
            <div className="employee-ticket-alert-icon">✓</div>

            <div className="employee-ticket-alert-content">
              <strong>Success</strong>
              <p>{success}</p>
            </div>

            <button
              type="button"
              className="employee-ticket-alert-close"
              onClick={() => setSuccess("")}
            >
              ×
            </button>
          </div>
        )}

        {/* MAIN GRID */}

        <div className="employee-ticket-detail-grid">
          {/* LEFT */}

          <div className="employee-ticket-main-column">
            {/* INFORMATION */}

            <section className="employee-ticket-card">
              <div className="employee-ticket-card-header">
                <div>
                  <span className="employee-ticket-card-kicker">OVERVIEW</span>
                  <h2>Ticket Information</h2>
                </div>
              </div>

              <div className="employee-ticket-info-grid">
                <div className="employee-ticket-info-item">
                  <span>Ticket Number</span>
                  <strong>{ticket.ticket_number}</strong>
                </div>

                <div className="employee-ticket-info-item">
                  <span>Status</span>
                  <strong
                    className={`employee-ticket-status ${getStatusClass(
                      ticket.status,
                    )}`}
                  >
                    {ticket.status.replace("_", " ")}
                  </strong>
                </div>

                <div className="employee-ticket-info-item">
                  <span>Priority</span>
                  <strong
                    className={`employee-ticket-priority ${getPriorityClass(
                      ticket.priority,
                    )}`}
                  >
                    {ticket.priority}
                  </strong>
                </div>

                <div className="employee-ticket-info-item">
                  <span>Department</span>
                  <strong>{ticket.department_id}</strong>
                </div>

                <div className="employee-ticket-info-item">
                  <span>Project</span>
                  <strong>{ticket.project_id || "Not assigned"}</strong>
                </div>

                <div className="employee-ticket-info-item">
                  <span>Created At</span>
                  <strong>
                    {new Date(ticket.created_at).toLocaleString()}
                  </strong>
                </div>
              </div>
            </section>

            {/* STATUS */}

            {nextStatuses.length > 0 && (
              <section className="employee-ticket-card">
                <div className="employee-ticket-card-header">
                  <div>
                    <span className="employee-ticket-card-kicker">
                      WORKFLOW
                    </span>
                    <h2>Update Status</h2>
                  </div>
                </div>

                <form
                  onSubmit={handleStatusUpdate}
                  className="employee-ticket-form"
                >
                  <div className="employee-ticket-form-group">
                    <label htmlFor="new-status">New Status</label>

                    <select
                      id="new-status"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      disabled={statusLoading}
                    >
                      <option value="">Select new status</option>

                      {nextStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="employee-ticket-form-group">
                    <label htmlFor="status-comment">Status Comment</label>

                    <textarea
                      id="status-comment"
                      rows="3"
                      value={statusComment}
                      onChange={(e) => setStatusComment(e.target.value)}
                      placeholder="Add a comment about this status change..."
                      disabled={statusLoading}
                    />
                  </div>

                  <div className="employee-ticket-form-actions">
                    <button
                      type="submit"
                      className="employee-ticket-primary-button"
                      disabled={statusLoading || !newStatus}
                    >
                      {statusLoading ? (
                        <>
                          <span className="employee-ticket-button-spinner"></span>
                          Updating...
                        </>
                      ) : (
                        "Update Status"
                      )}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {/* DESCRIPTION */}

            <section className="employee-ticket-card">
              <div className="employee-ticket-card-header">
                <div>
                  <span className="employee-ticket-card-kicker">DETAILS</span>
                  <h2>Description</h2>
                </div>
              </div>

              <div className="employee-ticket-description">
                {ticket.description}
              </div>
            </section>

            {/* STATUS HISTORY */}

            <section className="employee-ticket-card">
              <div className="employee-ticket-card-header">
                <div>
                  <span className="employee-ticket-card-kicker">ACTIVITY</span>
                  <h2>Status History</h2>
                </div>

                <span className="employee-ticket-count">
                  {statusHistory.length}
                </span>
              </div>

              {statusHistory.length === 0 ? (
                <div className="employee-ticket-empty">
                  No status history available.
                </div>
              ) : (
                <div className="employee-ticket-timeline">
                  {statusHistory.map((history) => (
                    <div
                      key={history.id}
                      className="employee-ticket-timeline-item"
                    >
                      <div className="employee-ticket-timeline-dot"></div>

                      <div className="employee-ticket-timeline-content">
                        <div className="employee-ticket-timeline-title">
                          {history.old_status ? (
                            <>
                              <span>{history.old_status}</span>
                              <b>→</b>
                            </>
                          ) : null}

                          <strong>{history.new_status}</strong>
                        </div>

                        {history.comment && <p>{history.comment}</p>}

                        <small>
                          {new Date(history.created_at).toLocaleString()}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* COMMENTS */}

            <section className="employee-ticket-card">
              <div className="employee-ticket-card-header">
                <div>
                  <span className="employee-ticket-card-kicker">
                    DISCUSSION
                  </span>
                  <h2>Comments</h2>
                </div>

                <span className="employee-ticket-count">{comments.length}</span>
              </div>

              {comments.length === 0 ? (
                <div className="employee-ticket-empty">No comments yet.</div>
              ) : (
                <div className="employee-ticket-comments">
                  {comments.map((comment) => (
                    <div key={comment.id} className="employee-ticket-comment">
                      <div className="employee-ticket-comment-avatar">
                        {String(comment.user_id).slice(-2)}
                      </div>

                      <div className="employee-ticket-comment-body">
                        <div className="employee-ticket-comment-header">
                          <strong>User #{comment.user_id}</strong>

                          <small>
                            {new Date(comment.created_at).toLocaleString()}
                          </small>
                        </div>

                        <p>{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <form
                onSubmit={handleAddComment}
                className="employee-ticket-comment-form"
              >
                <div className="employee-ticket-form-group">
                  <label htmlFor="new-comment">Add Comment</label>

                  <textarea
                    id="new-comment"
                    rows="4"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write your comment..."
                    disabled={commentLoading}
                  />
                </div>

                <button
                  type="submit"
                  className="employee-ticket-primary-button"
                  disabled={commentLoading || !newComment.trim()}
                >
                  {commentLoading ? (
                    <>
                      <span className="employee-ticket-button-spinner"></span>
                      Adding...
                    </>
                  ) : (
                    <>
                      <span>+</span>
                      Add Comment
                    </>
                  )}
                </button>
              </form>
            </section>
          </div>

          {/* RIGHT */}

          <div className="employee-ticket-side-column">
            {/* ATTACHMENTS */}

            <section className="employee-ticket-card">
              <div className="employee-ticket-card-header">
                <div>
                  <span className="employee-ticket-card-kicker">FILES</span>
                  <h2>Attachments</h2>
                </div>

                <span className="employee-ticket-count">
                  {attachments.length}
                </span>
              </div>

              <form
                onSubmit={handleFileUpload}
                className="employee-ticket-upload-form"
              >
                <div className="employee-ticket-file-drop">
                  <div className="employee-ticket-file-icon">↑</div>

                  <strong>
                    {selectedFile ? selectedFile.name : "Choose a file"}
                  </strong>

                  <span>
                    {selectedFile
                      ? formatFileSize(selectedFile.size)
                      : "Maximum file size: 10 MB"}
                  </span>

                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                    disabled={uploadLoading}
                  />

                  <button
                    type="button"
                    className="employee-ticket-file-button"
                    onClick={(e) => {
                      e.currentTarget
                        .closest(".employee-ticket-file-drop")
                        .querySelector('input[type="file"]')
                        .click();
                    }}
                    disabled={uploadLoading}
                  >
                    Browse files
                  </button>
                </div>

                <button
                  type="submit"
                  className="employee-ticket-primary-button employee-ticket-upload-button"
                  disabled={uploadLoading || !selectedFile}
                >
                  {uploadLoading ? (
                    <>
                      <span className="employee-ticket-button-spinner"></span>
                      Uploading...
                    </>
                  ) : (
                    "Upload File"
                  )}
                </button>
              </form>

              <div className="employee-ticket-attachments-list">
                {attachments.length === 0 ? (
                  <div className="employee-ticket-empty">No attachments.</div>
                ) : (
                  attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="employee-ticket-attachment"
                    >
                      <div className="employee-ticket-attachment-icon">📎</div>

                      <div className="employee-ticket-attachment-info">
                        <strong title={attachment.original_filename}>
                          {attachment.original_filename}
                        </strong>

                        <small>{formatFileSize(attachment.file_size)}</small>
                      </div>

                      <div className="employee-ticket-attachment-actions">
                        <button
                          type="button"
                          title="Download"
                          onClick={() =>
                            handleDownload(
                              attachment.id,
                              attachment.original_filename,
                            )
                          }
                        >
                          ↓
                        </button>

                        <button
                          type="button"
                          title="Delete"
                          className="employee-ticket-delete-button"
                          onClick={() =>
                            openDeleteModal(
                              attachment.id,
                              attachment.original_filename,
                            )
                          }
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* DELETE MODAL */}

      {deleteAttachmentId && (
        <div
          className="employee-ticket-modal-overlay"
          onClick={closeDeleteModal}
        >
          <div
            className="employee-ticket-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="employee-ticket-modal-icon">!</div>

            <h2>Delete attachment?</h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>{deleteAttachmentName}</strong>? This action cannot be
              undone.
            </p>

            <div className="employee-ticket-modal-actions">
              <button
                type="button"
                className="employee-ticket-modal-cancel"
                onClick={closeDeleteModal}
              >
                Cancel
              </button>

              <button
                type="button"
                className="employee-ticket-modal-delete"
                onClick={handleDeleteAttachment}
              >
                Delete attachment
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default EmployeeTicketDetail;
