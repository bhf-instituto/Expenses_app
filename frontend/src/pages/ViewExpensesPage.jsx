import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import MobileHeader from '../components/MobileHeader.jsx';
import BottomActionBar from '../components/BottomActionBar.jsx';
import HorizontalScrollableChoice from '../components/HorizontalScrollableChoice.jsx';
import { ApiError, categoriesApi, expensesApi, setsApi } from '../lib/apiClient.js';
import { EXPENSE_TYPES, PAYMENT_METHODS, getExpenseTypeById, getPaymentMethodById } from '../constants/catalogs.js';
import {
  getCachedCategories,
  getCachedSetUsers,
  setCachedCategories,
  setCachedSetUsers,
} from '../lib/localCache.js';
import { resolveSessionScope } from '../lib/sessionScope.js';
import { useAuth } from '../context/AuthContext.jsx';

const getEmailAlias = (email) => String(email || '').split('@')[0] || String(email || '');

export default function ViewExpensesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOnline, user } = useAuth();
  const { setId } = useParams();
  const sessionScope = resolveSessionScope(user);
  const [groupUsers, setGroupUsers] = useState(() => getCachedSetUsers(setId, sessionScope));
  const [usersLoading, setUsersLoading] = useState(() => getCachedSetUsers(setId, sessionScope).length === 0);
  const [usersError, setUsersError] = useState('');
  const [categories, setCategories] = useState(() => getCachedCategories(setId, undefined, sessionScope));
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    expense_type: '',
    category_id: '',
    payment_method: '',
    user_id: '',
    from_date: '',
    to_date: '',
  });

  const setName = location.state?.setName || `Grupo ${setId}`;
  const selectedTypeId = filters.expense_type ? Number(filters.expense_type) : null;

  const typeFilterOptions = useMemo(
    () => [
      { value: '', label: 'Todos' },
      ...EXPENSE_TYPES.map((type) => ({ value: String(type.id), label: type.shortLabel || type.label })),
    ],
    []
  );

  const paymentFilterOptions = useMemo(
    () => [
      { value: '', label: 'Todas' },
      ...PAYMENT_METHODS.map((method) => ({
        value: String(method.id),
        label: method.shortLabel || method.label,
      })),
    ],
    []
  );

  const userFilterOptions = useMemo(() => {
    const currentUserId = Number(user?.id);
    const withAll = [{ value: '', label: 'Todos' }];
    const meOption = Number.isInteger(currentUserId) ? [{ value: String(currentUserId), label: 'Yo' }] : [];
    const others = groupUsers
      .filter((groupUser) => Number(groupUser.id) !== currentUserId)
      .map((groupUser) => ({
        value: String(groupUser.id),
        label: getEmailAlias(groupUser.email),
      }));

    return [...withAll, ...meOption, ...others];
  }, [groupUsers, user?.id]);

  const query = useMemo(
    () => ({
      page: 1,
      limit: 50,
      ...filters,
    }),
    [filters]
  );

  const loadExpenses = async (currentQuery) => {
    setLoading(true);
    setError('');
    try {
      const data = await expensesApi.getAll(setId, currentQuery);
      setExpenses(Array.isArray(data) ? data : []);
    } catch {
      setError('No se pudieron cargar los gastos');
    } finally {
      setLoading(false);
    }
  };

  const groupedCategoriesByType = useMemo(
    () =>
      EXPENSE_TYPES.map((type) => ({
        type,
        categories: categories.filter((category) => Number(category.expense_type) === type.id),
      })),
    [categories]
  );

  const visibleCategories = useMemo(() => {
    if (!selectedTypeId) return categories;
    return categories.filter((category) => Number(category.expense_type) === selectedTypeId);
  }, [categories, selectedTypeId]);

  const totalAmount = useMemo(
    () => expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    [expenses]
  );

  useEffect(() => {
    if (!filters.category_id) return;
    const stillValid = visibleCategories.some(
      (category) => String(category.id) === String(filters.category_id)
    );
    if (!stillValid) {
      setFilters((prev) => ({ ...prev, category_id: '' }));
    }
  }, [filters.category_id, visibleCategories]);

  useEffect(() => {
    if (!filters.user_id) return;
    const stillValid = userFilterOptions.some((option) => String(option.value) === String(filters.user_id));
    if (!stillValid) {
      setFilters((prev) => ({ ...prev, user_id: '' }));
    }
  }, [filters.user_id, userFilterOptions]);

  useEffect(() => {
    let cancelled = false;
    setUsersError('');

    const cachedUsers = getCachedSetUsers(setId, sessionScope);
    if (!cancelled) {
      if (cachedUsers.length > 0) {
        setGroupUsers(cachedUsers);
      }
      setUsersLoading(cachedUsers.length === 0);
    }

    if (!isOnline) {
      if (!cancelled) {
        setUsersLoading(false);
      }
      return () => {
        cancelled = true;
      };
    }

    const loadUsers = async () => {
      try {
        const data = await setsApi.getUsers(setId);
        const usersList = data?.users || [];
        if (!cancelled) {
          setGroupUsers(usersList);
          setCachedSetUsers(setId, usersList, sessionScope);
          setUsersLoading(false);
        }
      } catch (requestError) {
        if (!cancelled) {
          const message =
            requestError instanceof ApiError ? requestError.message : 'No se pudieron cargar los usuarios del grupo';
          setUsersError(message);
          setUsersLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, [setId, isOnline, sessionScope]);

  useEffect(() => {
    if (!isOnline) return;

    let cancelled = false;
    const cachedCategories = getCachedCategories(setId, undefined, sessionScope);
    if (cachedCategories.length > 0) {
      setCategories(cachedCategories);
    }

    const loadCategories = async () => {
      try {
        const data = await categoriesApi.getAll(setId, undefined);
        const nextCategories = data?.categories || [];
        if (!cancelled) {
          setCategories(nextCategories);
          setCachedCategories(setId, undefined, nextCategories, sessionScope);
        }
      } catch {
        if (!cancelled) {
          setCategories(cachedCategories);
        }
      }
    };

    loadCategories();
    loadExpenses(query);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, sessionScope, setId]);

  if (!isOnline) {
    return (
      <main className="app-shell">
        <MobileHeader title="Ver gastos" backTo="/groups" />
        <section className="scroll-pane">
          <div className="rounded-2xl border border-app-ink/20 bg-app-warning p-4 text-sm font-semibold text-app-ink">
            El modo VER esta deshabilitado offline.
          </div>
        </section>
        <BottomActionBar label="Volver a grupos" onClick={() => navigate('/groups')} />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <MobileHeader title={`Ver gastos: ${setName}`} backTo="/groups" />
      <section className="scroll-pane">
        <div className="space-y-3">
          <div className="rounded-2xl border border-app-ink/20 bg-app-panel p-3">
            <button
              type="button"
              onClick={() => setFiltersOpen((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-lg border border-app-ink/20 bg-app-panel px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-app-ink"
            >
              <span>Filtros</span>
              <span>{filtersOpen ? 'Ocultar' : 'Mostrar'}</span>
            </button>

            <div
              className={`grid overflow-hidden transition-all duration-300 ease-out ${
                filtersOpen ? 'mt-3 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="min-h-0">
                <div className="grid grid-cols-2 gap-2">
                  <label className="col-span-2 block">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-app-muted">Tipo</span>
                    <div className="mt-1">
                      <HorizontalScrollableChoice
                        value={filters.expense_type}
                        onChange={(value) => setFilters((prev) => ({ ...prev, expense_type: String(value) }))}
                        options={typeFilterOptions}
                        itemMinWidth={86}
                        compact
                      />
                    </div>
                  </label>
                  <label className="col-span-2 block">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-app-muted">Forma pago</span>
                    <div className="mt-1">
                      <HorizontalScrollableChoice
                        value={filters.payment_method}
                        onChange={(value) => setFilters((prev) => ({ ...prev, payment_method: String(value) }))}
                        options={paymentFilterOptions}
                        itemMinWidth={86}
                        compact
                      />
                    </div>
                  </label>
                  <label className="col-span-2 block">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-app-muted">Usuario</span>
                    <div className="mt-1">
                      <HorizontalScrollableChoice
                        value={filters.user_id}
                        onChange={(value) => setFilters((prev) => ({ ...prev, user_id: String(value) }))}
                        options={userFilterOptions}
                        itemMinWidth={86}
                        compact
                      />
                    </div>
                    {usersLoading ? (
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-app-muted">
                        Cargando usuarios...
                      </p>
                    ) : null}
                    {usersError ? (
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-app-error-text">
                        {usersError}
                      </p>
                    ) : null}
                  </label>
                  <label className="block col-span-2">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-app-muted">Categoria</span>
                    <select
                      value={filters.category_id}
                      onChange={(event) => setFilters((prev) => ({ ...prev, category_id: event.target.value }))}
                      className="mt-1 app-select"
                    >
                      <option value="">Todas</option>
                      {selectedTypeId
                        ? visibleCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))
                        : groupedCategoriesByType.map((group) => (
                            <optgroup key={group.type.id} label={group.type.label.toLowerCase()}>
                              {group.categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-app-muted">Desde</span>
                    <input
                      type="date"
                      value={filters.from_date}
                      onChange={(event) => setFilters((prev) => ({ ...prev, from_date: event.target.value }))}
                      className="mt-1 app-input"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-app-muted">Hasta</span>
                    <input
                      type="date"
                      value={filters.to_date}
                      onChange={(event) => setFilters((prev) => ({ ...prev, to_date: event.target.value }))}
                      className="mt-1 app-input"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => loadExpenses(query)}
                  className="mt-3 w-full rounded-lg bg-app-sky px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-app-ink"
                >
                  Aplicar filtros
                </button>
              </div>
            </div>
          </div>

          {!loading && expenses.length > 0 ? (
            <div className="rounded-2xl border border-app-ink/20 bg-indigo-900 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-app-muted">Total filtrado</p>
              <p className="mt-1 font-heading text-2xl font-bold text-app-ink">
                ${totalAmount.toLocaleString('es-AR')}
              </p>
            </div>
          ) : null}

          <div className="space-y-2 rounded-2xl border border-app-ink/20 bg-app-panel/70 p-3">
            {loading ? <p className="text-sm font-semibold text-app-muted">Cargando gastos...</p> : null}
            {!loading && expenses.length === 0 ? (
              <p className="text-sm font-semibold text-app-muted">No hay gastos con esos filtros.</p>
            ) : null}
            {!loading &&
              expenses.map((expense) => {
                const type = getExpenseTypeById(expense.expense_type);
                const payment = getPaymentMethodById(expense.payment_method);
                return (
                  <article key={expense.id} className="rounded-xl border border-app-ink/15 bg-app-panel p-3">
                    <p className="font-heading text-sm font-semibold uppercase text-app-ink">
                      {expense.category_name}
                    </p>
                    <p className="mt-1 text-lg font-extrabold text-app-ink">${expense.amount}</p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-app-muted">
                      {type?.label || 'Sin tipo'} | {payment?.label || 'Sin forma pago'} | {expense.expense_date}
                    </p>
                    {expense.description ? (
                      <p className="mt-1 text-xs font-semibold text-app-muted">{expense.description}</p>
                    ) : null}
                  </article>
                );
              })}
          </div>
          {error ? (
            <p className="rounded-xl bg-app-error-bg px-3 py-2 text-sm font-semibold text-app-error-text">{error}</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
