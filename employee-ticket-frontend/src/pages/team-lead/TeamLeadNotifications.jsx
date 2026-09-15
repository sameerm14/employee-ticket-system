import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../services/api";
import "./TeamLeadNotifications.css";

function TeamLeadNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [notificationType, setNotificationType] = useState("");
  const [isRead, setIsRead] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchNotifications();
  }, [page, notificationType, isRead]);

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        page_size: pageSize,
      };

      if (notificationType) {
        params.notification_type = notificationType;
      }

      if (isRead !== "") {
        params.is_read = isRead;
      }

      const response = await api.get("/api/notifications", {
        params,
      });

      setNotifications(response.data.notifications || []);
      setTotalPages(response.data.total_pages || 1);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get("/api/notifications/unread-count");

      setUnreadCount(response.data.unread_count || 0);
    } catch (err) {
      console.error("Failed to load unread count.", err);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.patch(`/api/notifications/${notificationId}/read`);

      await fetchNotifications();
      await fetchUnreadCount();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to mark notification as read.",
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch("/api/notifications/read-all");

      await fetchNotifications();
      await fetchUnreadCount();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to mark all notifications as read.",
      );
    }
  };

  const handleTypeChange = (e) => {
    setNotificationType(e.target.value);
    setPage(1);
  };

  const handleReadChange = (e) => {
    setIsRead(e.target.value);
    setPage(1);
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

  const formatNotificationType = (type) => {
    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getNotificationClass = (type) => {
    switch (type) {
      case "TICKET_CREATED":
        return "notification-type-created";

      case "ASSIGNED":
        return "notification-type-assigned";

      case "REASSIGNED":
        return "notification-type-reassigned";

      case "STATUS_CHANGED":
        return "notification-type-status";

      case "COMMENT":
        return "notification-type-comment";

      case "RESOLVED":
        return "notification-type-resolved";

      default:
        return "notification-type-default";
    }
  };

  return (
    <Layout>
      <div className="team-lead-notifications-page">
        {/* Header */}
        <div className="team-lead-notifications-header">
          <div>
            <span className="team-lead-notifications-eyebrow">
              TEAM OPERATIONS
            </span>

            <h1>Notifications</h1>

            <p>
              Stay updated with ticket activity, assignments, and workflow
              changes.
            </p>
          </div>

          {unreadCount > 0 && (
            <div className="team-lead-unread-header">
              <span>Unread</span>
              <strong>{unreadCount}</strong>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="team-lead-notifications-error">
            <div className="team-lead-notifications-error-icon">!</div>

            <div className="team-lead-notifications-error-content">
              <strong>Notification error</strong>
              <p>{error}</p>
            </div>

            <button
              type="button"
              onClick={fetchNotifications}
              className="team-lead-notifications-retry"
            >
              Try again
            </button>

            <button
              type="button"
              className="team-lead-notifications-error-close"
              onClick={() => setError("")}
            >
              ×
            </button>
          </div>
        )}

        {/* Summary */}
        <section className="team-lead-notification-summary">
          <div className="team-lead-notification-summary-heading">
            <span>NOTIFICATION CENTER</span>
            <h2>Activity overview</h2>
          </div>

          <div className="team-lead-notification-summary-grid">
            <div className="team-lead-notification-stat unread">
              <div className="team-lead-notification-stat-top">
                <span>Unread Notifications</span>

                <div className="team-lead-notification-stat-icon">!</div>
              </div>

              <strong>{unreadCount}</strong>

              <p>Require your attention</p>
            </div>

            <div className="team-lead-notification-stat activity">
              <div className="team-lead-notification-stat-top">
                <span>Current Page</span>

                <div className="team-lead-notification-stat-icon">#</div>
              </div>

              <strong>{notifications.length}</strong>

              <p>Notifications displayed</p>
            </div>

            <div className="team-lead-notification-stat pages">
              <div className="team-lead-notification-stat-top">
                <span>Total Pages</span>

                <div className="team-lead-notification-stat-icon">≡</div>
              </div>

              <strong>{totalPages}</strong>

              <p>Available notification pages</p>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="team-lead-notification-filter-panel">
          <div className="team-lead-notification-filter-header">
            <div>
              <span>FILTER ACTIVITY</span>
              <h2>Notification filters</h2>
            </div>

            {(notificationType || isRead !== "") && (
              <button
                type="button"
                className="team-lead-notification-clear"
                onClick={() => {
                  setNotificationType("");
                  setIsRead("");
                  setPage(1);
                }}
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="team-lead-notification-filters">
            <div className="team-lead-notification-filter">
              <label>Notification Type</label>

              <select value={notificationType} onChange={handleTypeChange}>
                <option value="">All Types</option>
                <option value="TICKET_CREATED">Ticket Created</option>
                <option value="ASSIGNED">Assignment</option>
                <option value="REASSIGNED">Reassignment</option>
                <option value="STATUS_CHANGED">Status Changed</option>
                <option value="COMMENT">Comment</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>

            <div className="team-lead-notification-filter">
              <label>Read Status</label>

              <select value={isRead} onChange={handleReadChange}>
                <option value="">All</option>
                <option value="false">Unread</option>
                <option value="true">Read</option>
              </select>
            </div>

            <button
              type="button"
              className="team-lead-mark-all-btn"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              <span>✓</span>
              Mark All as Read
            </button>
          </div>
        </section>

        {/* Notification List */}
        <section className="team-lead-notification-panel">
          <div className="team-lead-notification-panel-header">
            <div>
              <span>RECENT ACTIVITY</span>
              <h2>Your Notifications</h2>
            </div>

            {!loading && notifications.length > 0 && (
              <span className="team-lead-notification-page-badge">
                Page {page} of {totalPages}
              </span>
            )}
          </div>

          {loading ? (
            <div className="team-lead-notifications-loading">
              <div className="team-lead-notification-spinner"></div>

              <h3>Loading notifications</h3>

              <p>Fetching your latest activity...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="team-lead-notifications-empty">
              <div className="team-lead-notifications-empty-icon">✓</div>

              <h3>No notifications found</h3>

              <p>There are no notifications matching your current filters.</p>

              {(notificationType || isRead !== "") && (
                <button
                  type="button"
                  className="team-lead-empty-clear"
                  onClick={() => {
                    setNotificationType("");
                    setIsRead("");
                    setPage(1);
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="team-lead-notifications-list">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`team-lead-notification-item ${
                    !notification.is_read ? "team-lead-notification-unread" : ""
                  }`}
                >
                  {/* Type indicator */}
                  <div
                    className={`team-lead-notification-type-icon ${getNotificationClass(
                      notification.notification_type,
                    )}`}
                  >
                    {notification.notification_type === "TICKET_CREATED"
                      ? "+"
                      : notification.notification_type === "ASSIGNED"
                        ? "→"
                        : notification.notification_type === "REASSIGNED"
                          ? "↔"
                          : notification.notification_type === "STATUS_CHANGED"
                            ? "↻"
                            : notification.notification_type === "COMMENT"
                              ? "C"
                              : notification.notification_type === "RESOLVED"
                                ? "✓"
                                : "•"}
                  </div>

                  <div className="team-lead-notification-content">
                    <div className="team-lead-notification-title-row">
                      <div>
                        <strong>{notification.title}</strong>

                        {!notification.is_read && (
                          <span className="team-lead-unread-dot">Unread</span>
                        )}
                      </div>

                      <span className="team-lead-notification-time">
                        {new Date(notification.created_at).toLocaleString()}
                      </span>
                    </div>

                    <p>{notification.message}</p>

                    <div className="team-lead-notification-meta">
                      <span
                        className={`team-lead-notification-type-badge ${getNotificationClass(
                          notification.notification_type,
                        )}`}
                      >
                        {formatNotificationType(notification.notification_type)}
                      </span>

                      {notification.ticket_id && (
                        <span className="team-lead-ticket-reference">
                          Ticket #{notification.ticket_id}
                        </span>
                      )}
                    </div>
                  </div>

                  {!notification.is_read && (
                    <button
                      type="button"
                      className="team-lead-mark-read-btn"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="team-lead-notification-pagination">
            <span>
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>

            <div>
              <button
                type="button"
                onClick={handlePreviousPage}
                disabled={page === 1}
              >
                ← Previous
              </button>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={page === totalPages}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default TeamLeadNotifications;
