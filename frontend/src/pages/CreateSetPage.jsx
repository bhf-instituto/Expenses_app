import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileHeader from '../components/MobileHeader.jsx';
import BottomActionBar from '../components/BottomActionBar.jsx';
import { ApiError, setsApi } from '../lib/apiClient.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function CreateSetPage() {
  const navigate = useNavigate();
  const { isOnline } = useAuth();
  const [setName, setSetName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!isOnline || submitting) return;

    setError('');
    setSubmitting(true);
    try {
      await setsApi.create({ set_name: setName });
      navigate('/groups', { replace: true, state: { flash: 'Grupo creado correctamente.' } });
    } catch (requestError) {
      const message = requestError instanceof ApiError ? requestError.message : 'No se pudo crear el grupo';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="app-shell">
      <MobileHeader title="Crear grupo" backTo="/groups" leftLabel="Back" />
      <section className="scroll-pane">
        <div className="space-y-3">
          <div className="rounded-2xl border-0 border-app-ink/20 bg-app-panel p-4 shadow-card">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Nombre del grupo</span>
              <input
                type="text"
                value={setName}
                onChange={(event) => setSetName(event.target.value)}
                placeholder="Mi grupo principal"
                className="mt-2 app-input"
              />
            </label>

            {error ? (
              <p className="mt-3 rounded-lg bg-app-error-bg px-3 py-2 text-sm font-semibold text-app-error-text">{error}</p>
            ) : null}
          </div>
        </div>
      </section>
      <BottomActionBar
        label={submitting ? 'Creando...' : 'Guardar grupo'}
        disabled={!isOnline || submitting || !setName.trim()}
        onClick={handleCreate}
      />
    </main>
  );
}
