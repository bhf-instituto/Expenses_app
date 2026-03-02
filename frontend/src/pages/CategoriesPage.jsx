import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import MobileHeader from '../components/MobileHeader.jsx';
import ListCardButton from '../components/ListCardButton.jsx';
import BottomActionBar from '../components/BottomActionBar.jsx';
import { ApiError, categoriesApi } from '../lib/apiClient.js';
import { getExpenseTypeByKey } from '../constants/catalogs.js';
import { getCachedCategories, getCachedSets, setCachedCategories } from '../lib/localCache.js';
import {
  getFavoriteCategoryIds,
  sortByFavorites,
  toggleFavoriteCategory,
} from '../lib/favoritesStorage.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function CategoriesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOnline } = useAuth();
  const { setId, typeKey } = useParams();
  const expenseType = getExpenseTypeByKey(typeKey);
  const [setName, setSetName] = useState(location.state?.setName || `Grupo ${setId}`);
  const [categories, setCategories] = useState([]);
  const [favoriteCategoryIds, setFavoriteCategoryIds] = useState(() =>
    expenseType ? getFavoriteCategoryIds(setId, expenseType.id) : []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cachedSets = getCachedSets();
    const cachedSet = cachedSets.find((set) => String(set.id) === String(setId));
    if (!location.state?.setName && cachedSet?.name) {
      setSetName(cachedSet.name);
    }
  }, [location.state?.setName, setId]);

  useEffect(() => {
    if (!expenseType) {
      setFavoriteCategoryIds([]);
      return;
    }
    setFavoriteCategoryIds(getFavoriteCategoryIds(setId, expenseType.id));
  }, [setId, expenseType]);

  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      if (!expenseType) {
        setError('Tipo de gasto invalido');
        setLoading(false);
        return;
      }

      setError('');
      setLoading(true);

      if (!isOnline) {
        const cached = getCachedCategories(setId, expenseType.id);
        if (!cancelled) {
          setCategories(cached);
          setLoading(false);
        }
        return;
      }

      try {
        const data = await categoriesApi.getAll(setId, expenseType.id);
        const nextCategories = data?.categories || [];
        if (!cancelled) {
          setCategories(nextCategories);
          setCachedCategories(setId, expenseType.id, nextCategories);
        }
      } catch (requestError) {
        if (!cancelled) {
          const cached = getCachedCategories(setId, expenseType.id);
          setCategories(cached);
          const message =
            requestError instanceof ApiError ? requestError.message : 'No se pudieron cargar categorias';
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCategories();
    return () => {
      cancelled = true;
    };
  }, [setId, expenseType, isOnline]);

  const sortedCategories = useMemo(
    () => sortByFavorites(categories, (category) => favoriteCategoryIds.includes(Number(category.id))),
    [categories, favoriteCategoryIds]
  );

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
    const next = toggleFavoriteCategory(setId, expenseType.id, categoryId);
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
      <section className="scroll-pane">
        <div className="space-y-3">
          {/* <div className="rounded-xl border border-app-ink/15 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-app-muted">
            {setName}
          </div> */}
          <div className="space-y-3 rounded-2xl border border-app-ink/20 bg-app-panel/80 p-3">
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
                <ListCardButton
                  key={category.id}
                  title={category.name}
                  subtitle={`${typeKey === 'proveedor' ? 'Proveedor' : 'Categoria'} ${index + 1}`}
                  onClick={() => openCategory(category)}
                  accent="bg-app-panel"
                  size="compact"
                  showFavorite
                  isFavorite={favoriteCategoryIds.includes(Number(category.id))}
                  onToggleFavorite={() => handleToggleCategoryFavorite(category.id)}
                />
              ))}
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
