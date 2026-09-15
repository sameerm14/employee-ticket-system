import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import api from "../../services/api";
import "./CreateTicket.css";

function CreateTicket() {
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    department_id: "",
    project_id: "",
    priority: "MEDIUM",
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================
  // FETCH DEPARTMENTS
  // =========================

  const fetchDepartments = async () => {
    const response = await api.get("/api/departments", {
      params: {
        page: 1,
        page_size: 100,
      },
    });

    setDepartments(response.data.departments || []);
  };

  // =========================
  // FETCH PROJECTS
  // =========================

  const fetchProjects = async () => {
    const response = await api.get("/api/projects", {
      params: {
        page: 1,
        page_size: 100,
      },
    });

    setProjects(response.data.projects || []);
  };

  // =========================
  // LOAD FORM DATA
  // =========================

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        setError("");

        await Promise.all([fetchDepartments(), fetchProjects()]);
      } catch (err) {
        setError(
          err.response?.data?.detail ||
            "Failed to load departments and projects.",
        );
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  // =========================
  // HANDLE INPUT
  // =========================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // =========================
  // CREATE TICKET
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!formData.title.trim()) {
      setError("Ticket title is required.");
      return;
    }

    if (!formData.description.trim()) {
      setError("Ticket description is required.");
      return;
    }

    if (!formData.department_id) {
      setError("Please select a department.");
      return;
    }

    try {
      setLoading(true);

      const ticketData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        department_id: Number(formData.department_id),
        priority: formData.priority,
      };

      if (formData.project_id) {
        ticketData.project_id = Number(formData.project_id);
      }

      const response = await api.post("/api/tickets", ticketData);

      const createdTicket = response.data;

      setSuccess(`Ticket ${createdTicket.ticket_number} created successfully.`);

      setFormData({
        title: "",
        description: "",
        department_id: "",
        project_id: "",
        priority: "MEDIUM",
      });

      setTimeout(() => {
        navigate(`/employee/tickets/${createdTicket.id}`);
      }, 800);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create ticket.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOADING
  // =========================

  if (loadingData) {
    return (
      <Layout>
        <div className="create-ticket-loading">
          <div className="create-ticket-spinner"></div>
          <p>Loading ticket form...</p>
        </div>
      </Layout>
    );
  }

  // =========================
  // PAGE
  // =========================

  return (
    <Layout>
      <div className="create-ticket-page">
        {/* HEADER */}

        <div className="create-ticket-header">
          <div className="create-ticket-header-left">
            <button
              type="button"
              className="create-ticket-back-button"
              onClick={() => navigate("/employee/tickets")}
            >
              <span>←</span>
              Back to My Tickets
            </button>

            <div className="create-ticket-heading">
              <span className="create-ticket-eyebrow">SUPPORT REQUEST</span>

              <h1>Create Ticket</h1>

              <p>
                Submit a support request and provide the details needed to
                resolve your issue.
              </p>
            </div>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="create-ticket-alert create-ticket-alert-error">
            <div className="create-ticket-alert-icon">!</div>

            <div className="create-ticket-alert-content">
              <strong>Unable to create ticket</strong>
              <p>{error}</p>
            </div>

            <button
              type="button"
              className="create-ticket-alert-close"
              onClick={() => setError("")}
            >
              ×
            </button>
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="create-ticket-alert create-ticket-alert-success">
            <div className="create-ticket-alert-icon">✓</div>

            <div className="create-ticket-alert-content">
              <strong>Ticket created successfully</strong>
              <p>{success}</p>
            </div>
          </div>
        )}

        {/* FORM CARD */}

        <div className="create-ticket-card">
          <div className="create-ticket-card-header">
            <div className="create-ticket-card-icon">+</div>

            <div>
              <span className="create-ticket-card-kicker">
                NEW SUPPORT REQUEST
              </span>

              <h2>Ticket Information</h2>

              <p>Fill in the details below to submit your support request.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="create-ticket-form">
            {/* TITLE */}

            <div className="create-ticket-form-group">
              <label htmlFor="title">
                Ticket title
                <span>*</span>
              </label>

              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter a short description of the issue"
                maxLength={255}
                disabled={loading}
                required
              />

              <small>
                Use a clear title that briefly describes the problem.
              </small>
            </div>

            {/* DESCRIPTION */}

            <div className="create-ticket-form-group">
              <label htmlFor="description">
                Description
                <span>*</span>
              </label>

              <textarea
                id="description"
                name="description"
                rows="7"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the issue, what happened, and any useful details..."
                disabled={loading}
                required
              />

              <small>
                Include as much relevant information as possible to help the
                support team understand the issue.
              </small>
            </div>

            {/* DEPARTMENT + PROJECT */}

            <div className="create-ticket-form-row">
              <div className="create-ticket-form-group">
                <label htmlFor="department_id">
                  Department
                  <span>*</span>
                </label>

                <select
                  id="department_id"
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleChange}
                  disabled={loading}
                  required
                >
                  <option value="">Select department</option>

                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>

                <small>
                  Select the department responsible for this request.
                </small>
              </div>

              <div className="create-ticket-form-group">
                <label htmlFor="project_id">Project</label>

                <select
                  id="project_id"
                  name="project_id"
                  value={formData.project_id}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="">No project</option>

                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>

                <small>
                  Select a related project if the ticket belongs to one.
                </small>
              </div>
            </div>

            {/* PRIORITY */}

            <div className="create-ticket-form-group create-ticket-priority-group">
              <label htmlFor="priority">Priority</label>

              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>

              <small>
                Choose the priority that best represents the urgency of the
                issue.
              </small>
            </div>

            {/* ACTIONS */}

            <div className="create-ticket-actions">
              <button
                type="button"
                className="create-ticket-cancel-button"
                onClick={() => navigate("/employee/tickets")}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="create-ticket-submit-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="create-ticket-button-spinner"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <span>+</span>
                    Create Ticket
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* HELPFUL NOTE */}

        <div className="create-ticket-note">
          <div className="create-ticket-note-icon">i</div>

          <div>
            <strong>Before submitting</strong>
            <p>
              Make sure the department, project, priority, and description are
              correct. You can track the ticket and its workflow status after
              submission.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default CreateTicket;
