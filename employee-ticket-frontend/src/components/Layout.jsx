import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Footer from "./Footer";
import "./Layout.css";

function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const role = user?.role;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getRoleLabel = () => {
    if (role === "ADMIN") return "Administrator";
    if (role === "TEAM_LEAD") return "Team Lead";
    return "Employee";
  };

  const getRoleShort = () => {
    if (role === "ADMIN") return "AD";
    if (role === "TEAM_LEAD") return "TL";
    return "EM";
  };

  const navClass = ({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`;

  return (
    <div className="app-layout">
      {/* =====================================
          SIDEBAR
      ===================================== */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-logo">TF</div>

          <div className="sidebar-brand-text">
            <h2>TicketFlow</h2>
            <span>Support Management</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {/* EMPLOYEE */}
          {role === "EMPLOYEE" && (
            <>
              <div className="sidebar-section-title">
                <span>WORKSPACE</span>
              </div>

              <NavLink to="/employee/dashboard" className={navClass}>
                <span className="sidebar-link-icon">⌂</span>
                <span className="sidebar-link-text">Dashboard</span>
              </NavLink>

              <NavLink to="/employee/tickets" className={navClass}>
                <span className="sidebar-link-icon">▤</span>
                <span className="sidebar-link-text">My Tickets</span>
              </NavLink>

              <NavLink to="/employee/notifications" className={navClass}>
                <span className="sidebar-link-icon">♢</span>
                <span className="sidebar-link-text">Notifications</span>
              </NavLink>
            </>
          )}

          {/* TEAM LEAD */}
          {role === "TEAM_LEAD" && (
            <>
              <div className="sidebar-section-title">
                <span>WORKSPACE</span>
              </div>

              <NavLink to="/team-lead/dashboard" className={navClass}>
                <span className="sidebar-link-icon">⌂</span>
                <span className="sidebar-link-text">Dashboard</span>
              </NavLink>

              <NavLink to="/team-lead/tickets" className={navClass}>
                <span className="sidebar-link-icon">▤</span>
                <span className="sidebar-link-text">Tickets</span>
              </NavLink>

              <NavLink to="/team-lead/team" className={navClass}>
                <span className="sidebar-link-icon">♙</span>
                <span className="sidebar-link-text">My Team</span>
              </NavLink>

              <NavLink to="/team-lead/notifications" className={navClass}>
                <span className="sidebar-link-icon">♢</span>
                <span className="sidebar-link-text">Notifications</span>
              </NavLink>
            </>
          )}

          {/* ADMIN */}
          {role === "ADMIN" && (
            <>
              <div className="sidebar-section-title">
                <span>ADMINISTRATION</span>
              </div>

              <NavLink to="/admin/dashboard" className={navClass}>
                <span className="sidebar-link-icon">⌂</span>
                <span className="sidebar-link-text">Dashboard</span>
              </NavLink>

              <NavLink to="/admin/users" className={navClass}>
                <span className="sidebar-link-icon">♙</span>
                <span className="sidebar-link-text">Users</span>
              </NavLink>

              <NavLink to="/admin/departments" className={navClass}>
                <span className="sidebar-link-icon">▦</span>
                <span className="sidebar-link-text">Departments</span>
              </NavLink>

              <NavLink to="/admin/teams" className={navClass}>
                <span className="sidebar-link-icon">♧</span>
                <span className="sidebar-link-text">Teams</span>
              </NavLink>

              <NavLink to="/admin/projects" className={navClass}>
                <span className="sidebar-link-icon">◇</span>
                <span className="sidebar-link-text">Projects</span>
              </NavLink>

              <NavLink to="/admin/tickets" className={navClass}>
                <span className="sidebar-link-icon">▤</span>
                <span className="sidebar-link-text">Tickets</span>
              </NavLink>

              <NavLink to="/admin/notifications" className={navClass}>
                <span className="sidebar-link-icon">♢</span>
                <span className="sidebar-link-text">Notifications</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* User / Logout */}
        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{getRoleShort()}</div>

            <div className="sidebar-user-info">
              <strong>{getRoleLabel()}</strong>
              <span>Signed in</span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-logout"
            onClick={() => setShowLogoutModal(true)}
          >
            <span className="sidebar-logout-icon">↪</span>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* =====================================
          MAIN AREA
      ===================================== */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <div className="topbar-mobile-logo">TF</div>

            <div>
              <h1>Employee Ticket System</h1>
              <span>Manage your support workflow</span>
            </div>
          </div>

          <div className="topbar-right">
            <div className="topbar-role">
              <span className="topbar-role-dot"></span>
              <span>{getRoleLabel()}</span>
            </div>

            <div className="topbar-avatar">{getRoleShort()}</div>
          </div>
        </header>

        {/* Page */}
        <section className="page-container">{children}</section>

        <Footer />
      </main>

      {/* =====================================
          LOGOUT MODAL
      ===================================== */}
      {showLogoutModal && (
        <div
          className="logout-modal-overlay"
          onClick={() => setShowLogoutModal(false)}
        >
          <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="logout-modal-icon">↪</div>

            <h2>Sign out?</h2>

            <p>Are you sure you want to sign out of your TicketFlow account?</p>

            <div className="logout-modal-actions">
              <button
                type="button"
                className="logout-cancel"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="logout-confirm"
                onClick={handleLogout}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Layout;
