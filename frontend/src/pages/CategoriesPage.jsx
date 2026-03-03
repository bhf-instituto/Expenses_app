import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import MobileHeader from '../components/MobileHeader.jsx';
import ListCardButton from '../components/ListCardButton.jsx';
import BottomActionBar from '../components/BottomActionBar.jsx';
import { ApiError, categoriesApi } from '../lib/apiClient.js';
import { getExpenseTypeByKey } from '../constants/catalogs.js';
import { getCachedCategories, getCachedSets, setCachedCategories } from '../lib/localCache.js';
import { resolveSessionScope } from '../lib/sessionScope.js';
import {
  getFavoriteCategoryIds,
  sortByFavorites,
  toggleFavoriteCategory,
} from '../lib/favoritesStorage.js';
import { useAuth } from '../context/AuthContext.jsx';
import useFlipListAnimation from '../hooks/useFlipListAnimation.js';

export default function CategoriesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOnline, user } = useAuth();
  const { setId, typeKey } = useParams();
  const expenseType = getExpenseTypeByKey(typeKey);
  const sessionScope = resolveSessionScope(user);
  const setName = useMemo(() => {
    if (location.state?.setName) {
      return location.state.setName;
    }

    const cachedSets = getCachedSets(sessionScope);
    const cachedSet = cachedSets.find((set) => String(set.id) === String(setId));
    return cachedSet?.name || `Grupo ${setId}`;
  }, [location.state?.setName, sessionScope, setId]);
  const [categories, setCategories] = useState(() =>
    expenseType ? getCachedCategories(setId, expenseType.id, sessionScope) : []
  );
  const [favoriteCategoryIds, setFavoriteCategoryIds] = useState(() =>
    expenseType ? getFavoriteCategoryIds(setId, expenseType.id, sessionScope) : []
  );
  const [loading, setLoading] = useState(() =>
    expenseType ? getCachedCategories(setId, expenseType.id, sessionScope).length === 0 : false
  );
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      if (!expenseType) {
        setError('Tipo de gasto invalido');
        setCategories([]);
        setFavoriteCategoryIds([]);
        setLoading(false);
        return;
      }

      setError('');
      setFavoriteCategoryIds(getFavoriteCategoryIds(setId, expenseType.id, sessionScope));
      const cachedCategories = getCachedCategories(setId, expenseType.id, sessionScope);
      if (!cancelled) {
        if (cachedCategories.length > 0) {
          setCategories(cachedCategories);
        }
        setLoading(cachedCategories.length === 0);
      }

      if (!isOnline) {
        if (!cancelled) {
          setCategories(cachedCategories);
          setLoading(false);
        }
        return;
      }

      try {
        const data = await categoriesApi.getAll(setId, expenseType.id);
        const nextCategories = data?.categories || [];
        if (!cancelled) {
          setCategories(nextCategories);
          setCachedCategories(setId, expenseType.id, nextCategories, sessionScope);
          setLoading(false);
        }
      } catch (requestError) {
        if (!cancelled) {
          setCategories(cachedCategories);
          const message =
            requestError instanceof ApiError ? requestError.message : 'No se pudieron cargar categorias';
          setError(message);
          setLoading(false);
        }
      }
    };

    loadCategories();
    return () => {
      cancelled = true;
    };
  }, [setId, expenseType, isOnline, sessionScope]);

  const sortedCategories = useMemo(
    () => sortByFavorites(categories, (category) => favoriteCategoryIds.includes(Number(category.id))),
    [categories, favoriteCategoryIds]
  );
  const setAnimatedCategoryRef = useFlipListAnimation(sortedCategories.map((category) => category.id));

  const openCategory = (category) => {
    navigate(`/sets/${setId}/categories/${typeKey}/${category.id}/expense/new`, {
      state: {
        setName,
        categoryName: category.name,
      },
    });
  };

  const handleToggleCategoryFavorite = (categoryId) => {
    if (!expenseType) return;
    const next = toggleFavoriteCategory(setId, expenseType.id, categoryId, sessionScope);
    setFavoriteCategoryIds(next);
  };

  if (!expenseType) {
    return (
      <main className="app-shell">
        <MobileHeader title="Tipo invalido" backTo={`/sets/${setId}/types`} />
        <section className="scroll-pane">
          <p className="rounded-xl bg-app-error-bg px-3 py-2 text-sm font-semibold text-app-error-text">
            Tipo de gasto no reconocido.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <MobileHeader title={expenseType.categoryTitle} backTo={`/sets/${setId}/types`} leftLabel="Back" />
      <section className="min-h-0 flex-1 overflow-hidden px-4 pb-2 pt-3">
        <div className="flex h-full min-h-0 flex-col gap-3">
          {/* <div className="rounded-xl border border-app-ink/15 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-app-muted">
            {setName}
          </div> */}
          <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border-0 border-app-ink/20 bg-app-panel/80 p-3">
            <div className="no-scrollbar h-full overflow-y-auto">
              <div className="space-y-3 pr-1">
                {loading ? <p className="text-sm font-semibold text-app-muted">Cargando...</p> : null}
                {!loading && categories.length === 0 ? (
                  <p className="text-sm font-semibold text-app-muted">
                    {isOnline
                      ? 'No hay categorias. Crea una para continuar.'
                      : 'Sin conexion y sin categorias cacheadas para este tipo.'}
                  </p>
                ) : null}
                {!loading &&
                  sortedCategories.map((category, index) => (
                    <div key={category.id} ref={setAnimatedCategoryRef(category.id)}>
                      <ListCardButton
                        title={category.name}
                        subtitle={`${typeKey === 'proveedor' ? 'Proveedor' : 'Categoria'} ${index + 1}`}
                        onClick={() => openCategory(category)}
                        accent="bg-app-mint"
                        size="compact"
                        showFavorite
                        isFavorite={favoriteCategoryIds.includes(Number(category.id))}
                        onToggleFavorite={() => handleToggleCategoryFavorite(category.id)}
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
      <BottomActionBar
        label={typeKey === 'proveedor' ? 'Crear proveedor' : 'Crear categoria'}
        disabled={!isOnline}
        onClick={() =>
          navigate(`/sets/${setId}/categories/${typeKey}/new`, {
            state: { setName },
          })
        }
      />
    </main>
  );
}
