import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const data = await login(email, password);

      const payload = JSON.parse(atob(data.access_token.split(".")[1]));

      if (payload.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else if (payload.role === "TEAM_LEAD") {
        navigate("/team-lead/dashboard");
      } else {
        navigate("/employee/dashboard");
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to sign in. Please check your email and password.",
      );
    }
  };

  return (
    <div className="login-page">
      <div className="login-background-shape login-shape-one"></div>
      <div className="login-background-shape login-shape-two"></div>

      <main className="login-container">
        <section className="login-card">
          {/* Brand */}
          <div className="login-brand">
            <div className="login-logo">TF</div>

            <div>
              <h1>TicketFlow</h1>
              <p>Employee Support Management</p>
            </div>
          </div>

          {/* Heading */}
          <div className="login-heading">
            <h2>Welcome back</h2>
            <p>Sign in to manage your tickets and support requests.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="login-error" role="alert">
              <div className="login-error-icon">!</div>

              <div className="login-error-content">
                <strong>Sign in failed</strong>
                <span>{error}</span>
              </div>

              <button
                type="button"
                className="login-error-close"
                onClick={() => setError("")}
                aria-label="Close error"
              >
                ×
              </button>
            </div>
          )}

          {/* Form */}
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="email">Email address</label>

              <div className="login-input-wrapper">
                <span className="login-input-icon" aria-hidden="true">
                  @
                </span>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password">Password</label>

              <div className="login-input-wrapper">
                <span className="login-input-icon" aria-hidden="true">
                  •
                </span>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? (
                <>
                  <span className="login-spinner"></span>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <span className="login-button-arrow">→</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="login-footer">
            <div className="login-footer-line"></div>

            <p>Need an account?</p>

            <span>Contact your administrator to get access.</span>
          </div>
        </section>

        <p className="login-copyright">
          © {new Date().getFullYear()} TicketFlow. All rights reserved.
        </p>
      </main>
    </div>
  );
}

export default Login;
