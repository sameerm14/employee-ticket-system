import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../services/api";
import "./AdminProjects.css";

function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalPages, setTotalPages] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [projectToToggle, setProjectToToggle] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    department_id: "",
    priority: "MEDIUM",
    status: "ACTIVE",
    is_active: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProjects();
  }, [page, departmentId, priority, status]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchProjects = async () => {
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

      if (priority) {
        params.priority = priority;
      }

      if (status) {
        params.status = status;
      }

      const response = await api.get("/api/projects", {
        params,
      });

      setProjects(response.data.projects || []);
      setTotalPages(response.data.total_pages || 1);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load projects.");
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
    fetchProjects();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      department_id: "",
      priority: "MEDIUM",
      status: "ACTIVE",
      is_active: true,
    });

    setEditingProject(null);
    setShowForm(false);
  };

  const handleCreate = () => {
    setEditingProject(null);

    setForm({
      name: "",
      description: "",
      department_id: "",
      priority: "MEDIUM",
      status: "ACTIVE",
      is_active: true,
    });

    setShowForm(true);
    setError("");
  };

  const handleEdit = (project) => {
    setEditingProject(project);

    setForm({
      name: project.name || "",
      description: project.description || "",
      department_id: project.department_id || "",
      priority: project.priority || "MEDIUM",
      status: project.status || "ACTIVE",
      is_active: project.is_active,
    });

    setShowForm(true);
    setError("");
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
        priority: form.priority,
        status: form.status,
        is_active: form.is_active,
      };

      if (editingProject) {
        await api.put(`/api/projects/${editingProject.id}`, data);
      } else {
        await api.post("/api/projects", data);
      }

      resetForm();
      await fetchProjects();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save project.");
    } finally {
      setSaving(false);
    }
  };

  const openToggleModal = (project) => {
    setProjectToToggle(project);
    setShowToggleModal(true);
    setError("");
  };

  const closeToggleModal = () => {
    setShowToggleModal(false);
    setProjectToToggle(null);
  };

  const handleToggleActive = async () => {
    if (!projectToToggle) return;

    const action = projectToToggle.is_active ? "deactivate" : "activate";

    try {
      setError("");

      await api.put(`/api/projects/${projectToToggle.id}`, {
        is_active: !projectToToggle.is_active,
      });

      closeToggleModal();
      await fetchProjects();
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to ${action} project.`);

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

  const getPriorityClass = (value) => {
    return `admin-projects-priority-${value
      ?.toLowerCase()
      .replaceAll("_", "-")}`;
  };

  const getStatusClass = (value) => {
    return `admin-projects-status-${value?.toLowerCase().replaceAll("_", "-")}`;
  };

  return (
    <Layout>
      <div className="admin-projects-page">
        {/* Header */}
        <div className="admin-projects-header">
          <div>
            <div className="admin-projects-eyebrow">ADMIN CONTROL CENTER</div>

            <h1>Project Management</h1>

            <p>Create, organize, and manage projects across departments.</p>
          </div>

          <button className="admin-projects-create-btn" onClick={handleCreate}>
            <span>＋</span>
            Create Project
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="admin-projects-error">
            <div className="admin-projects-error-icon">!</div>

            <div>
              <strong>Action could not be completed</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <section className="admin-projects-filter-panel">
          <div className="admin-projects-panel-header">
            <div>
              <span>PROJECT DIRECTORY</span>
              <h2>Search & Filters</h2>
            </div>

            {(search || departmentId || priority || status) && (
              <button
                className="admin-projects-clear-btn"
                onClick={() => {
                  setSearch("");
                  setDepartmentId("");
                  setPriority("");
                  setStatus("");
                  setPage(1);
                }}
              >
                Clear Filters
              </button>
            )}
          </div>

          <form onSubmit={handleSearch}>
            <div className="admin-projects-filter-grid">
              <div className="admin-projects-field">
                <label>Search Project</label>

                <div className="admin-projects-input-wrap">
                  <span>⌕</span>

                  <input
                    type="text"
                    placeholder="Search by project name"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-projects-field">
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

              <div className="admin-projects-field">
                <label>Priority</label>

                <select
                  value={priority}
                  onChange={(e) => {
                    setPriority(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div className="admin-projects-field">
                <label>Status</label>

                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ON_HOLD">On Hold</option>
                </select>
              </div>

              <button type="submit" className="admin-projects-search-btn">
                Search Projects
              </button>
            </div>
          </form>
        </section>

        {/* Create / Edit */}
        {showForm && (
          <section className="admin-projects-form-panel">
            <div className="admin-projects-panel-header">
              <div>
                <span>
                  {editingProject ? "PROJECT CONFIGURATION" : "NEW PROJECT"}
                </span>

                <h2>{editingProject ? "Edit Project" : "Create Project"}</h2>
              </div>

              <button
                className="admin-projects-close-btn"
                onClick={resetForm}
                type="button"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-projects-form-grid">
                <div className="admin-projects-field">
                  <label>Project Name *</label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter project name"
                    required
                  />
                </div>

                <div className="admin-projects-field">
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

                <div className="admin-projects-field">
                  <label>Priority</label>

                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div className="admin-projects-field">
                  <label>Status</label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ON_HOLD">On Hold</option>
                  </select>
                </div>

                <div className="admin-projects-field admin-projects-description-field">
                  <label>Description</label>

                  <input
                    type="text"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Enter project description"
                  />
                </div>

                <label className="admin-projects-checkbox">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleChange}
                  />

                  <span className="admin-projects-checkbox-box">✓</span>

                  <span>
                    <strong>Active Project</strong>
                    <small>Project is currently available for use</small>
                  </span>
                </label>
              </div>

              <div className="admin-projects-form-actions">
                <button
                  type="submit"
                  className="admin-projects-save-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingProject
                      ? "Update Project"
                      : "Create Project"}
                </button>

                <button
                  type="button"
                  className="admin-projects-cancel-btn"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Projects */}
        <section className="admin-projects-table-panel">
          <div className="admin-projects-table-header">
            <div>
              <span>PROJECT PORTFOLIO</span>
              <h2>Projects</h2>
            </div>

            <div className="admin-projects-count">
              {projects.length} projects shown
            </div>
          </div>

          {loading ? (
            <div className="admin-projects-loading">
              <div className="admin-projects-spinner"></div>
              <strong>Loading projects</strong>
              <span>Fetching project information...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="admin-projects-empty">
              <div className="admin-projects-empty-icon">◇</div>

              <h3>No projects found</h3>

              <p>No projects match the selected filters.</p>

              <button
                onClick={handleCreate}
                className="admin-projects-empty-btn"
              >
                Create Project
              </button>
            </div>
          ) : (
            <div className="admin-projects-table-scroll">
              <table className="admin-projects-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>PROJECT</th>
                    <th>DEPARTMENT</th>
                    <th>PRIORITY</th>
                    <th>STATUS</th>
                    <th>ACTIVE</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id}>
                      <td>
                        <span className="admin-projects-id">#{project.id}</span>
                      </td>

                      <td>
                        <div className="admin-projects-name">
                          <div className="admin-projects-project-icon">
                            {project.name?.charAt(0)?.toUpperCase()}
                          </div>

                          <div>
                            <strong>{project.name}</strong>

                            {project.description && (
                              <small>{project.description}</small>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="admin-projects-department">
                          {getDepartmentName(project.department_id)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`admin-projects-badge ${getPriorityClass(
                            project.priority,
                          )}`}
                        >
                          {project.priority}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`admin-projects-badge ${getStatusClass(
                            project.status,
                          )}`}
                        >
                          {project.status?.replaceAll("_", " ")}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            project.is_active
                              ? "admin-projects-active"
                              : "admin-projects-inactive"
                          }
                        >
                          <i></i>
                          {project.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td>
                        <div className="admin-projects-actions">
                          <button
                            className="admin-projects-edit-btn"
                            onClick={() => handleEdit(project)}
                          >
                            Edit
                          </button>

                          <button
                            className={
                              project.is_active
                                ? "admin-projects-deactivate-btn"
                                : "admin-projects-activate-btn"
                            }
                            onClick={() => openToggleModal(project)}
                          >
                            {project.is_active ? "Deactivate" : "Activate"}
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
        <div className="admin-projects-pagination">
          <button onClick={handlePreviousPage} disabled={page === 1}>
            ← Previous
          </button>

          <div className="admin-projects-page-number">
            <span>PAGE</span>
            <strong>{page}</strong>
            <span>OF</span>
            <strong>{totalPages}</strong>
          </div>

          <button onClick={handleNextPage} disabled={page === totalPages}>
            Next →
          </button>
        </div>

        {/* Toggle Modal */}
        {showToggleModal && projectToToggle && (
          <div
            className="admin-projects-modal-overlay"
            onClick={closeToggleModal}
          >
            <div
              className="admin-projects-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="admin-projects-modal-icon">
                {projectToToggle.is_active ? "!" : "✓"}
              </div>

              <h2>
                {projectToToggle.is_active
                  ? "Deactivate Project?"
                  : "Activate Project?"}
              </h2>

              <p>
                Are you sure you want to{" "}
                {projectToToggle.is_active ? "deactivate" : "activate"}{" "}
                <strong>{projectToToggle.name}</strong>?
              </p>

              <div className="admin-projects-modal-actions">
                <button
                  className="admin-projects-modal-cancel"
                  onClick={closeToggleModal}
                >
                  Cancel
                </button>

                <button
                  className={
                    projectToToggle.is_active
                      ? "admin-projects-modal-danger"
                      : "admin-projects-modal-confirm"
                  }
                  onClick={handleToggleActive}
                >
                  {projectToToggle.is_active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default AdminProjects;
