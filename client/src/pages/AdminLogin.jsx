import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Logo from "../components/Logo.jsx";
import { AuthBackdrop } from "../components/PageHero.jsx";
import { api } from "../api.js";
import { useApp } from "../context.jsx";
import { useTitle } from "../hooks.js";

export default function AdminLogin() {
  useTitle("Staff & Admin Sign In");
  const { user, setUser, logout } = useApp();
  const nav = useNavigate();
  const [f, setF] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // If already logged in as admin, go to admin dashboard
  if (user && user.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const { user: authedUser } = await api.post("/api/auth/admin-login", f);
      setUser(authedUser);
      nav("/admin", { replace: true });
    } catch (x) {
      setErr(x.message || "Authentication failed. Please verify credentials.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-login-wrap">
      <AuthBackdrop />
      <div className="admin-login-box card">
        <div className="admin-login-badge">
          <span>ADMINISTRATION PORTAL</span>
        </div>

        <div className="admin-login-brand">
          <Logo size={48} light />
          <h2>Shyfunmi Nails</h2>
          <p className="muted">Administrative access & management system</p>
        </div>

        {user && user.role === "client" ? (
          <div className="admin-login-alert">
            <p>
              You are currently signed in client <strong>{user.name}</strong> (
              {user.email}).
            </p>
            <p className="muted" style={{ fontSize: "0.85rem" }}>
              This portal is strictly for salon management and staff.
            </p>
            <div className="cta-row center" style={{ marginTop: 14 }}>
              <button className="btn sm danger" onClick={logout}>
                Sign out of client account
              </button>
              <Link className="btn ghost sm" to="/account">
                Go to my client account
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="form" noValidate>
            <div className="field">
              <label htmlFor="admin-email">Administrator Email</label>
              <input
                id="admin-email"
                type="email"
                placeholder="shyfunmiinails@gmail.com"
                value={f.email}
                onChange={set("email")}
                autoComplete="email"
                required
              />
            </div>

            <div className="field">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <label htmlFor="admin-password">Master Password</label>
                <button
                  type="button"
                  className="linklike"
                  style={{ fontSize: "0.8rem", color: "var(--mute)" }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide password" : "Show password"}
                </button>
              </div>
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter admin password"
                value={f.password}
                onChange={set("password")}
                autoComplete="current-password"
                required
              />
            </div>

            {err && (
              <div className="admin-err-banner" role="alert">
                <span>⚠️</span> {err}
              </div>
            )}

            <button className="btn admin-submit-btn" disabled={busy}>
              {busy ? "Authenticating…" : "Access Admin Dashboard"}
            </button>
          </form>
        )}

        <div className="admin-login-footer">
          <p className="muted">
            Restricted area. All access is logged and protected.
          </p>
          <div className="admin-nav-links">
            <Link to="/">← Back to salon website</Link>
            <span className="dot-sep">·</span>

            <Link to="/login">Client sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
