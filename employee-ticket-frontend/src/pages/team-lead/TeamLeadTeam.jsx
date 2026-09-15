import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../services/api";
import "./TeamLeadTeam.css";

function TeamLeadTeam() {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/assignments/team-lead/workload");

      setTeam(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to load team information.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="team-lead-team-state">
          <div className="team-lead-team-spinner"></div>
          <h3>Loading team</h3>
          <p>Fetching your team members and workload...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="team-lead-team-error">
          <div className="team-lead-team-error-icon">!</div>

          <div className="team-lead-team-error-content">
            <strong>Unable to load team</strong>
            <p>{error}</p>
          </div>

          <button
            type="button"
            className="team-lead-team-retry"
            onClick={fetchTeam}
          >
            Try again
          </button>
        </div>
      </Layout>
    );
  }

  if (!team) {
    return (
      <Layout>
        <div className="team-lead-team-state">
          <div className="team-lead-team-empty-icon">?</div>
          <h3>Team information not found</h3>
          <p>There is no team information available.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="team-lead-team-page">
        {/* Header */}
        <div className="team-lead-team-header">
          <div>
            <span className="team-lead-team-eyebrow">TEAM OPERATIONS</span>

            <h1>My Team</h1>

            <p>
              View your team members and monitor their current ticket workload.
            </p>
          </div>

          <button
            type="button"
            className="team-lead-refresh-btn"
            onClick={fetchTeam}
          >
            <span>↻</span>
            Refresh
          </button>
        </div>

        {/* Team Summary */}
        <section className="team-lead-team-section">
          <div className="team-lead-team-section-heading">
            <span>TEAM OVERVIEW</span>
            <h2>Workload summary</h2>
          </div>

          <div className="team-lead-team-stats">
            <div className="team-lead-team-stat team-card-blue">
              <div className="team-lead-team-stat-top">
                <span>Team</span>
                <div className="team-lead-team-stat-icon">◆</div>
              </div>

              <strong>{team.team_id}</strong>

              <p>Assigned team ID</p>
            </div>

            <div className="team-lead-team-stat team-card-purple">
              <div className="team-lead-team-stat-top">
                <span>Total Members</span>
                <div className="team-lead-team-stat-icon">◉</div>
              </div>

              <strong>{team.total_members}</strong>

              <p>Active team members</p>
            </div>

            <div className="team-lead-team-stat team-card-orange">
              <div className="team-lead-team-stat-top">
                <span>Assigned Tickets</span>
                <div className="team-lead-team-stat-icon">#</div>
              </div>

              <strong>{team.assigned_tickets}</strong>

              <p>Currently assigned tickets</p>
            </div>
          </div>
        </section>

        {/* Team Members */}
        <section className="team-lead-members-panel">
          <div className="team-lead-members-header">
            <div>
              <span>TEAM MEMBERS</span>
              <h2>Member workload</h2>
            </div>

            <div className="team-lead-member-count">
              {team.total_members} members
            </div>
          </div>

          {team.members.length === 0 ? (
            <div className="team-lead-members-empty">
              <div className="team-lead-members-empty-icon">✓</div>

              <h3>No active team members</h3>

              <p>There are currently no active members in your team.</p>
            </div>
          ) : (
            <div className="team-lead-members-list">
              {team.members.map((member, index) => (
                <div className="team-lead-member-row" key={member.user_id}>
                  <div className="team-lead-member-number">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="team-lead-member-avatar">
                    {member.user_name?.charAt(0).toUpperCase()}
                  </div>

                  <div className="team-lead-member-info">
                    <strong>{member.user_name}</strong>
                    <span>User ID: {member.user_id}</span>
                  </div>

                  <div className="team-lead-member-workload">
                    <span>Active tickets</span>

                    <strong>{member.active_tickets}</strong>
                  </div>

                  <div className="team-lead-workload-indicator">
                    {member.active_tickets === 0 ? (
                      <span className="workload-free">Available</span>
                    ) : member.active_tickets <= 3 ? (
                      <span className="workload-normal">Normal</span>
                    ) : (
                      <span className="workload-high">High workload</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

export default TeamLeadTeam;
