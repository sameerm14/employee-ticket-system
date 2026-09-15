import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../services/api";
import "./AdminNotifications.css";

function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [isRead, setIsRead] = useState("");
  const [notificationType, setNotificationType] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchNotifications();
  }, [page, isRead, notificationType]);

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

      if (isRead !== "") {
        params.is_read = isRead === "true";
      }

      if (notificationType) {
        params.notification_type = notificationType;
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

  const markAsRead = async (notificationId) => {
    try {
      setError("");

      await api.patch(`/api/notifications/${notificationId}/read`);

      await fetchNotifications();
      await fetchUnreadCount();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to mark notification as read.",
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      setError("");

      await api.patch("/api/notifications/read-all");

      await fetchNotifications();
      await fetchUnreadCount();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to mark notifications as read.",
      );
    }
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

  const getNotificationIcon = (type) => {
    switch (type) {
      case "TICKET_CREATED":
        return "＋";

      case "TICKET_ASSIGNED":
        return "✓";

      case "TICKET_REASSIGNED":
        return "↗";

      case "STATUS_CHANGED":
        return "↻";

      case "COMMENT_ADDED":
        return "•••";

      case "TICKET_RESOLVED":
        return "✓";

      default:
        return "!";
    }
  };

  const getNotificationTypeName = (type) => {
    switch (type) {
      case "TICKET_CREATED":
        return "Ticket Created";

      case "TICKET_ASSIGNED":
        return "Ticket Assigned";

      case "TICKET_REASSIGNED":
        return "Ticket Reassigned";

      case "STATUS_CHANGED":
        return "Status Changed";

      case "COMMENT_ADDED":
        return "Comment Added";

      case "TICKET_RESOLVED":
        return "Ticket Resolved";

      default:
        return type;
    }
  };

  return (
    <Layout>
      <div className="admin-notifications-page">
        {/* Header */}
        <div className="admin-notifications-header">
          <div>
            <div className="admin-notifications-eyebrow">
              ADMIN CONTROL CENTER
            </div>

            <h1>Notifications</h1>

            <p>
              Monitor system activity, ticket events, and important updates.
            </p>
          </div>

          <button
            className="admin-notifications-mark-all"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <span>✓</span>
            Mark All as Read
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="admin-notifications-error">
            <div className="admin-notifications-error-icon">!</div>

            <div>
              <strong>Something went wrong</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="admin-notifications-summary">
          <div className="admin-notifications-unread-card">
            <div className="admin-notifications-summary-icon">🔔</div>

            <div className="admin-notifications-summary-content">
              <span>UNREAD NOTIFICATIONS</span>
              <strong>{unreadCount}</strong>
              <small>
                {unreadCount === 0
                  ? "All notifications are read"
                  : "Require your attention"}
              </small>
            </div>
          </div>

          <div className="admin-notifications-summary-info">
            <span>NOTIFICATION CENTER</span>
            <strong>System Activity</strong>
            <small>
              Review ticket and workflow events from across the platform.
            </small>
          </div>
        </div>

        {/* Filters */}
        <section className="admin-notifications-filter-panel">
          <div className="admin-notifications-section-heading">
            <div>
              <span>FILTER & CONTROL</span>
              <h2>Notification Filters</h2>
            </div>

            {(isRead !== "" || notificationType !== "") && (
              <button
                className="admin-notifications-clear-filter"
                onClick={() => {
                  setIsRead("");
                  setNotificationType("");
                  setPage(1);
                }}
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="admin-notifications-filter-grid">
            <div className="admin-notifications-field">
              <label>Read Status</label>

              <select
                value={isRead}
                onChange={(e) => {
                  setIsRead(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Notifications</option>
                <option value="false">Unread</option>
                <option value="true">Read</option>
              </select>
            </div>

            <div className="admin-notifications-field">
              <label>Notification Type</label>

              <select
                value={notificationType}
                onChange={(e) => {
                  setNotificationType(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Types</option>
                <option value="TICKET_CREATED">Ticket Created</option>
                <option value="TICKET_ASSIGNED">Ticket Assigned</option>
                <option value="TICKET_REASSIGNED">Ticket Reassigned</option>
                <option value="STATUS_CHANGED">Status Changed</option>
                <option value="COMMENT_ADDED">Comment Added</option>
                <option value="TICKET_RESOLVED">Ticket Resolved</option>
              </select>
            </div>
          </div>
        </section>

        {/* Notification List */}
        <section className="admin-notifications-list-panel">
          <div className="admin-notifications-list-header">
            <div>
              <span>ACTIVITY FEED</span>
              <h2>Recent Notifications</h2>
            </div>

            <div className="admin-notifications-list-count">
              {notifications.length} shown
            </div>
          </div>

          {loading ? (
            <div className="admin-notifications-loading">
              <div className="admin-notifications-spinner"></div>
              <strong>Loading notifications</strong>
              <span>Fetching the latest system activity...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="admin-notifications-empty">
              <div className="admin-notifications-empty-icon">🔔</div>

              <h3>No notifications found</h3>

              <p>There are no notifications matching the selected filters.</p>
            </div>
          ) : (
            <div className="admin-notifications-list">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`admin-notification-row ${
                    !notification.is_read ? "admin-notification-row-unread" : ""
                  }`}
                >
                  {/* Left indicator */}
                  <div className="admin-notification-indicator">
                    {!notification.is_read && <span></span>}
                  </div>

                  {/* Icon */}
                  <div
                    className={`admin-notification-icon admin-notification-icon-${notification.notification_type
                      ?.toLowerCase()
                      .replaceAll("_", "-")}`}
                  >
                    {getNotificationIcon(notification.notification_type)}
                  </div>

                  {/* Content */}
                  <div className="admin-notification-content">
                    <div className="admin-notification-title-row">
                      <h3>{notification.title}</h3>

                      {!notification.is_read && (
                        <span className="admin-notification-unread-badge">
                          UNREAD
                        </span>
                      )}
                    </div>

                    <p>{notification.message}</p>

                    <div className="admin-notification-meta">
                      <span className="admin-notification-type">
                        {getNotificationTypeName(
                          notification.notification_type,
                        )}
                      </span>

                      {notification.ticket_id && (
                        <span>Ticket #{notification.ticket_id}</span>
                      )}

                      <span>
                        {new Date(notification.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  {!notification.is_read && (
                    <button
                      className="admin-notification-read-btn"
                      onClick={() => markAsRead(notification.id)}
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
        <div className="admin-notifications-pagination">
          <button onClick={handlePreviousPage} disabled={page === 1}>
            ← Previous
          </button>

          <div className="admin-notifications-page-number">
            <span>PAGE</span>
            <strong>{page}</strong>
            <span>OF</span>
            <strong>{totalPages}</strong>
          </div>

          <button onClick={handleNextPage} disabled={page === totalPages}>
            Next →
          </button>
        </div>
      </div>
    </Layout>
  );
}

export default AdminNotifications;
