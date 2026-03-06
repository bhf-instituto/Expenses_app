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
import { getCachedGroupsMode, getCachedSets, setCachedGroupsMode, setCachedSets } from '../lib/localCache.js';
import { resolveSessionScope } from '../lib/sessionScope.js';
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
import useFlipListAnimation from '../hooks/useFlipListAnimation.js';

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isOnline, connectionDebug } = useAuth();
  // const { user, logout, isOnline } = useAuth();
  const { pendingCount } = useExpenseSync();
  const sessionScope = resolveSessionScope(user);
  const [mode, setMode] = useState(() => getCachedGroupsMode(sessionScope));
  const effectiveMode = mode;
  const [groups, setGroups] = useState(() => getCachedSets(sessionScope));
  const [favoriteGroupId, setFavoriteGroupId] = useState(() => getFavoriteGroupId(sessionScope));
  const [startupGroupId, setStartupGroupIdState] = useState(() => getStartupGroupId(sessionScope));
  const [loading, setLoading] = useState(() => getCachedSets(sessionScope).length === 0);
  const [error, setError] = useState('');
  const flashMessage = location.state?.flash || '';
  const showNetDebug = typeof window !== 'undefined'
    && (
      new URLSearchParams(window.location.search).get('netdebug') === '1'
      || window.localStorage.getItem('expenses_net_debug') === '1'
    );
  // const profileAlias = user?.email ? String(user.email).split('@')[0] : '-';

  useEffect(() => {
    setMode(getCachedGroupsMode(sessionScope));
  }, [sessionScope]);

  useEffect(() => {
    setCachedGroupsMode(mode, sessionScope);
  }, [mode, sessionScope]);

  useEffect(() => {
    let cancelled = false;

    const loadGroups = async () => {
      setError('');
      const cachedSets = getCachedSets(sessionScope);
      if (!cancelled && cachedSets.length > 0) {
        setGroups(cachedSets);
        setFavoriteGroupId(getFavoriteGroupId(sessionScope));
        setStartupGroupIdState(getStartupGroupId(sessionScope));
      }
      if (!cancelled) {
        setLoading(cachedSets.length === 0);
      }

      if (!isOnline) {
        if (!cancelled) {
          setGroups(cachedSets);
          setLoading(false);
        }
        return;
      }

      try {
        const data = await setsApi.getAll();
        const sets = data?.sets || [];
        if (!cancelled) {
          setGroups(sets);
          setCachedSets(sets, sessionScope);
          setLoading(false);
        }
      } catch (requestError) {
        if (!cancelled) {
          const message =
            requestError instanceof ApiError ? requestError.message : 'No se pudieron cargar los grupos';
          setError(message);
          setGroups(cachedSets);
          setLoading(false);
        }
      }
    };

    loadGroups();
    return () => {
      cancelled = true;
    };
  }, [isOnline, sessionScope]);

  useEffect(() => {
    if (location.pathname !== '/' || loading) return;
    if (groups.length === 0) return;

    let favoriteGroup = null;
    if (favoriteGroupId) {
      favoriteGroup = groups.find((group) => Number(group.id) === Number(favoriteGroupId)) || null;
      if (!favoriteGroup) {
        clearFavoriteGroup(sessionScope);
      }
    }

    let startupGroup = null;
    if (startupGroupId) {
      startupGroup = groups.find((group) => Number(group.id) === Number(startupGroupId)) || null;
      if (!startupGroup) {
        clearStartupGroup(sessionScope);
      }
    }

    const targetGroup = favoriteGroup || startupGroup || groups[0];
    if (!targetGroup) return;

    setStartupGroupId(targetGroup.id, sessionScope);

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
    sessionScope,
  ]);

  const sortedGroups = useMemo(
    () => sortByFavorites(groups, (group) => Number(group.id) === Number(favoriteGroupId)),
    [groups, favoriteGroupId]
  );
  const setAnimatedGroupRef = useFlipListAnimation(sortedGroups.map((group) => group.id));

  const openGroup = (group) => {
    const savedStartupId = setStartupGroupId(group.id, sessionScope);
    setStartupGroupIdState(savedStartupId);
    const navigationState = {
      setName: group.name,
      role: Number(group.role),
    };

    if (effectiveMode === 'view') {
      navigate(`/sets/${group.id}/view`, { state: navigationState });
      return;
    }

    if (effectiveMode === 'incomes') {
      navigate(`/sets/${group.id}/incomes`, { state: navigationState });
      return;
    }

    navigate(`/sets/${group.id}/types`, { state: navigationState });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth', { replace: true });
  };

  const handleToggleGroupFavorite = (groupId) => {
    const next = toggleFavoriteGroup(groupId, sessionScope);
    setFavoriteGroupId(next);
    if (next) {
      const savedStartupId = setStartupGroupId(next, sessionScope);
      setStartupGroupIdState(savedStartupId);
    }
  };

  return (
    <main className="app-shell">
      <header className="safe-top border-b border-app-ink/0 bg-app-panel/80 px-4 pb-2 backdrop-blur">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border-0 bg-app-mint/100 border-app-ink/50 px-3 py-1.5 text-xs  font-bold  uppercase tracking-wide text-app-ink hover:bg-app-bg"
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
              <button
                type="button"
                onClick={() => navigate('/pending-actions')}
                className="flex h-8 shrink-0 items-center gap-0.5 rounded-full border-0 bg-transparent border-app-status-pending-border bg-app-status-pending-bg px-2"
                title={`Acciones pendientes: ${pendingCount}`}
                aria-label={`Acciones pendientes: ${pendingCount}`}
              >
                <MonoIcon src={pendingIcon} colorVar="--app-icon-pending" className="h-4 w-4" />
                <span className="text-xs font-extrabold leading-none text-app-ink">{pendingCount}</span>
              </button>
            ) : null}
            {showNetDebug ? (
              <div
                className="rounded-md bg-app-bg/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-app-muted"
                title="Debug conectividad: B=browser, P=probe backend"
                aria-label="Debug conectividad"
              >
                B:{connectionDebug?.browserOnline ? 1 : 0} P:{connectionDebug?.backendReachable ? 1 : 0}
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="max-w-[100%] truncate rounded-lg border-0 bg-app-mint border-app-panel/20  px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-app-ink hover:bg-app-sky/30"
            >
              Perfil
            </button>
          </div>
        </div>
      </header>

      <section className="min-h-0 flex-1 overflow-hidden px-4 pb-2 pt-3">
        <div className="flex h-full min-h-0 flex-col gap-3">
          {flashMessage ? (
            <p className="rounded-xl border border-app-ink/15 bg-app-mint px-3 py-2 text-sm font-semibold text-app-ink">
              {flashMessage}
            </p>
          ) : null}
          <ModeToggle
            mode={effectiveMode}
            onChange={setMode}
            viewDisabled={false}
            incomeDisabled={false}
          />

          <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border-0 border-app-ink/20 bg-app-mint/35 p-3">
            <div className="no-scrollbar h-full overflow-y-auto">
              <div className="space-y-3 pr-1">
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
                    <div key={group.id} ref={setAnimatedGroupRef(group.id)}>
                      <ListCardButton
                        title={group.name}
                        subtitle={
                          effectiveMode === 'create'
                            ? 'Crear gasto'
                            : effectiveMode === 'view'
                            ? 'Ver gastos'
                            : 'Ingresos'
                        }
                        accent="bg-app-mint"
                        onClick={() => openGroup(group)}
                        showFavorite
                        isFavorite={Number(group.id) === Number(favoriteGroupId)}
                        onToggleFavorite={() => handleToggleGroupFavorite(group.id)}
                      />
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {error ? (
            <p className="rounded-xl bg-app-error-bg px-3 py-2 text-sm font-semibold text-app-error-text">{error}</p>
          ) : null}
        </div>
      </section>

      {effectiveMode === 'create' && isOnline ? (
        <BottomActionBar
          label="Crear grupo"
          onClick={() => navigate('/sets/new')}
        />
      ) : null}
    </main>
  );
}
