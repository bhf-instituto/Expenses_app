import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ModeToggle from '../components/ModeToggle.jsx';
import ListCardButton from '../components/ListCardButton.jsx';
import BottomActionBar from '../components/BottomActionBar.jsx';
import connectionIcon from '../assets/icons/connection-icon.svg';
import offlineIcon from '../assets/icons/connection-offline-icon.svg';
import pendingIcon from '../assets/icons/pending-icon.svg';
import MonoIcon from '../components/MonoIcon.jsx';
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
  const { logout, isOnline } = useAuth();
  // const { user, logout, isOnline } = useAuth();
  const { pendingCount } = useExpenseSync();
  const [mode, setMode] = useState('create');
  const [groups, setGroups] = useState([]);
  const [favoriteGroupId, setFavoriteGroupId] = useState(() => getFavoriteGroupId());
  const [startupGroupId, setStartupGroupIdState] = useState(() => getStartupGroupId());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const flashMessage = location.state?.flash || '';
  // const profileAlias = user?.email ? String(user.email).split('@')[0] : '-';

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
      <header className="border-b border-app-ink/0 bg-app-panel/80 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-app-ink/50 px-3 py-1.5 text-xs  font-semibold  uppercase tracking-wide text-app-ink hover:bg-app-bg"
          >
            Logout
          </button>
          <div className="ml-auto flex min-w-0 items-center gap-1">
            {isOnline ? (
              <div
                className="flex h-8 shrink-0 items-center rounded-full border-0 bg-transparent border-app-status-online-border bg-app-status-online-bg px-2"
                title="Conectado y sincronizado"
                aria-label="Conectado y sincronizado"
              >
                <MonoIcon src={connectionIcon} colorVar="--app-icon-connection" className="h-4 w-7" />
              </div>
            ) : (
              <div
                className="flex h-8 shrink-0 items-center rounded-full border-0 bg-transparent border-app-status-offline-border bg-app-status-offline-bg px-2"
                title="Modo offline"
                aria-label="Modo offline"
              >
                <MonoIcon src={offlineIcon} colorVar="--app-icon-offline" className="h-4 w-7 scale-[1.12]" />
              </div>
            )}
            {pendingCount > 0 ? (
              <div
                className="flex h-8 shrink-0 items-center gap-0.5 rounded-full border-0 bg-transparent border-app-status-pending-border bg-app-status-pending-bg px-2"
                title={`Gastos pendientes: ${pendingCount}`}
                aria-label={`Gastos pendientes: ${pendingCount}`}
              >
                <MonoIcon src={pendingIcon} colorVar="--app-icon-pending" className="h-4 w-4" />
                <span className="text-xs font-extrabold leading-none text-app-ink">{pendingCount}</span>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="max-w-[100%] truncate rounded-lg border border-app-ink/20 bg-app-panel px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-app-ink hover:bg-app-sky/30"
            >
              Perfil
            </button>
          </div>
        </div>
      </header>

      <section className="scroll-pane">
        <div className="space-y-3">
          {flashMessage ? (
            <p className="rounded-xl border border-app-ink/15 bg-app-mint px-3 py-2 text-sm font-semibold text-app-ink">
              {flashMessage}
            </p>
          ) : null}
          <ModeToggle mode={mode} onChange={setMode} viewDisabled={!isOnline} />
          {mode === 'view' && !isOnline ? (
            <p className="rounded-xl border border-app-ink/15 bg-app-panel px-3 py-2 text-xs font-semibold uppercase tracking-wide text-app-muted">
              El modo VER esta deshabilitado sin conexion.
            </p>
          ) : null}

          <div className="space-y-3 rounded-2xl border-0 border-app-ink/20 bg-app-mint/35 p-3">
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
                  accent="bg-app-mint"
                  onClick={() => openGroup(group)}
                  disabled={mode === 'view' && !isOnline}
                  showFavorite
                  isFavorite={Number(group.id) === Number(favoriteGroupId)}
                  onToggleFavorite={() => handleToggleGroupFavorite(group.id)}
                />
              ))}
          </div>

          {error ? (
            <p className="rounded-xl bg-app-error-bg px-3 py-2 text-sm font-semibold text-app-error-text">{error}</p>
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
