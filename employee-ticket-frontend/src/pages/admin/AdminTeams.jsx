import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../services/api";
import "./AdminTeams.css";

function AdminTeams() {
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [isActive, setIsActive] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalPages, setTotalPages] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [teamToToggle, setTeamToToggle] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    department_id: "",
    is_active: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTeams();
  }, [page, departmentId, isActive]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchTeams = async () => {
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

      if (departmentId) {
        params.department_id = Number(departmentId);
      }

      if (isActive !== "") {
        params.is_active = isActive;
      }

      const response = await api.get("/api/teams", { params });

      setTeams(response.data.teams || []);
      setTotalPages(response.data.total_pages || 1);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load teams.");
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
          is_active: true,
        },
      });

      setDepartments(response.data.departments || []);
    } catch (err) {
      console.error("Failed to load departments.", err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTeams();
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      department_id: "",
      is_active: true,
    });

    setEditingTeam(null);
    setShowForm(false);
  };

  const handleCreate = () => {
    setEditingTeam(null);

    setForm({
      name: "",
      description: "",
      department_id: "",
      is_active: true,
    });

    setError("");
    setShowForm(true);
  };

  const handleEdit = (team) => {
    setEditingTeam(team);

    setForm({
      name: team.name || "",
      description: team.description || "",
      department_id: team.department_id || "",
      is_active: team.is_active,
    });

    setError("");
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.department_id) {
      setError("Please select a department.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const data = {
        name: form.name,
        description: form.description || null,
        department_id: Number(form.department_id),
        is_active: form.is_active,
      };

      if (editingTeam) {
        await api.put(`/api/teams/${editingTeam.id}`, data);
      } else {
        await api.post("/api/teams", data);
      }

      resetForm();
      await fetchTeams();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save team.");
    } finally {
      setSaving(false);
    }
  };

  const openToggleModal = (team) => {
    setTeamToToggle(team);
    setShowToggleModal(true);
    setError("");
  };

  const closeToggleModal = () => {
    setShowToggleModal(false);
    setTeamToToggle(null);
  };

  const handleToggleActive = async () => {
    if (!teamToToggle) return;

    const action = teamToToggle.is_active ? "deactivate" : "activate";

    try {
      setError("");

      await api.put(`/api/teams/${teamToToggle.id}`, {
        is_active: !teamToToggle.is_active,
      });

      closeToggleModal();
      await fetchTeams();
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to ${action} team.`);

      closeToggleModal();
    }
  };

  const getDepartmentName = (id) => {
    const department = departments.find((item) => item.id === id);

    return department ? department.name : `Department #${id}`;
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

  return (
    <Layout>
      <div className="admin-teams-page">
        {/* Header */}
        <div className="admin-teams-header">
          <div>
            <div className="admin-teams-eyebrow">ADMIN CONTROL CENTER</div>

            <h1>Team Management</h1>

            <p>
              Organize teams, departments, and team availability from one place.
            </p>
          </div>

          <button className="admin-teams-create-btn" onClick={handleCreate}>
            <span>＋</span>
            Create Team
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="admin-teams-error">
            <div className="admin-teams-error-icon">!</div>

            <div>
              <strong>Action could not be completed</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <section className="admin-teams-filter-panel">
          <div className="admin-teams-panel-header">
            <div>
              <span>TEAM DIRECTORY</span>
              <h2>Search & Filters</h2>
            </div>

            {(search || departmentId || isActive !== "") && (
              <button
                className="admin-teams-clear-btn"
                onClick={() => {
                  setSearch("");
                  setDepartmentId("");
                  setIsActive("");
                  setPage(1);
                }}
              >
                Clear Filters
              </button>
            )}
          </div>

          <form onSubmit={handleSearch}>
            <div className="admin-teams-filter-grid">
              <div className="admin-teams-field">
                <label>Search Team</label>

                <div className="admin-teams-input-wrap">
                  <span>⌕</span>

                  <input
                    type="text"
                    placeholder="Search by team name"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-teams-field">
                <label>Department</label>

                <select
                  value={departmentId}
                  onChange={(e) => {
                    setDepartmentId(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Departments</option>

                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-teams-field">
                <label>Status</label>

                <select
                  value={isActive}
                  onChange={(e) => {
                    setIsActive(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Teams</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <button type="submit" className="admin-teams-search-btn">
                Search Teams
              </button>
            </div>
          </form>
        </section>

        {/* Create / Edit Form */}
        {showForm && (
          <section className="admin-teams-form-panel">
            <div className="admin-teams-panel-header">
              <div>
                <span>{editingTeam ? "TEAM CONFIGURATION" : "NEW TEAM"}</span>

                <h2>{editingTeam ? "Edit Team" : "Create Team"}</h2>
              </div>

              <button
                type="button"
                className="admin-teams-close-btn"
                onClick={resetForm}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-teams-form-grid">
                <div className="admin-teams-field">
                  <label>Team Name *</label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter team name"
                    required
                  />
                </div>

                <div className="admin-teams-field">
                  <label>Department *</label>

                  <select
                    name="department_id"
                    value={form.department_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Department</option>

                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-teams-field admin-teams-description-field">
                  <label>Description</label>

                  <input
                    type="text"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Enter team description"
                  />
                </div>

                <label className="admin-teams-checkbox">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleChange}
                  />

                  <span className="admin-teams-checkbox-box">✓</span>

                  <span>
                    <strong>Active Team</strong>
                    <small>Team is currently available for assignment</small>
                  </span>
                </label>
              </div>

              <div className="admin-teams-form-actions">
                <button
                  type="submit"
                  className="admin-teams-save-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingTeam
                      ? "Update Team"
                      : "Create Team"}
                </button>

                <button
                  type="button"
                  className="admin-teams-cancel-btn"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Teams Table */}
        <section className="admin-teams-table-panel">
          <div className="admin-teams-table-header">
            <div>
              <span>TEAM PORTFOLIO</span>
              <h2>Teams</h2>
            </div>

            <div className="admin-teams-count">{teams.length} teams shown</div>
          </div>

          {loading ? (
            <div className="admin-teams-loading">
              <div className="admin-teams-spinner"></div>

              <strong>Loading teams</strong>

              <span>Fetching team information...</span>
            </div>
          ) : teams.length === 0 ? (
            <div className="admin-teams-empty">
              <div className="admin-teams-empty-icon">◇</div>

              <h3>No teams found</h3>

              <p>No teams match the selected filters.</p>

              <button className="admin-teams-empty-btn" onClick={handleCreate}>
                Create Team
              </button>
            </div>
          ) : (
            <div className="admin-teams-table-scroll">
              <table className="admin-teams-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>TEAM</th>
                    <th>DEPARTMENT</th>
                    <th>DESCRIPTION</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {teams.map((team) => (
                    <tr key={team.id}>
                      <td>
                        <span className="admin-teams-id">#{team.id}</span>
                      </td>

                      <td>
                        <div className="admin-teams-name">
                          <div className="admin-teams-team-icon">
                            {team.name?.charAt(0)?.toUpperCase()}
                          </div>

                          <div>
                            <strong>{team.name}</strong>

                            <small>Team #{team.id}</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="admin-teams-department">
                          {team.department_id
                            ? getDepartmentName(team.department_id)
                            : "-"}
                        </span>
                      </td>

                      <td>
                        <span className="admin-teams-description">
                          {team.description || "No description"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            team.is_active
                              ? "admin-teams-active"
                              : "admin-teams-inactive"
                          }
                        >
                          <i></i>
                          {team.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td>
                        <div className="admin-teams-actions">
                          <button
                            className="admin-teams-edit-btn"
                            onClick={() => handleEdit(team)}
                          >
                            Edit
                          </button>

                          <button
                            className={
                              team.is_active
                                ? "admin-teams-deactivate-btn"
                                : "admin-teams-activate-btn"
                            }
                            onClick={() => openToggleModal(team)}
                          >
                            {team.is_active ? "Deactivate" : "Activate"}
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
        <div className="admin-teams-pagination">
          <button onClick={handlePreviousPage} disabled={page === 1}>
            ← Previous
          </button>

          <div className="admin-teams-page-number">
            <span>PAGE</span>
            <strong>{page}</strong>
            <span>OF</span>
            <strong>{totalPages}</strong>
          </div>

          <button onClick={handleNextPage} disabled={page === totalPages}>
            Next →
          </button>
        </div>

        {/* Activate / Deactivate Modal */}
        {showToggleModal && teamToToggle && (
          <div className="admin-teams-modal-overlay" onClick={closeToggleModal}>
            <div
              className="admin-teams-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="admin-teams-modal-icon">
                {teamToToggle.is_active ? "!" : "✓"}
              </div>

              <h2>
                {teamToToggle.is_active ? "Deactivate Team?" : "Activate Team?"}
              </h2>

              <p>
                Are you sure you want to{" "}
                {teamToToggle.is_active ? "deactivate" : "activate"}{" "}
                <strong>{teamToToggle.name}</strong>?
              </p>

              <div className="admin-teams-modal-actions">
                <button
                  className="admin-teams-modal-cancel"
                  onClick={closeToggleModal}
                >
                  Cancel
                </button>

                <button
                  className={
                    teamToToggle.is_active
                      ? "admin-teams-modal-danger"
                      : "admin-teams-modal-confirm"
                  }
                  onClick={handleToggleActive}
                >
                  {teamToToggle.is_active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default AdminTeams;
