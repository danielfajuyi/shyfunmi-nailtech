import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Page from "../components/Page.jsx";
import { api } from "../api.js";
import { useApp } from "../context.jsx";
import { useTitle } from "../hooks.js";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.6 39.6 16.3 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.8-6.6 7.3l6.3 5.2C37.9 38.3 44 33 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}

export default function Auth({ mode }) {
  const register = mode === "register";
  useTitle(register ? "Create account" : "Sign in");
  const { setUser, site } = useApp();
  const nav = useNavigate();
  const [q] = useSearchParams();
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "" });
  const [err, setErr] = useState(q.get("error") || "");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const next = q.get("next") || "";
  const google = site?.auth?.google;

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const { user } = await api.post(
        `/api/auth/${register ? "register" : "login"}`,
        f,
      );
      setUser(user);
      nav(next || (user.role === "admin" ? "/admin" : "/account"), {
        replace: true,
      });
    } catch (x) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  };

  const googleStart = () => {
    window.location.href = `/api/auth/google?next=${encodeURIComponent(next || "/account")}`;
  };

  return (
    <Page className="container section page-top">
      <div className="auth card">
        <h1 className="h1s sm">
          {register ? "Create your account" : "Welcome back"}
        </h1>
        <p className="muted">
          {register
            ? "Track bookings, see loyalty rewards and rebook in seconds."
            : "Sign in to manage your appointments."}
        </p>
        {google && (
          <>
            <button
              type="button"
              className="btn ghost google-btn"
              onClick={googleStart}
            >
              <GoogleIcon /> Continue with Google
            </button>
            <p className="auth-or">or continue with email</p>
          </>
        )}
        <form onSubmit={submit} className="form" noValidate>
          {register && (
            <div className="field">
              <label htmlFor="n">Full name</label>
              <input
                id="n"
                value={f.name}
                onChange={set("name")}
                autoComplete="name"
              />
            </div>
          )}
          <div className="field">
            <label htmlFor="e">Email</label>
            <input
              id="e"
              type="email"
              value={f.email}
              onChange={set("email")}
              autoComplete="email"
            />
          </div>
          {register && (
            <div className="field">
              <label htmlFor="p">Phone number</label>
              <input
                id="p"
                type="tel"
                value={f.phone}
                onChange={set("phone")}
                autoComplete="tel"
              />
            </div>
          )}
          <div className="field">
            <label htmlFor="pw">Password</label>
            <input
              id="pw"
              type="password"
              value={f.password}
              onChange={set("password")}
              autoComplete={register ? "new-password" : "current-password"}
              placeholder={register ? "At least 8 characters" : ""}
            />
          </div>
          {!register && (
            <p className="auth-forgot">
              <Link to="/forgot">Forgot password?</Link>
            </p>
          )}
          {err && (
            <p className="err" role="alert">
              {err}
            </p>
          )}
          <button className="btn" disabled={busy}>
            {busy ? "Please wait…" : register ? "Create account" : "Sign in"}
          </button>
        </form>
        <p className="muted center">
          {register ? (
            <>
              Already have an account? <Link to="/login">Sign in</Link>
            </>
          ) : (
            <>
              New here? <Link to="/register">Create an account</Link>
            </>
          )}
        </p>
      </div>
    </Page>
  );
}
