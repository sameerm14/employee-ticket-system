import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../services/api";
import "./AdminUsers.css";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [isActive, setIsActive] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalPages, setTotalPages] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [userToToggle, setUserToToggle] = useState(null);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
    department_id: "",
    team_id: "",
    location: "",
    work_mode: "",
    is_active: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [page, role, isActive]);

  useEffect(() => {
    fetchDepartments();
    fetchTeams();
  }, []);

  const fetchUsers = async () => {
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

      if (role) {
        params.role = role;
      }

      if (isActive !== "") {
        params.is_active = isActive;
      }

      const response = await api.get("/api/users", { params });

      setUsers(response.data.users || []);
      setTotalPages(response.data.total_pages || 1);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/api/departments", {
        params: {
          page: 1,
          page_size: 100,
        },
      });

      setDepartments(response.data.departments || []);
    } catch (err) {
      console.error("Failed to load departments.", err);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await api.get("/api/teams", {
        params: {
          page: 1,
          page_size: 100,
        },
      });

      setTeams(response.data.teams || []);
    } catch (err) {
      console.error("Failed to load teams.", err);
    }
  };

  const getDepartmentName = (departmentId) => {
    const department = departments.find((item) => item.id === departmentId);

    return department ? department.name : `Department #${departmentId}`;
  };

  const getTeamName = (teamId) => {
    const team = teams.find((item) => item.id === teamId);

    return team ? team.name : `Team #${teamId}`;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const resetForm = () => {
    setForm({
      full_name: "",
      email: "",
      password: "",
      role: "EMPLOYEE",
      department_id: "",
      team_id: "",
      location: "",
      work_mode: "",
      is_active: true,
    });

    setEditingUser(null);
    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCreate = () => {
    setEditingUser(null);

    setForm({
      full_name: "",
      email: "",
      password: "",
      role: "EMPLOYEE",
      department_id: "",
      team_id: "",
      location: "",
      work_mode: "",
      is_active: true,
    });

    setShowForm(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);

    setForm({
      full_name: user.full_name || "",
      email: user.email || "",
      password: "",
      role: user.role || "EMPLOYEE",
      department_id: user.department_id || "",
      team_id: user.team_id || "",
      location: user.location || "",
      work_mode: user.work_mode || "",
      is_active: user.is_active,
    });

    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const data = {
        full_name: form.full_name,
        email: form.email,
        role: form.role,
        department_id: form.department_id ? Number(form.department_id) : null,
        team_id: form.team_id ? Number(form.team_id) : null,
        location: form.location || null,
        work_mode: form.work_mode || null,
        is_active: form.is_active,
      };

      if (!editingUser) {
        data.password = form.password;
      } else if (form.password) {
        data.password = form.password;
      }

      if (editingUser) {
        await api.put(`/api/users/${editingUser.id}`, data);
      } else {
        await api.post("/api/users", data);
      }

      resetForm();
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save user.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = (user) => {
    setUserToToggle(user);
    setShowConfirm(true);
  };

  const confirmToggleActive = async () => {
    if (!userToToggle) return;

    const user = userToToggle;
    const action = user.is_active ? "deactivate" : "activate";

    try {
      setError("");

      await api.put(`/api/users/${user.id}`, {
        is_active: !user.is_active,
      });

      setShowConfirm(false);
      setUserToToggle(null);

      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to ${action} user.`);

      setShowConfirm(false);
      setUserToToggle(null);
    }
  };

  const cancelToggle = () => {
    setShowConfirm(false);
    setUserToToggle(null);
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

  const getRoleClass = (userRole) => {
    switch (userRole) {
      case "ADMIN":
        return "admin-users-role admin-users-role-admin";

      case "TEAM_LEAD":
        return "admin-users-role admin-users-role-lead";

      default:
        return "admin-users-role admin-users-role-employee";
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  };

  return (
    <Layout>
      <div className="admin-users-page">
        {/* Header */}
        <div className="admin-users-header">
          <div className="admin-users-header-content">
            <div className="admin-users-eyebrow">ADMIN CONTROL CENTER</div>

            <h1>User Management</h1>

            <p>
              Manage employees, administrators, roles, departments and workplace
              assignments.
            </p>
          </div>

          <button className="admin-users-create-btn" onClick={handleCreate}>
            <span className="admin-users-create-icon">+</span>
            Create User
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="admin-users-error">
            <div className="admin-users-error-icon">!</div>

            <div>
              <strong>Something went wrong</strong>
              <p>{error}</p>
            </div>

            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        {/* Filters */}
        <section className="admin-users-panel admin-users-filter-panel">
          <div className="admin-users-panel-heading">
            <div>
              <span className="admin-users-section-kicker">DIRECTORY</span>

              <h2>Search & Filters</h2>
            </div>

            <span className="admin-users-panel-badge">User Directory</span>
          </div>

          <form onSubmit={handleSearch}>
            <div className="admin-users-filters">
              <div className="admin-users-field admin-users-search-field">
                <label>Search Users</label>

                <div className="admin-users-input-wrapper">
                  <span className="admin-users-input-icon">⌕</span>

                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-users-field">
                <label>Role</label>

                <select
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="TEAM_LEAD">Team Lead</option>
                  <option value="EMPLOYEE">Employee</option>
                </select>
              </div>

              <div className="admin-users-field">
                <label>Status</label>

                <select
                  value={isActive}
                  onChange={(e) => {
                    setIsActive(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Statuses</option>

                  <option value="true">Active</option>

                  <option value="false">Inactive</option>
                </select>
              </div>

              <div className="admin-users-filter-action">
                <button type="submit">Apply Filters</button>
              </div>
            </div>
          </form>
        </section>

        {/* Create / Edit Form */}
        {showForm && (
          <section className="admin-users-panel admin-users-form-panel">
            <div className="admin-users-panel-heading">
              <div>
                <span className="admin-users-section-kicker">USER ACCOUNT</span>

                <h2>{editingUser ? "Edit User" : "Create User"}</h2>
              </div>

              <button
                className="admin-users-close-btn"
                type="button"
                onClick={resetForm}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-users-form-grid">
                <div className="admin-users-field">
                  <label>Full Name *</label>

                  <input
                    type="text"
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="admin-users-field">
                  <label>Email *</label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="employee@company.com"
                    required
                  />
                </div>

                <div className="admin-users-field">
                  <label>Password {editingUser ? "" : "*"}</label>

                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder={
                      editingUser
                        ? "Leave blank to keep current password"
                        : "Enter password"
                    }
                    required={!editingUser}
                  />
                </div>

                <div className="admin-users-field">
                  <label>Role *</label>

                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="EMPLOYEE">Employee</option>

                    <option value="TEAM_LEAD">Team Lead</option>

                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div className="admin-users-field">
                  <label>Department</label>

                  <select
                    name="department_id"
                    value={form.department_id}
                    onChange={handleChange}
                  >
                    <option value="">Select Department</option>

                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-users-field">
                  <label>Team</label>

                  <select
                    name="team_id"
                    value={form.team_id}
                    onChange={handleChange}
                  >
                    <option value="">Select Team</option>

                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-users-field">
                  <label>Location</label>

                  <input
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="Bengaluru"
                  />
                </div>

                <div className="admin-users-field">
                  <label>Work Mode</label>

                  <select
                    name="work_mode"
                    value={form.work_mode}
                    onChange={handleChange}
                  >
                    <option value="">Select Work Mode</option>

                    <option value="WFO">WFO</option>

                    <option value="WFH">WFH</option>

                    <option value="HYBRID">Hybrid</option>
                  </select>
                </div>

                <div className="admin-users-active-field">
                  <label className="admin-users-toggle">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={form.is_active}
                      onChange={handleChange}
                    />

                    <span className="admin-users-toggle-track">
                      <span className="admin-users-toggle-thumb" />
                    </span>

                    <span>
                      <strong>Active User</strong>
                      <small>User can access the system</small>
                    </span>
                  </label>
                </div>
              </div>

              <div className="admin-users-form-actions">
                <button
                  type="submit"
                  className="admin-users-save-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingUser
                      ? "Update User"
                      : "Create User"}
                </button>

                <button
                  type="button"
                  className="admin-users-cancel-btn"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Users */}
        <section className="admin-users-panel admin-users-table-panel">
          <div className="admin-users-panel-heading">
            <div>
              <span className="admin-users-section-kicker">ACCOUNTS</span>

              <h2>System Users</h2>
            </div>

            <span className="admin-users-count-badge">
              {users.length} shown
            </span>
          </div>

          {loading ? (
            <div className="admin-users-state">
              <div className="admin-users-spinner" />

              <strong>Loading users</strong>

              <p>Fetching the latest user directory...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="admin-users-state">
              <div className="admin-users-empty-icon">◎</div>

              <strong>No users found</strong>

              <p>Try changing the search or filter criteria.</p>
            </div>
          ) : (
            <div className="admin-users-table-wrapper">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Team</th>
                    <th>Location</th>
                    <th>Work Mode</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="admin-users-user-cell">
                          <div className="admin-users-avatar">
                            {getInitials(user.full_name)}
                          </div>

                          <div>
                            <strong>{user.full_name}</strong>

                            <span>{user.email}</span>

                            <small>ID #{user.id}</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={getRoleClass(user.role)}>
                          <span className="admin-users-role-dot" />

                          {user.role === "TEAM_LEAD"
                            ? "Team Lead"
                            : user.role === "ADMIN"
                              ? "Admin"
                              : "Employee"}
                        </span>
                      </td>

                      {/* Department Name */}
                      <td>
                        <span className="admin-users-reference">
                          {user.department_id
                            ? getDepartmentName(user.department_id)
                            : "Not assigned"}
                        </span>
                      </td>

                      {/* Team Name */}
                      <td>
                        <span className="admin-users-reference">
                          {user.team_id
                            ? getTeamName(user.team_id)
                            : "Not assigned"}
                        </span>
                      </td>

                      <td>
                        <span className="admin-users-location">
                          <span>⌖</span>

                          {user.location || "-"}
                        </span>
                      </td>

                      <td>
                        {user.work_mode ? (
                          <span className="admin-users-work-mode">
                            {user.work_mode}
                          </span>
                        ) : (
                          <span className="admin-users-muted">-</span>
                        )}
                      </td>

                      <td>
                        <span
                          className={
                            user.is_active
                              ? "admin-users-status admin-users-status-active"
                              : "admin-users-status admin-users-status-inactive"
                          }
                        >
                          <span className="admin-users-status-dot" />

                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td>
                        <div className="admin-users-actions">
                          <button
                            className="admin-users-edit-btn"
                            onClick={() => handleEdit(user)}
                          >
                            Edit
                          </button>

                          <button
                            className={
                              user.is_active
                                ? "admin-users-deactivate-btn"
                                : "admin-users-activate-btn"
                            }
                            onClick={() => handleToggleActive(user)}
                          >
                            {user.is_active ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Pagination */}
        <div className="admin-users-pagination">
          <button onClick={handlePreviousPage} disabled={page === 1}>
            ← Previous
          </button>

          <div className="admin-users-page-indicator">
            <span>Page</span>

            <strong>{page}</strong>

            <span>of</span>

            <strong>{totalPages}</strong>
          </div>

          <button onClick={handleNextPage} disabled={page === totalPages}>
            Next →
          </button>
        </div>

        {/* Confirmation Modal */}
        {showConfirm && userToToggle && (
          <div className="admin-users-modal-overlay">
            <div className="admin-users-modal">
              <div
                className={
                  userToToggle.is_active
                    ? "admin-users-modal-icon admin-users-modal-warning"
                    : "admin-users-modal-icon admin-users-modal-success"
                }
              >
                {userToToggle.is_active ? "!" : "✓"}
              </div>

              <h3>
                {userToToggle.is_active ? "Deactivate User?" : "Activate User?"}
              </h3>

              <p>
                Are you sure you want to{" "}
                {userToToggle.is_active ? "deactivate" : "activate"}{" "}
                <strong>{userToToggle.full_name}</strong>?
              </p>

              <div className="admin-users-modal-actions">
                <button
                  className="admin-users-modal-cancel"
                  onClick={cancelToggle}
                >
                  Cancel
                </button>

                <button
                  className={
                    userToToggle.is_active
                      ? "admin-users-modal-danger"
                      : "admin-users-modal-confirm"
                  }
                  onClick={confirmToggleActive}
                >
                  {userToToggle.is_active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default AdminUsers;
