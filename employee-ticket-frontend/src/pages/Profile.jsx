import { useEffect, useState } from "react";
import api from "../services/api";
import "./Profile.css";
import Layout from "../components/Layout";

function Profile() {
  const [user, setUser] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const [userResponse, departmentsResponse, teamsResponse] =
        await Promise.all([
          api.get("/api/auth/me"),
          api.get("/api/departments"),
          api.get("/api/teams"),
        ]);

      setUser(userResponse.data);

      const departmentData = departmentsResponse.data;
      const teamData = teamsResponse.data;

      setDepartments(
        departmentData?.departments ||
          departmentData?.items ||
          departmentData ||
          [],
      );

      setTeams(teamData?.teams || teamData?.items || teamData || []);
    } catch (err) {
      console.error("Failed to load profile:", err);

      setError(err.response?.data?.detail || "Unable to load your profile.");
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentName = () => {
    if (!user?.department_id) {
      return "Not assigned";
    }

    const department = departments.find(
      (item) => item.id === user.department_id,
    );

    return department?.name || "Not assigned";
  };

  const getTeamName = () => {
    if (!user?.team_id) {
      return "Not assigned";
    }

    const team = teams.find((item) => item.id === user.team_id);

    return team?.name || "Not assigned";
  };

  const getRoleLabel = () => {
    if (user?.role === "ADMIN") {
      return "Administrator";
    }

    if (user?.role === "TEAM_LEAD") {
      return "Team Lead";
    }

    return "Employee";
  };

  const getWorkModeLabel = () => {
    if (!user?.work_mode) {
      return "Not specified";
    }

    return user.work_mode.replace(/_/g, " ");
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="profile-error">
          <h2>Unable to load profile</h2>
          <p>{error}</p>

          <button
            type="button"
            onClick={fetchProfile}
            className="profile-retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="profile-page">
        {/* Header */}
        <div className="profile-header">
          <div>
            <span className="profile-eyebrow">ACCOUNT</span>

            <h1>My Profile</h1>

            <p>View your account information and workspace details.</p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="profile-main-card">
          {/* Avatar / Identity */}
          <div className="profile-identity">
            <div className="profile-avatar">
              {user.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
            </div>

            <div className="profile-identity-info">
              <h2>{user.full_name}</h2>

              <p>{user.email}</p>

              <span className="profile-role-badge">{getRoleLabel()}</span>
            </div>
          </div>

          {/* Account Status */}
          <div className="profile-status-section">
            <span className="profile-status-label">Account Status</span>

            <span
              className={`profile-status ${
                user.is_active ? "active" : "inactive"
              }`}
            >
              <span className="profile-status-dot"></span>

              {user.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {/* Personal Information */}
        <div className="profile-section">
          <div className="profile-section-header">
            <div>
              <h2>Personal Information</h2>
              <p>Your basic account information.</p>
            </div>
          </div>

          <div className="profile-grid">
            <div className="profile-field">
              <span className="profile-field-label">Full Name</span>

              <span className="profile-field-value">
                {user.full_name || "Not specified"}
              </span>
            </div>

            <div className="profile-field">
              <span className="profile-field-label">Email Address</span>

              <span className="profile-field-value">{user.email}</span>
            </div>

            <div className="profile-field">
              <span className="profile-field-label">Role</span>

              <span className="profile-field-value">{getRoleLabel()}</span>
            </div>

            <div className="profile-field">
              <span className="profile-field-label">Location</span>

              <span className="profile-field-value">
                {user.location || "Not specified"}
              </span>
            </div>
          </div>
        </div>

        {/* Workspace Information */}
        <div className="profile-section">
          <div className="profile-section-header">
            <div>
              <h2>Workspace Information</h2>
              <p>Your department, team and working arrangement.</p>
            </div>
          </div>

          <div className="profile-grid">
            <div className="profile-field">
              <span className="profile-field-label">Department</span>

              <span className="profile-field-value">{getDepartmentName()}</span>
            </div>

            <div className="profile-field">
              <span className="profile-field-label">Team</span>

              <span className="profile-field-value">{getTeamName()}</span>
            </div>

            <div className="profile-field">
              <span className="profile-field-label">Work Mode</span>

              <span className="profile-field-value">{getWorkModeLabel()}</span>
            </div>

            <div className="profile-field">
              <span className="profile-field-label">User ID</span>

              <span className="profile-field-value">#{user.id}</span>
            </div>
          </div>
        </div>

        {/* Information Note */}
        <div className="profile-info-box">
          <div className="profile-info-icon">i</div>

          <div>
            <strong>Profile information</strong>

            <p>
              Your profile details are managed by the system administrator.
              Contact your administrator if you need to change your account,
              department, team or work information.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Profile;
