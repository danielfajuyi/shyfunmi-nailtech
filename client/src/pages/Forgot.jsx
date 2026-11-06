import { useState } from 'react';
import { Link } from 'react-router-dom';
import Page from '../components/Page.jsx';
import { AuthBackdrop } from '../components/PageHero.jsx';
import { api } from '../api.js';
import { useTitle } from '../hooks.js';

export default function Forgot() {
  useTitle('Forgot password');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      await api.post('/api/auth/forgot', { email });
      setDone(true);
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };

  return (
    <Page className="container section page-top auth-page">
      <AuthBackdrop />
      <div className="auth card">
        <h1 className="h1s sm">Reset password</h1>
        {done ? (
          <>
            <p className="muted">If an account exists for that email, a reset link is on its way. Check your inbox and spam folder.</p>
            <Link className="btn" to="/login">Back to sign in</Link>
          </>
        ) : (
          <>
            <p className="muted">Enter the email on your account. We'll send a link that expires in one hour.</p>
            <form onSubmit={submit} className="form">
              <div className="field"><label htmlFor="fe">Email</label><input id="fe" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></div>
              {err && <p className="err" role="alert">{err}</p>}
              <button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
            </form>
            <p className="muted center"><Link to="/login">Back to sign in</Link></p>
          </>
        )}
      </div>
    </Page>
  );
}
