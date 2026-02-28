import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import MobileShell from '../components/MobileShell';

export default function AuthPage({ setAuth }) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const result = isLogin
        ? await api.login({ email, password })
        : await api.register({ email, password });

      setAuth({ user: result.data.user });
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <MobileShell title="Expenses login">
      <form onSubmit={submit} className="box">
        <h2 className="title is-5 mb-4">{isLogin ? 'Login' : 'Register'}</h2>
        <div className="field">
          <label className="label">Email</label>
          <div className="control">
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>
        <div className="field">
          <label className="label">Password</label>
          <div className="control">
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
        </div>
        {error ? <p className="help is-danger mb-2">{error}</p> : null}
        <button className="button is-primary is-fullwidth is-medium" type="submit">
          {isLogin ? 'Entrar' : 'Crear cuenta'}
        </button>
        <button className="button is-text is-fullwidth mt-2" type="button" onClick={() => setIsLogin((p) => !p)}>
          {isLogin ? 'No tengo cuenta' : 'Ya tengo cuenta'}
        </button>
      </form>
    </MobileShell>
  );
}
