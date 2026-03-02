import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ModeToggle from '../components/ModeToggle.jsx';
import ListCardButton from '../components/ListCardButton.jsx';
import BottomActionBar from '../components/BottomActionBar.jsx';
import OfflineBanner from '../components/OfflineBanner.jsx';
import { ApiError, setsApi } from '../lib/apiClient.js';
import { getCachedSets, setCachedSets } from '../lib/localCache.js';
import {
  getFavoriteGroupIds,
  sortByFavorites,
  toggleFavoriteGroup,
} from '../lib/favoritesStorage.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useExpenseSync } from '../context/ExpenseSyncContext.jsx';

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isOnline } = useAuth();
  const { pendingCount, isSyncing, lastSyncSummary } = useExpenseSync();
  const [mode, setMode] = useState('create');
  const [groups, setGroups] = useState([]);
  const [favoriteGroupIds, setFavoriteGroupIds] = useState(() => getFavoriteGroupIds());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const flashMessage = location.state?.flash || '';

  useEffect(() => {
    if (!isOnline && mode === 'view') {
      setMode('create');
    }
  }, [isOnline, mode]);

  useEffect(() => {
    let cancelled = false;

    const loadGroups = async () => {
      setError('');
      setLoading(true);

      if (!isOnline) {
        const cached = getCachedSets();
        if (!cancelled) {
          setGroups(cached);
          setLoading(false);
        }
        return;
      }

      try {
        const data = await setsApi.getAll();
        const sets = data?.sets || [];
        if (!cancelled) {
          setGroups(sets);
          setCachedSets(sets);
        }
      } catch (requestError) {
        if (!cancelled) {
          const message =
            requestError instanceof ApiError ? requestError.message : 'No se pudieron cargar los grupos';
          setError(message);
          setGroups(getCachedSets());
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadGroups();
    return () => {
      cancelled = true;
    };
  }, [isOnline]);

  const onlineSyncMessage = useMemo(() => {
    if (!isOnline) return '';
    if (isSyncing) return 'Sincronizando gastos en cola...';
    if (lastSyncSummary) return lastSyncSummary;
    return '';
  }, [isOnline, isSyncing, lastSyncSummary]);

  const sortedGroups = useMemo(
    () => sortByFavorites(groups, (group) => favoriteGroupIds.includes(Number(group.id))),
    [groups, favoriteGroupIds]
  );

  const openGroup = (group) => {
    if (mode === 'view') {
      if (!isOnline) return;
      navigate(`/sets/${group.id}/view`, { state: { setName: group.name } });
      return;
    }

    navigate(`/sets/${group.id}/types`, { state: { setName: group.name } });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth', { replace: true });
  };

  const handleToggleGroupFavorite = (groupId) => {
    const next = toggleFavoriteGroup(groupId);
    setFavoriteGroupIds(next);
  };

  return (
    <main className="app-shell">
      <header className="border-b border-app-ink/10 bg-white/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-app-ink/25 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-app-ink hover:bg-app-bg"
          >
            Logout
          </button>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="ml-auto max-w-[68%] truncate rounded-lg border border-app-ink/20 bg-app-panel px-3 py-1 text-xs font-bold uppercase tracking-wide text-app-ink hover:bg-app-sky/30"
          >
            {user?.email}
          </button>
        </div>
      </header>

      <section className="scroll-pane">
        <div className="space-y-3">
          <OfflineBanner isOnline={isOnline} />
          {flashMessage ? (
            <p className="rounded-xl border border-app-ink/15 bg-app-mint px-3 py-2 text-sm font-semibold text-app-ink">
              {flashMessage}
            </p>
          ) : null}
          {onlineSyncMessage ? (
            <p className="rounded-xl border border-app-ink/15 bg-app-panel px-3 py-2 text-xs font-semibold uppercase tracking-wide text-app-muted">
              {onlineSyncMessage}
            </p>
          ) : null}
          {pendingCount > 0 ? (
            <p className="rounded-xl border border-app-ink/15 bg-app-warning px-3 py-2 text-xs font-bold uppercase tracking-wide text-app-ink">
              Gastos pendientes de envio: {pendingCount}
            </p>
          ) : null}

          <ModeToggle mode={mode} onChange={setMode} viewDisabled={!isOnline} />
          {mode === 'view' && !isOnline ? (
            <p className="rounded-xl border border-app-ink/15 bg-app-panel px-3 py-2 text-xs font-semibold uppercase tracking-wide text-app-muted">
              El modo VER esta deshabilitado sin conexion.
            </p>
          ) : null}

          <div className="space-y-3 rounded-2xl border border-app-ink/20 bg-app-mint/35 p-3">
            {loading ? <p className="text-sm font-semibold text-app-muted">Cargando grupos...</p> : null}
            {!loading && groups.length === 0 ? (
              <p className="text-sm font-semibold text-app-muted">
                {isOnline
                  ? 'No tenes grupos todavia. Crea el primero.'
                  : 'Sin conexion y sin grupos cacheados para mostrar.'}
              </p>
            ) : null}
            {!loading &&
              sortedGroups.map((group) => (
                <ListCardButton
                  key={group.id}
                  title={group.name}
                  subtitle={mode === 'create' ? 'Crear gasto' : 'Ver gastos'}
                  accent="bg-white"
                  onClick={() => openGroup(group)}
                  disabled={mode === 'view' && !isOnline}
                  showFavorite
                  isFavorite={favoriteGroupIds.includes(Number(group.id))}
                  onToggleFavorite={() => handleToggleGroupFavorite(group.id)}
                />
              ))}
          </div>

          {error ? (
            <p className="rounded-xl bg-red-100 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>
          ) : null}
        </div>
      </section>

      {mode === 'create' ? (
        <BottomActionBar
          label={isOnline ? 'Crear grupo' : 'Crear grupo (offline bloqueado)'}
          disabled={!isOnline}
          onClick={() => navigate('/sets/new')}
        />
      ) : (
        <BottomActionBar
          label="Modo ver activo"
          disabled
          onClick={() => {}}
        />
      )}
    </main>
  );
}
