import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import MobileHeader from '../components/MobileHeader.jsx';
import HorizontalScrollableChoice from '../components/HorizontalScrollableChoice.jsx';
import SingleChoiceButtons from '../components/SingleChoiceButtons.jsx';
import MonoIcon from '../components/MonoIcon.jsx';
import DateInputDmy from '../components/DateInputDmy.jsx';
import triangleUpIcon from '../assets/icons/triangle-up-icon.svg';
import { ApiError, categoriesApi, expensesApi, setsApi } from '../lib/apiClient.js';
import { EXPENSE_TYPES, PAYMENT_METHODS, getExpenseTypeById, getPaymentMethodById } from '../constants/catalogs.js';
import {
  getCachedCategories,
  getCachedExpenses,
  getCachedSetUsers,
  setCachedCategories,
  setCachedExpenses,
  setCachedSetUsers,
} from '../lib/localCache.js';
import { resolveSessionScope } from '../lib/sessionScope.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getExpenseTypeBgVarName, getPaymentMethodBgVarName } from '../lib/uiColorSettings.js';

const getEmailAlias = (email) => String(email || '').split('@')[0] || String(email || '');

const formatDateOnly = (value) => {
  const rawValue = String(value || '');
  if (!rawValue) return '-';
  const dateMatch = rawValue.match(/\d{4}-\d{2}-\d{2}/);
  return dateMatch ? dateMatch[0] : rawValue;
};

const applyLocalExpenseFilters = (rows, currentFilters) =>
  rows.filter((expense) => {
    if (currentFilters.expense_type && String(expense.expense_type) !== String(currentFilters.expense_type)) {
      return false;
    }
    if (currentFilters.category_id && String(expense.category_id) !== String(currentFilters.category_id)) {
      return false;
    }
    if (currentFilters.payment_method && String(expense.payment_method) !== String(currentFilters.payment_method)) {
      return false;
    }
    if (currentFilters.user_id && String(expense.user_id) !== String(currentFilters.user_id)) {
      return false;
    }

    const expenseDate = formatDateOnly(expense.expense_date);
    if (currentFilters.from_date && expenseDate < currentFilters.from_date) {
      return false;
    }
    if (currentFilters.to_date && expenseDate > currentFilters.to_date) {
      return false;
    }
    return true;
  });

const MOBILE_ITEMS_PER_PAGE = 30;

