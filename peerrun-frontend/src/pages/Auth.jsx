import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useApp } from '../context/AppContext';
import { errMsg } from '../utils';

export default function Auth() {
  const [params, setParams] = useSearchParams();
  const register = params.get('mode') === 'register';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { auth, toast } = useApp();
  const nav = useNavigate();
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const res = register ? await api.register(form) : await api.login(form);
      auth(res);
      toast(`Welcome${register ? '' : ' back'}, ${res.user.name}.`, 'ok');
      nav('/browse');
    } catch (err) {
      setError(errMsg(err));
    } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-md py-16">
      <h1 className="text-4xl font-extrabold">{register ? 'Create your account' : 'Log in'}</h1>
      <p className="mt-2 text-sage">
        {register ? 'One account works for posting errands and running them.' : 'Pick up where you left off.'}
      </p>
      <form onSubmit={submit} className="panel mt-8 space-y-4 p-6">
        {register && (
          <label className="block text-sm">Name
            <input className="field mt-1" required minLength={2} value={form.name} onChange={set('name')} autoComplete="name" />
          </label>
        )}
        <label className="block text-sm">Email
          <input className="field mt-1" type="email" required value={form.email} onChange={set('email')} autoComplete="email" />
        </label>
        <label className="block text-sm">Password
          <input className="field mt-1" type="password" required minLength={6} value={form.password} onChange={set('password')}
            autoComplete={register ? 'new-password' : 'current-password'} />
        </label>
        {error && <p role="alert" className="text-sm text-chili">{error}</p>}
        <button className="btn w-full" disabled={busy}>{busy ? 'One moment…' : register ? 'Create account' : 'Log in'}</button>
      </form>
      <p className="mt-5 text-sm text-sage">
        {register ? 'Already have an account?' : 'New to PeerRun?'}{' '}
        <button className="font-semibold text-gold underline" onClick={() => setParams(register ? {} : { mode: 'register' })}>
          {register ? 'Log in' : 'Create an account'}
        </button>
      </p>
    </div>
  );
}
