import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./EmployeeNotifications.css";

function EmployeeNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const pageSize = 10;

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/notifications", {
        params: {
          page,
          page_size: pageSize,
        },
      });

      setNotifications(response.data.notifications);
      setTotalPages(response.data.total_pages);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get("/api/notifications/unread-count");

      setUnreadCount(response.data.unread_count);
    } catch (err) {
      console.error("Failed to load unread count", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [page]);

  const markAsRead = async (notificationId) => {
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

  const markAllAsRead = async () => {
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

  const handleNotificationClick = (notification) => {
    if (notification.ticket_id) {
      navigate(`/employee/tickets/${notification.ticket_id}`);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);

    return date.toLocaleString();
  };

  if (loading) {
    return (
      <Layout>
        <div className="employee-notifications-loading">
          <div className="employee-notifications-spinner"></div>
          <p>Loading notifications...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="employee-notifications">
        {/* Header */}
        <div className="employee-notifications-header">
          <div>
            <span className="employee-notifications-eyebrow">ACTIVITY</span>

            <h1>Notifications</h1>

            <p>Stay updated on your tickets and workflow activity.</p>
          </div>

          <button
            type="button"
            className="employee-mark-all"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <span>✓</span>
            Mark all as read
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="employee-notifications-error">
            <div className="employee-notifications-error-icon">!</div>

            <div>
              <strong>Something went wrong</strong>
              <p>{error}</p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="employee-notifications-error-close"
            >
              ×
            </button>
          </div>
        )}

        {/* Summary */}
        <div className="employee-notification-stats">
          <div className="employee-notification-stat">
            <div className="employee-notification-stat-icon unread">●</div>

            <div>
              <span>Unread notifications</span>
              <strong>{unreadCount}</strong>
            </div>
          </div>

          <div className="employee-notification-stat">
            <div className="employee-notification-stat-icon page">▤</div>

            <div>
              <span>Notifications on this page</span>
              <strong>{notifications.length}</strong>
            </div>
          </div>
        </div>

        {/* Notification Card */}
        <div className="employee-notification-card">
          <div className="employee-notification-card-header">
            <div>
              <span className="employee-notification-card-kicker">INBOX</span>

              <h2>Your notifications</h2>
            </div>

            {unreadCount > 0 && (
              <span className="employee-unread-count">
                {unreadCount} unread
              </span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="employee-notifications-empty">
              <div className="employee-notifications-empty-icon">✓</div>

              <h3>You're all caught up</h3>

              <p>You don't have any notifications at the moment.</p>
            </div>
          ) : (
            <div className="employee-notification-list">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`employee-notification-item ${
                    !notification.is_read ? "employee-notification-unread" : ""
                  }`}
                >
                  <div
                    className={`employee-notification-icon ${
                      notification.is_read ? "read" : "unread"
                    }`}
                  >
                    {notification.is_read ? "✓" : "●"}
                  </div>

                  <div
                    className={`employee-notification-content ${
                      notification.ticket_id ? "clickable" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="employee-notification-title-row">
                      <h3>{notification.title}</h3>

                      {!notification.is_read && (
                        <span className="employee-unread-badge">Unread</span>
                      )}
                    </div>

                    <p className="employee-notification-message">
                      {notification.message}
                    </p>

                    <div className="employee-notification-meta">
                      <span className="employee-notification-type">
                        {notification.notification_type}
                      </span>

                      <span>{formatDate(notification.created_at)}</span>

                      {notification.ticket_id && (
                        <span className="employee-notification-ticket">
                          View ticket →
                        </span>
                      )}
                    </div>
                  </div>

                  {!notification.is_read && (
                    <button
                      type="button"
                      className="employee-mark-read"
                      onClick={() => markAsRead(notification.id)}
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="employee-notification-pagination">
              <button
                type="button"
                className="employee-pagination-button"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                ← Previous
              </button>

              <span>
                Page <strong>{page}</strong> of <strong>{totalPages}</strong>
              </span>

              <button
                type="button"
                className="employee-pagination-button"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default EmployeeNotifications;
