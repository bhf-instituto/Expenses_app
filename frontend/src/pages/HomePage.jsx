import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ModeToggle from '../components/ModeToggle.jsx';
import ListCardButton from '../components/ListCardButton.jsx';
import BottomActionBar from '../components/BottomActionBar.jsx';
import OfflineBanner from '../components/OfflineBanner.jsx';
import pendingIcon from '../assets/icons/pending-icon.svg';
import { ApiError, setsApi } from '../lib/apiClient.js';
import { getCachedSets, setCachedSets } from '../lib/localCache.js';
import {
  clearFavoriteGroup,
  clearStartupGroup,
  getFavoriteGroupId,
  getStartupGroupId,
  setStartupGroupId,
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
  const [favoriteGroupId, setFavoriteGroupId] = useState(() => getFavoriteGroupId());
  const [startupGroupId, setStartupGroupIdState] = useState(() => getStartupGroupId());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const flashMessage = location.state?.flash || '';
  const profileAlias = user?.email ? String(user.email).split('@')[0] : '-';

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

  useEffect(() => {
    if (location.pathname !== '/' || loading) return;
    if (groups.length === 0) return;

    let favoriteGroup = null;
    if (favoriteGroupId) {
      favoriteGroup = groups.find((group) => Number(group.id) === Number(favoriteGroupId)) || null;
      if (!favoriteGroup) {
        clearFavoriteGroup();
        setFavoriteGroupId(null);
      }
    }

    let startupGroup = null;
    if (startupGroupId) {
      startupGroup = groups.find((group) => Number(group.id) === Number(startupGroupId)) || null;
      if (!startupGroup) {
        clearStartupGroup();
        setStartupGroupIdState(null);
      }
    }

    const targetGroup = favoriteGroup || startupGroup || groups[0];
    if (!targetGroup) return;

    const savedStartupId = setStartupGroupId(targetGroup.id);
    setStartupGroupIdState(savedStartupId);

    navigate(`/sets/${targetGroup.id}/types`, {
      replace: true,
      state: { setName: targetGroup.name },
    });
  }, [
    favoriteGroupId,
    groups,
    loading,
    location.pathname,
    navigate,
    startupGroupId,
  ]);

  const onlineSyncMessage = useMemo(() => {
    if (!isOnline) return '';
    if (isSyncing) return 'Sincronizando gastos en cola...';
    if (lastSyncSummary) return lastSyncSummary;
    return '';
  }, [isOnline, isSyncing, lastSyncSummary]);

  const sortedGroups = useMemo(
    () => sortByFavorites(groups, (group) => Number(group.id) === Number(favoriteGroupId)),
    [groups, favoriteGroupId]
  );

  const openGroup = (group) => {
    const savedStartupId = setStartupGroupId(group.id);
    setStartupGroupIdState(savedStartupId);

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
    setFavoriteGroupId(next);
    if (next) {
      const savedStartupId = setStartupGroupId(next);
      setStartupGroupIdState(savedStartupId);
    }
  };

  return (
    <main className="app-shell">
      <header className="border-b border-app-ink/10 bg-white/80 px-4 py-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-app-ink/25 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-app-ink hover:bg-app-bg"
          >
            Logout
          </button>
          <div className="ml-auto flex min-w-2 items-center gap-2">
            {pendingCount > 0 ? (
              <div
                className="flex h-8 shrink-0 items-center gap-1 rounded-full border border-app-ink/20 bg-app-warning px-2"
                title={`Gastos pendientes: ${pendingCount}`}
                aria-label={`Gastos pendientes: ${pendingCount}`}
              >
                <img src={pendingIcon} alt="" aria-hidden="true" className="h-3.5 w-3.5" />
                <span className="text-[11px] font-extrabold leading-none text-app-ink">{pendingCount}</span>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="max-w-[100%] truncate rounded-lg border border-app-ink/20 bg-app-panel px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-app-ink hover:bg-app-sky/30"
            >
              {profileAlias}
            </button>
          </div>
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
                  isFavorite={Number(group.id) === Number(favoriteGroupId)}
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
