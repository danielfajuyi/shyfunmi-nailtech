import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Page from '../components/Page.jsx';
import { api } from '../api.js';
import { useApp } from '../context.jsx';
import { useTitle } from '../hooks.js';

export default function Auth({ mode }) {
  const register = mode === 'register';
  useTitle(register ? 'Create account' : 'Sign in');
  const { setUser } = useApp();
  const nav = useNavigate();
  const [q] = useSearchParams();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const { user } = await api.post(`/api/auth/${register ? 'register' : 'login'}`, f);
      setUser(user);
      nav(q.get('next') || (user.role === 'admin' ? '/admin' : '/account'), { replace: true });
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <Page className="container section page-top">
      <div className="auth card">
        <h1 className="h1s sm">{register ? 'Create your account' : 'Welcome back'}</h1>
        <p className="muted">{register ? 'Track bookings, see loyalty rewards and rebook in seconds.' : 'Sign in to manage your appointments.'}</p>
        <form onSubmit={submit} className="form" noValidate>
          {register && <div className="field"><label htmlFor="n">Full name</label><input id="n" value={f.name} onChange={set('name')} autoComplete="name" /></div>}
          <div className="field"><label htmlFor="e">Email</label><input id="e" type="email" value={f.email} onChange={set('email')} autoComplete="email" /></div>
          {register && <div className="field"><label htmlFor="p">Phone number</label><input id="p" type="tel" value={f.phone} onChange={set('phone')} autoComplete="tel" /></div>}
          <div className="field"><label htmlFor="pw">Password</label><input id="pw" type="password" value={f.password} onChange={set('password')} autoComplete={register ? 'new-password' : 'current-password'} placeholder={register ? 'At least 8 characters' : ''} /></div>
          {err && <p className="err" role="alert">{err}</p>}
          <button className="btn" disabled={busy}>{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}</button>
        </form>
        <p className="muted center">{register ? <>Already have an account? <Link to="/login">Sign in</Link></> : <>New here? <Link to="/register">Create an account</Link></>}</p>
      </div>
    </Page>
  );
}
