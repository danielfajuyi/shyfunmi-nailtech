import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Page from '../components/Page.jsx';
import { api } from '../api.js';
import { useApp } from '../context.jsx';
import { useTitle } from '../hooks.js';

export default function Reset() {
  useTitle('Choose a new password');
  const { setUser } = useApp();
  const nav = useNavigate();
  const [q] = useSearchParams();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const email = q.get('email') || '';
  const token = q.get('token') || '';

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const { user } = await api.post('/api/auth/reset', { email, token, password });
      setUser(user);
      nav(user.role === 'admin' ? '/admin' : '/account', { replace: true });
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };

  if (!email || !token) {
    return (
      <Page className="container section page-top">
        <div className="auth card">
          <h1 className="h1s sm">Link expired</h1>
          <p className="muted">This reset link is missing details. Request a new one.</p>
          <Link className="btn" to="/forgot">Forgot password</Link>
        </div>
      </Page>
    );
  }

  return (
    <Page className="container section page-top">
      <div className="auth card">
        <h1 className="h1s sm">Choose a new password</h1>
        <p className="muted">For {email}</p>
        <form onSubmit={submit} className="form">
          <div className="field"><label htmlFor="np">New password</label><input id="np" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="At least 8 characters" required minLength={8} /></div>
          {err && <p className="err" role="alert">{err}</p>}
          <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save password and sign in'}</button>
        </form>
      </div>
    </Page>
  );
}
