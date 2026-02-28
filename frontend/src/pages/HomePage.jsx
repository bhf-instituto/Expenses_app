import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MobileShell from '../components/MobileShell';
import ModeSwitcher from '../components/ModeSwitcher';
import { api } from '../services/api';

export default function HomePage({ auth, setAuth, isOnline, syncing }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('create');
  const [sets, setSets] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.sets()
      .then((res) => setSets(res.sets || []))
      .catch((err) => setError(err.message));
  }, []);

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setAuth(null);
      navigate('/auth');
    }
  };

  const statusLabel = useMemo(() => {
    if (!isOnline) return 'Offline: solo carga de gastos disponible';
    if (syncing) return 'Sincronizando gastos pendientes...';
    return 'Online';
  }, [isOnline, syncing]);

  return (
    <MobileShell
      title="Home"
      rightSlot={
        <div className="is-flex is-align-items-center" style={{ gap: 8 }}>
          <button className="button is-small is-danger is-light" onClick={logout}>Logout</button>
          <Link className="button is-small is-link is-light" to="/profile">{auth?.user?.email || 'Perfil'}</Link>
        </div>
      }
      footer={
        mode === 'create' ? (
          <Link className="button is-primary is-fullwidth is-medium" to="/sets/new">+ Crear grupo</Link>
        ) : null
      }
    >
      <p className={`tag mb-2 ${isOnline ? 'is-success' : 'is-warning'}`}>{statusLabel}</p>
      <ModeSwitcher mode={mode} onChange={setMode} />
      {error ? <p className="help is-danger mb-2">{error}</p> : null}
      <div className="mobile-list">
        {sets.map((set) => (
          <Link
            key={set.id}
            className="box list-card"
            to={mode === 'create' ? `/sets/${set.id}/types?name=${encodeURIComponent(set.name)}` : `/sets/${set.id}/view?name=${encodeURIComponent(set.name)}`}
          >
            <p className="title is-5 mb-0">{set.name}</p>
          </Link>
        ))}
      </div>
    </MobileShell>
  );
}
