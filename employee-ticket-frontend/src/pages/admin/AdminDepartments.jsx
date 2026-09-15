import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../services/api";
import "./AdminDepartments.css";

function AdminDepartments() {
  const [departments, setDepartments] = useState([]);

  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalPages, setTotalPages] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    is_active: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, [page, isActive]);

  const fetchDepartments = async () => {
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

      if (isActive !== "") {
        params.is_active = isActive;
      }

      const response = await api.get("/api/departments", {
        params,
      });

      setDepartments(response.data.departments || []);
      setTotalPages(response.data.total_pages || 1);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load departments.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchDepartments();
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      is_active: true,
    });

    setEditingDepartment(null);
    setShowForm(false);
  };

  const handleCreate = () => {
    setEditingDepartment(null);

    setForm({
      name: "",
      description: "",
      is_active: true,
    });

    setShowForm(true);
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);

    setForm({
      name: department.name || "",
      description: department.description || "",
      is_active: department.is_active,
    });

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

    try {
      setSaving(true);
      setError("");

      const data = {
        name: form.name,
        description: form.description || null,
        is_active: form.is_active,
      };

      if (editingDepartment) {
        await api.put(`/api/departments/${editingDepartment.id}`, data);
      } else {
        await api.post("/api/departments", data);
      }

      resetForm();
      await fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save department.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = (department) => {
    const action = department.is_active ? "deactivate" : "activate";

    setConfirmAction({
      department,
      action,
    });
  };

  const confirmToggleActive = async () => {
    if (!confirmAction) {
      return;
    }

    const { department, action } = confirmAction;

    try {
      setError("");
      setConfirmAction(null);

      await api.put(`/api/departments/${department.id}`, {
        is_active: !department.is_active,
      });

      await fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to ${action} department.`);
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

  const activeCount = departments.filter(
    (department) => department.is_active,
  ).length;

  const inactiveCount = departments.filter(
    (department) => !department.is_active,
  ).length;

  return (
    <Layout>
      <div className="admin-departments-page">
        {/* Header */}
        <div className="admin-departments-header">
          <div>
            <span className="admin-departments-eyebrow">
              ORGANIZATION CONTROL
            </span>

            <h1 className="admin-departments-title">Department Management</h1>

            <p className="admin-departments-subtitle">
              Create, organize, and control company departments.
            </p>
          </div>

          <button
            className="admin-departments-create-btn"
            onClick={handleCreate}
          >
            <span className="admin-departments-btn-icon">+</span>
            Create Department
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="admin-departments-error">
            <div className="admin-departments-error-icon">!</div>

            <div>
              <strong>Something went wrong</strong>
              <p>{error}</p>
            </div>

            <button
              onClick={() => setError("")}
              className="admin-departments-error-close"
            >
              ×
            </button>
          </div>
        )}

        {/* Summary */}
        <div className="admin-departments-summary">
          <div className="admin-department-summary-card total">
            <div className="admin-department-summary-icon">▦</div>

            <div>
              <span>Total Departments</span>
              <strong>{departments.length}</strong>
            </div>
          </div>

          <div className="admin-department-summary-card active">
            <div className="admin-department-summary-icon">✓</div>

            <div>
              <span>Active</span>
              <strong>{activeCount}</strong>
            </div>
          </div>

          <div className="admin-department-summary-card inactive">
            <div className="admin-department-summary-icon">○</div>

            <div>
              <span>Inactive</span>
              <strong>{inactiveCount}</strong>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="admin-departments-panel">
          <div className="admin-departments-panel-header">
            <div>
              <span className="admin-departments-panel-kicker">DIRECTORY</span>

              <h2>Search & Filters</h2>
            </div>
          </div>

          <form onSubmit={handleSearch} className="admin-departments-filters">
            <div className="admin-departments-form-group">
              <label>Department Name</label>

              <input
                type="text"
                className="admin-departments-input"
                placeholder="Search department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="admin-departments-form-group">
              <label>Status</label>

              <select
                className="admin-departments-input"
                value={isActive}
                onChange={(e) => {
                  setIsActive(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All departments</option>
                <option value="true">Active only</option>
                <option value="false">Inactive only</option>
              </select>
            </div>

            <div className="admin-departments-filter-action">
              <button type="submit" className="admin-departments-search-btn">
                Search Departments
              </button>
            </div>
          </form>
        </div>

        {/* Create / Edit */}
        {showForm && (
          <div className="admin-departments-panel admin-departments-form-panel">
            <div className="admin-departments-panel-header">
              <div>
                <span className="admin-departments-panel-kicker">
                  {editingDepartment ? "UPDATE RECORD" : "NEW RECORD"}
                </span>

                <h2>
                  {editingDepartment ? "Edit Department" : "Create Department"}
                </h2>
              </div>

              <button
                className="admin-departments-close-btn"
                onClick={resetForm}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-departments-form-grid">
                <div className="admin-departments-form-group">
                  <label>
                    Department Name <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="name"
                    className="admin-departments-input"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter department name"
                    required
                  />
                </div>

                <div className="admin-departments-form-group">
                  <label>Description</label>

                  <input
                    type="text"
                    name="description"
                    className="admin-departments-input"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Department description"
                  />
                </div>
              </div>

              <label className="admin-departments-checkbox">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                />

                <span className="admin-departments-checkbox-box">✓</span>

                <span>
                  <strong>Active Department</strong>
                  <small>Department is available for company operations.</small>
                </span>
              </label>

              <div className="admin-departments-form-actions">
                <button
                  type="submit"
                  className="admin-departments-save-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingDepartment
                      ? "Update Department"
                      : "Create Department"}
                </button>

                <button
                  type="button"
                  className="admin-departments-cancel-btn"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Departments */}
        <div className="admin-departments-panel">
          <div className="admin-departments-panel-header">
            <div>
              <span className="admin-departments-panel-kicker">
                DEPARTMENT DIRECTORY
              </span>

              <h2>Departments</h2>
            </div>

            {!loading && (
              <span className="admin-departments-count">
                {departments.length} shown
              </span>
            )}
          </div>

          {loading ? (
            <div className="admin-departments-loading">
              <div className="admin-departments-spinner"></div>
              <span>Loading departments...</span>
            </div>
          ) : departments.length === 0 ? (
            <div className="admin-departments-empty">
              <div className="admin-departments-empty-icon">▦</div>

              <h3>No departments found</h3>

              <p>No departments match the current search or filters.</p>

              <button
                className="admin-departments-create-btn small"
                onClick={handleCreate}
              >
                + Create Department
              </button>
            </div>
          ) : (
            <div className="admin-departments-table-wrapper">
              <table className="admin-departments-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Department</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {departments.map((department) => (
                    <tr key={department.id}>
                      <td>
                        <span className="admin-department-id">
                          #{department.id}
                        </span>
                      </td>

                      <td>
                        <div className="admin-department-name-cell">
                          <div className="admin-department-avatar">
                            {department.name?.charAt(0)?.toUpperCase()}
                          </div>

                          <div>
                            <strong>{department.name}</strong>
                            <small>Company department</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="admin-department-description">
                          {department.description || "No description provided"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            department.is_active
                              ? "admin-department-status active"
                              : "admin-department-status inactive"
                          }
                        >
                          <span></span>

                          {department.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td>
                        <div className="admin-department-actions">
                          <button
                            className="admin-department-edit-btn"
                            onClick={() => handleEdit(department)}
                          >
                            Edit
                          </button>

                          <button
                            className={
                              department.is_active
                                ? "admin-department-toggle-btn deactivate"
                                : "admin-department-toggle-btn activate"
                            }
                            onClick={() => handleToggleActive(department)}
                          >
                            {department.is_active ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="admin-departments-pagination">
          <button
            className="admin-departments-page-btn"
            onClick={handlePreviousPage}
            disabled={page === 1}
          >
            ← Previous
          </button>

          <div className="admin-departments-page-info">
            <span>Page</span>
            <strong>{page}</strong>
            <span>of</span>
            <strong>{totalPages}</strong>
          </div>

          <button
            className="admin-departments-page-btn"
            onClick={handleNextPage}
            disabled={page === totalPages}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div
          className="admin-departments-modal-overlay"
          onClick={() => setConfirmAction(null)}
        >
          <div
            className="admin-departments-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-departments-confirm-icon">!</div>

            <span className="admin-departments-modal-kicker">
              CONFIRM ACTION
            </span>

            <h2>
              {confirmAction.action === "deactivate"
                ? "Deactivate Department?"
                : "Activate Department?"}
            </h2>

            <p>
              Are you sure you want to <strong>{confirmAction.action}</strong>{" "}
              <strong>{confirmAction.department.name}</strong>?
            </p>

            <div className="admin-departments-modal-actions">
              <button
                className="admin-departments-modal-cancel"
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </button>

              <button
                className={
                  confirmAction.action === "deactivate"
                    ? "admin-departments-modal-danger"
                    : "admin-departments-modal-success"
                }
                onClick={confirmToggleActive}
              >
                {confirmAction.action === "deactivate"
                  ? "Deactivate"
                  : "Activate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default AdminDepartments;