const parseTimestamp = (value) => {
  const normalized = String(value || '').trim();
  if (!normalized) return Number.NaN;
  const parsed = Date.parse(normalized.replace(' ', 'T'));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const getLatestUpdatedAt = (rows) =>
  rows.reduce((latest, row) => {
    const candidate = String(row?.updated_at || '').trim();
    if (!candidate) return latest;
    if (!latest) return candidate;
    return parseTimestamp(candidate) > parseTimestamp(latest) ? candidate : latest;
  }, '');

const sortExpenses = (rows) =>
  [...rows].sort((a, b) => {
    const updatedA = parseTimestamp(a?.updated_at);
    const updatedB = parseTimestamp(b?.updated_at);
    if (Number.isFinite(updatedA) && Number.isFinite(updatedB) && updatedA !== updatedB) {
      return updatedB - updatedA;
    }
    return Number(b?.id || 0) - Number(a?.id || 0);
  });

const mergeExpenses = (baseRows, patchRows) => {
  const map = new Map(baseRows.map((row) => [Number(row.id), row]));
  patchRows.forEach((row) => {
    const rowId = Number(row.id);
    if (!Number.isInteger(rowId) || rowId <= 0) return;
    map.set(rowId, row);
  });
  return sortExpenses([...map.values()]);
};

export default function ViewExpensesPage() {
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
  const [filtersBarVisible, setFiltersBarVisible] = useState(true);
  const [expensePage, setExpensePage] = useState(1);
  const expenseRowsPerPage = MOBILE_ITEMS_PER_PAGE;
  const listScrollTopRef = useRef(0);
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
      ...EXPENSE_TYPES.map((type) => ({
        value: String(type.id),
        label: type.shortLabel || type.label,
        bgColorVar: getExpenseTypeBgVarName(type.id),
      })),
    ],
    []
  );

  const paymentFilterOptions = useMemo(
    () => [
      { value: '', label: 'Todas' },
      ...PAYMENT_METHODS.map((method) => ({
        value: String(method.id),
        label: method.shortLabel || method.label,
        bgColorVar: getPaymentMethodBgVarName(method.id),
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

  const fetchAllExpensesForSet = useCallback(async (currentSetId, currentFilters) => {
    const pageSize = 100;
    const maxPages = 1000;
    const allRows = [];

    for (let page = 1; page <= maxPages; page += 1) {
      const batch = await expensesApi.getAll(currentSetId, {
        page,
        limit: pageSize,
        ...currentFilters,
      });
      const rows = Array.isArray(batch) ? batch : [];
      allRows.push(...rows);

      if (rows.length < pageSize) {
        break;
      }
    }

    return allRows;
  }, []);

  const loadExpenses = useCallback(
    async (currentFilters) => {
      const hasActiveFilters = Object.values(currentFilters).some((value) => String(value || '').trim() !== '');
      const cachedRows = getCachedExpenses(setId, sessionScope);
      const hasCachedRows = cachedRows.length > 0;
      const latestCachedUpdatedAt = getLatestUpdatedAt(cachedRows);

      if (hasCachedRows) {
        setExpenses(applyLocalExpenseFilters(cachedRows, currentFilters));
      }
      setLoading(!hasCachedRows);
      setError('');

      if (!isOnline) {
        setExpenses(applyLocalExpenseFilters(cachedRows, currentFilters));
        setLoading(false);
        return;
      }

      try {
        if (!hasCachedRows) {
          const rows = await fetchAllExpensesForSet(setId, currentFilters);
          setExpenses(rows);
          if (!hasActiveFilters) {
            setCachedExpenses(setId, rows, sessionScope);
          }
          return;
        }

        const updatedRows = latestCachedUpdatedAt
          ? await fetchAllExpensesForSet(setId, { updated_after: latestCachedUpdatedAt })
          : [];

        const nextBaseRows = updatedRows.length > 0
          ? mergeExpenses(cachedRows, updatedRows)
          : cachedRows;

        if (updatedRows.length > 0 || !hasActiveFilters) {
          setCachedExpenses(setId, nextBaseRows, sessionScope);
        }

        setExpenses(applyLocalExpenseFilters(nextBaseRows, currentFilters));
      } catch {
        setError('No se pudieron cargar los gastos');
        setExpenses(applyLocalExpenseFilters(cachedRows, currentFilters));
      } finally {
        setLoading(false);
      }
    },
    [fetchAllExpensesForSet, isOnline, sessionScope, setId]
  );

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

  const totalExpensePages = useMemo(
    () => Math.max(1, Math.ceil(expenses.length / Math.max(1, expenseRowsPerPage))),
    [expenseRowsPerPage, expenses.length]
  );

  const paginatedExpenses = useMemo(() => {
    const startIndex = (expensePage - 1) * expenseRowsPerPage;
    const endIndex = startIndex + expenseRowsPerPage;
    return expenses.slice(startIndex, endIndex);
  }, [expensePage, expenseRowsPerPage, expenses]);

  const expensePageRange = useMemo(() => {
    if (expenses.length === 0) {
      return { from: 0, to: 0, total: 0 };
    }
    const from = (expensePage - 1) * expenseRowsPerPage + 1;
    const to = Math.min(expensePage * expenseRowsPerPage, expenses.length);
    return { from, to, total: expenses.length };
  }, [expensePage, expenseRowsPerPage, expenses.length]);

  const goToExpensePage = (nextPage) => {
    setExpensePage((prev) => {
      const normalized = Number(nextPage);
      if (!Number.isFinite(normalized)) return prev;
      return Math.max(1, Math.min(totalExpensePages, Math.trunc(normalized)));
    });
  };

  const handleExpensesListScroll = useCallback((event) => {
    const currentTop = Number(event.currentTarget.scrollTop || 0);
    const previousTop = Number(listScrollTopRef.current || 0);
    const delta = currentTop - previousTop;
    const revealTopThreshold = 28;

    if (delta > 6 && currentTop > revealTopThreshold) {
      setFiltersBarVisible(false);
    } else if (delta < -6 && currentTop <= revealTopThreshold) {
      setFiltersBarVisible(true);
    }

    listScrollTopRef.current = currentTop;
  }, []);

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
    let cancelled = false;
    const cachedCategories = getCachedCategories(setId, undefined, sessionScope);
    if (cachedCategories.length > 0) {
      setCategories(cachedCategories);
    }

    if (!isOnline) {
      loadExpenses(filters);
      return () => {
        cancelled = true;
      };
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
    loadExpenses(filters);

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, sessionScope, setId]);

  useEffect(() => {
    setExpensePage(1);
  }, [setId]);

  useEffect(() => {
    setExpensePage((prev) => Math.min(prev, totalExpensePages));
  }, [totalExpensePages]);

  return (
    <main className="app-shell">
      <MobileHeader title={`Ver gastos: ${setName}`} backTo="/groups" />
      <section className="min-h-0 flex-1 overflow-hidden px-4 pb-2 pt-3">
        <div className= {`flex h-full min-h-0 flex-col gap-${filtersBarVisible ? "3" : "0"}`}>
          {/* {!isOnline ? (
            <p className="rounded-xl bg-app-warning px-3 py-2 text-sm font-semibold text-app-ink">
              Modo offline: se muestran gastos cacheados.
            </p>
          ) : null} */}
          <div
            className={`grid overflow-hidden transition-[max-height,opacity,transform] duration-200 linear ${
              filtersBarVisible
                ? 'max-h-[42rem] translate-y-0 opacity-100'
                : 'pointer-events-none max-h-0 -translate-y-2 opacity-0'
            }`}
          >
            <div className="rounded-2xl border-0 bg-app-panel p-3 pb-1">
              <button
                type="button"
                onClick={() => setFiltersOpen((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-lg border-0 border-app-ink/20  text-xs font-extrabold uppercase tracking-wide text-app-ink"
              >
                <span>Filtros</span>
                <span>{filtersOpen ? 'Ocultar' : 'Mostrar'}</span>
              </button>

              <div
                className={`grid overflow-hidden p-1 transition-all duration-300 ease-out ${
                  filtersOpen ? 'mt-3 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="min-h-0">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2 block">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-app-muted">Tipo</span>
                      <div className="mt-2">
                        <SingleChoiceButtons
                          value={filters.expense_type}
                          onChange={(value) => setFilters((prev) => ({ ...prev, expense_type: String(value) }))}
                          options={typeFilterOptions}
                          columns={4}
                          compact
                        />
                      </div>
                    </div>
                    <div className="col-span-2 block">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-app-muted">Forma pago</span>
                      <div className="mt-2">
                        <SingleChoiceButtons
                          value={filters.payment_method}
                          onChange={(value) => setFilters((prev) => ({ ...prev, payment_method: String(value) }))}
                          options={paymentFilterOptions}
                          columns={4}
                          compact
                        />
                      </div>
                    </div>
                    <div className="col-span-2 block">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-app-muted">Usuario</span>
                      <div className="mt-2">
                        <HorizontalScrollableChoice
                          value={filters.user_id}
                          onChange={(value) => setFilters((prev) => ({ ...prev, user_id: String(value) }))}
                          options={userFilterOptions}
                          itemMinWidth={86}
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
                    </div>
                    <label className="col-span-2 block">
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
                      <DateInputDmy
                        value={filters.from_date}
                        onChange={(nextValue) => setFilters((prev) => ({ ...prev, from_date: nextValue }))}
                        className="mt-1 app-input"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-app-muted">Hasta</span>
                      <DateInputDmy
                        value={filters.to_date}
                        onChange={(nextValue) => setFilters((prev) => ({ ...prev, to_date: nextValue }))}
                        className="mt-1 app-input"
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setExpensePage(1);
                      loadExpenses(filters);
                    }}
                    className="mt-3 w-full rounded-lg border border-app-ink/30 bg-app-mint px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-app-ink hover:bg-app-bg"
                  >
                    Aplicar filtros
                  </button>
                </div>
              </div>
            </div>
          </div>

          {!loading && expenses.length > 0 ? (
            <div className={`rounded-2xl border-0 bg-indigo-900 px-4 py-3 mb-${filtersBarVisible ? "0" : "3"}`}>
              <p className="text-[10px] font-bold uppercase tracking-wide text-app-muted">Total filtrado</p>
              <p className="mt-1 font-heading text-2xl font-bold text-app-ink">
                ${totalAmount.toLocaleString('es-AR')}
              </p>
            </div>
          ) : null}

          <div className="min-h-0 flex flex-1 flex-col rounded-2xl border-0 bg-app-panel/70 p-3">
            <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pr-1" onScroll={handleExpensesListScroll}>
              {loading ? <p className="text-sm font-semibold text-app-muted">Cargando gastos...</p> : null}
              {!loading && expenses.length === 0 ? (
                <p className="text-sm font-semibold text-app-muted">No hay gastos con esos filtros.</p>
              ) : null}
              {!loading &&
                paginatedExpenses.map((expense) => {
                  const type = getExpenseTypeById(expense.expense_type);
                  const payment = getPaymentMethodById(expense.payment_method);
                  const expenseDate = formatDateOnly(expense.expense_date);
                  return (
                    <article key={expense.id} className="rounded-xl border-0 bg-app-panel p-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-heading text-sm font-semibold uppercase text-app-ink">
                          {expense.category_name}
                        </p>
                        <p className="whitespace-nowrap text-lg font-extrabold text-app-ink">
                          ${Number(expense.amount || 0).toLocaleString('es-AR')}
                        </p>
                      </div>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-app-muted">
                        <span
                          className="inline-flex rounded-md px-2 py-1 text-app-ink"
                          style={{ backgroundColor: `rgb(var(${getExpenseTypeBgVarName(expense.expense_type)}))` }}
                        >
                          {type?.label || 'Sin tipo'}
                        </span>
                        {' | '}
                        <span
                          className="inline-flex rounded-md px-2 py-1 text-app-ink"
                          style={{ backgroundColor: `rgb(var(${getPaymentMethodBgVarName(expense.payment_method)}))` }}
                        >
                          {payment?.label || 'Sin forma pago'}
                        </span>
                        {' | '}
                        <span>{expenseDate}</span>
                      </p>
                      {expense.description ? (
                        <p className="mt-1 text-xs font-semibold text-app-muted">{expense.description}</p>
                      ) : null}
                    </article>
                  );
                })}
            </div>

            {!loading && expenses.length > 0 ? (
              <div className="mt-2 flex items-center justify-between gap-2 border-t border-app-ink/10 pt-2">
                <p className="text-[11px] font-semibold text-app-muted">
                  Mostrando {expensePageRange.from}-{expensePageRange.to} de {expensePageRange.total}
                </p>
                {totalExpensePages > 1 ? (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => goToExpensePage(expensePage - 1)}
                      disabled={expensePage <= 1}
                      className="app-pagination-edge-btn app-pagination-edge-btn-mobile"
                    >
                      <MonoIcon src={triangleUpIcon} colorVar="--app-ink" className="h-3.5 w-3.5 -rotate-90" />
                    </button>
                    <span className="app-pagination-mobile-counter">
                      {expensePage}/{totalExpensePages}
                    </span>
                    <button
                      type="button"
                      onClick={() => goToExpensePage(expensePage + 1)}
                      disabled={expensePage >= totalExpensePages}
                      className="app-pagination-edge-btn app-pagination-edge-btn-mobile"
                    >
                      <MonoIcon src={triangleUpIcon} colorVar="--app-ink" className="h-3.5 w-3.5 rotate-90" />
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {error ? (
            <p className="rounded-xl bg-app-error-bg px-3 py-2 text-sm font-semibold text-app-error-text">{error}</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
