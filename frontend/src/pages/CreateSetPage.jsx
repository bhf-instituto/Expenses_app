import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileHeader from '../components/MobileHeader.jsx';
import BottomActionBar from '../components/BottomActionBar.jsx';
import OfflineBanner from '../components/OfflineBanner.jsx';
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
      navigate('/', { replace: true, state: { flash: 'Grupo creado correctamente.' } });
    } catch (requestError) {
      const message = requestError instanceof ApiError ? requestError.message : 'No se pudo crear el grupo';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="app-shell">
      <MobileHeader title="Crear grupo" backTo="/" leftLabel="Back" />
      <section className="scroll-pane">
        <div className="space-y-3">
          <OfflineBanner isOnline={isOnline} />
          <div className="rounded-2xl border border-app-ink/20 bg-white p-4 shadow-card">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Nombre del grupo</span>
              <input
                type="text"
                value={setName}
                onChange={(event) => setSetName(event.target.value)}
                placeholder="Mi grupo principal"
                className="mt-2 w-full rounded-xl border border-app-ink/20 px-3 py-3 text-sm outline-none focus:border-app-ink/50"
              />
            </label>

            {error ? (
              <p className="mt-3 rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>
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
