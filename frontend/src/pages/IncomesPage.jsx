import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import MobileHeader from '../components/MobileHeader.jsx';
import BottomActionBar from '../components/BottomActionBar.jsx';
import SingleChoiceButtons from '../components/SingleChoiceButtons.jsx';
import MonoIcon from '../components/MonoIcon.jsx';
import DateInputDmy from '../components/DateInputDmy.jsx';
import triangleUpIcon from '../assets/icons/triangle-up-icon.svg';
import { ApiError, incomesApi, setsApi } from '../lib/apiClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { resolveSessionScope } from '../lib/sessionScope.js';
import { getCachedIncomes, getCachedSetUsers, setCachedIncomes, setCachedSetUsers } from '../lib/localCache.js';
import { getPaymentMethodBgVarName } from '../lib/uiColorSettings.js';

const INCOME_TYPE_OPTIONS = [
  { id: 1, label: 'Efectivo' },
  { id: 3, label: 'Debito' },
];

const INCOME_TYPE_FILTER_OPTIONS = [
  { value: '', label: 'Todos' },
  ...INCOME_TYPE_OPTIONS.map((item) => ({
    value: String(item.id),
    label: item.label,
    bgColorVar: getPaymentMethodBgVarName(item.id),
  })),
];

const DEFAULT_INCOME_FILTERS = {
  income_type: '',
  from_date: '',
  to_date: '',
};

const MOBILE_ITEMS_PER_PAGE = 30;

const formatDateOnly = (value) => {
  const rawValue = String(value || '');
  if (!rawValue) return '-';
  const dateMatch = rawValue.match(/\d{4}-\d{2}-\d{2}/);
  return dateMatch ? dateMatch[0] : rawValue;
};

const formatMoney = (value) => `$ ${Number(value || 0).toLocaleString('es-AR')}`;

const getIncomeTypeLabel = (incomeType) =>
  INCOME_TYPE_OPTIONS.find((item) => Number(item.id) === Number(incomeType))?.label || 'Desconocido';

const hasActiveFilters = (filters) =>
  Object.values(filters).some((value) => String(value || '').trim() !== '');

const applyLocalIncomeFilters = (rows, currentFilters) =>
  rows.filter((income) => {
    if (currentFilters.income_type && String(income.income_type) !== String(currentFilters.income_type)) {
      return false;
    }

    const incomeDate = formatDateOnly(income.income_date);
    if (currentFilters.from_date && incomeDate < currentFilters.from_date) {
      return false;
    }
    if (currentFilters.to_date && incomeDate > currentFilters.to_date) {
      return false;
    }

    return true;
  });

export default function IncomesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setId } = useParams();
  const { isOnline, user } = useAuth();
  const sessionScope = resolveSessionScope(user);

  const [incomes, setIncomes] = useState(() => getCachedIncomes(setId, sessionScope));
  const [loading, setLoading] = useState(() => getCachedIncomes(setId, sessionScope).length === 0);
  const [error, setError] = useState('');
  const [resolvedRole, setResolvedRole] = useState(() => {
    const incomingRole = Number(location.state?.role);
    return Number.isInteger(incomingRole) ? incomingRole : null;
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filtersBarVisible, setFiltersBarVisible] = useState(true);
  const [filtersDraft, setFiltersDraft] = useState({ ...DEFAULT_INCOME_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState({ ...DEFAULT_INCOME_FILTERS });
  const [incomePage, setIncomePage] = useState(1);
  const incomeRowsPerPage = MOBILE_ITEMS_PER_PAGE;
  const incomeListContainerRef = useRef(null);
  const listScrollTopRef = useRef(0);

  const setName = location.state?.setName || `Grupo ${setId}`;
  const flashMessage = String(location.state?.flash || '').trim();

  const sortedIncomes = useMemo(() => {
    const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });
    return [...incomes].sort((a, b) => {
      const dateCompare = collator.compare(formatDateOnly(b.income_date), formatDateOnly(a.income_date));
      if (dateCompare !== 0) return dateCompare;
      return Number(b.id || 0) - Number(a.id || 0);
    });
  }, [incomes]);

  const filteredIncomes = useMemo(
    () => applyLocalIncomeFilters(sortedIncomes, appliedFilters),
    [appliedFilters, sortedIncomes]
  );

  const filteredTotalAmount = useMemo(
    () => filteredIncomes.reduce((sum, income) => sum + Number(income.amount || 0), 0),
    [filteredIncomes]
  );

  const isAdmin = Number(resolvedRole) === 1;
  const hasAppliedIncomeFilters = useMemo(() => hasActiveFilters(appliedFilters), [appliedFilters]);

  const totalIncomePages = useMemo(
    () => Math.max(1, Math.ceil(filteredIncomes.length / Math.max(1, incomeRowsPerPage))),
    [filteredIncomes.length, incomeRowsPerPage]
  );

  const paginatedIncomes = useMemo(() => {
    const startIndex = (incomePage - 1) * incomeRowsPerPage;
    const endIndex = startIndex + incomeRowsPerPage;
    return filteredIncomes.slice(startIndex, endIndex);
  }, [filteredIncomes, incomePage, incomeRowsPerPage]);

  const incomePageRange = useMemo(() => {
    if (filteredIncomes.length === 0) {
      return { from: 0, to: 0, total: 0 };
    }
    const from = (incomePage - 1) * incomeRowsPerPage + 1;
    const to = Math.min(incomePage * incomeRowsPerPage, filteredIncomes.length);
    return { from, to, total: filteredIncomes.length };
  }, [filteredIncomes.length, incomePage, incomeRowsPerPage]);

  const goToIncomePage = (nextPage) => {
    const normalized = Number(nextPage);
    if (!Number.isFinite(normalized)) return;
    const clamped = Math.max(1, Math.min(totalIncomePages, Math.trunc(normalized)));
    setIncomePage((prev) => (prev === clamped ? prev : clamped));
    if (incomeListContainerRef.current) {
      incomeListContainerRef.current.scrollTop = 0;
    }
    listScrollTopRef.current = 0;
  };

  const handleIncomeListScroll = useCallback((event) => {
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

  const applyFilters = () => {
    setAppliedFilters({ ...filtersDraft });
    setIncomePage(1);
    if (incomeListContainerRef.current) {
      incomeListContainerRef.current.scrollTop = 0;
    }
    listScrollTopRef.current = 0;
  };

  const fetchAllIncomesForSet = useCallback(async (currentSetId) => {
    const pageSize = 100;
    const maxPages = 1000;
    const allRows = [];

    for (let page = 1; page <= maxPages; page += 1) {
      const batch = await incomesApi.getAll(currentSetId, { page, limit: pageSize });
      const rows = Array.isArray(batch) ? batch : [];
      allRows.push(...rows);

      if (rows.length < pageSize) {
        break;
      }
    }

    return allRows;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const cachedIncomes = getCachedIncomes(setId, sessionScope);
    if (!cancelled) {
      if (cachedIncomes.length > 0) {
        setIncomes(cachedIncomes);
      }
      setLoading(cachedIncomes.length === 0);
      setError('');
    }

    if (!isOnline) {
      if (!cancelled) {
        setLoading(false);
      }
      return () => {
        cancelled = true;
      };
    }

    const loadIncomes = async () => {
      try {
        const rows = await fetchAllIncomesForSet(setId);
        if (!cancelled) {
          setIncomes(rows);
          setCachedIncomes(setId, rows, sessionScope);
          setLoading(false);
        }
      } catch (requestError) {
        if (!cancelled) {
          const message =
            requestError instanceof ApiError ? requestError.message : 'No se pudieron cargar los ingresos';
          setError(message);
          setLoading(false);
        }
      }
    };

    loadIncomes();

    return () => {
      cancelled = true;
    };
  }, [fetchAllIncomesForSet, isOnline, sessionScope, setId]);

  useEffect(() => {
    if (resolvedRole !== null) return;

    const cachedUsers = getCachedSetUsers(setId, sessionScope);
    const cachedCurrentUser = cachedUsers.find((item) => Number(item.id) === Number(user?.id));
    if (cachedCurrentUser) {
      setResolvedRole(Number(cachedCurrentUser.role));
      return;
    }

    if (!isOnline) return;

    let cancelled = false;

    const loadUsers = async () => {
      try {
        const data = await setsApi.getUsers(setId);
        const users = data?.users || [];
        if (cancelled) return;
        setCachedSetUsers(setId, users, sessionScope);
        const currentUser = users.find((item) => Number(item.id) === Number(user?.id));
        if (currentUser) {
          setResolvedRole(Number(currentUser.role));
        }
      } catch {
        // no-op
      }
    };

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, [isOnline, resolvedRole, sessionScope, setId, user?.id]);

  useEffect(() => {
    setIncomePage((prev) => Math.min(prev, totalIncomePages));
  }, [totalIncomePages]);

  useEffect(() => {
    setIncomePage(1);
    setFiltersOpen(false);
    setFiltersBarVisible(true);
    setFiltersDraft({ ...DEFAULT_INCOME_FILTERS });
    setAppliedFilters({ ...DEFAULT_INCOME_FILTERS });
    listScrollTopRef.current = 0;
  }, [setId]);

  const actionLabel = resolvedRole === null
    ? 'Cargando permisos...'
    : !isAdmin
    ? 'Solo admin puede crear ingresos'
    : isOnline
    ? 'Crear ingreso'
    : 'Crear ingreso';

  return (
    <main className="app-shell">
      <MobileHeader title={`Ingresos: ${setName}`} backTo="/groups" />
      <section className="min-h-0 flex-1 overflow-hidden px-4 pb-2 pt-3">
        <div className={`flex h-full min-h-0 flex-col ${filtersBarVisible ? 'gap-3' : 'gap-0'}`}>
          {flashMessage ? (
            <p className="rounded-xl bg-app-success-bg px-3 py-2 text-sm font-semibold text-app-success-text">
              {flashMessage}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-xl bg-app-error-bg px-3 py-2 text-sm font-semibold text-app-error-text">{error}</p>
          ) : null}

          <div
            className={`grid overflow-hidden transition-[max-height,opacity,transform] duration-200 linear ${
              filtersBarVisible
                ? 'max-h-[32rem] translate-y-0 opacity-100'
                : 'pointer-events-none max-h-0 -translate-y-2 opacity-0'
            }`}
          >
            <div className="rounded-2xl border-0 bg-app-panel p-3 pb-1">
              <button
                type="button"
                onClick={() => setFiltersOpen((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-lg border-0 border-app-ink/20 text-xs font-extrabold uppercase tracking-wide text-app-ink"
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
                      <span className="text-[10px] font-bold uppercase tracking-wide text-app-muted">
                        Tipo ingreso
                      </span>
                      <div className="mt-2">
                        <SingleChoiceButtons
                          value={filtersDraft.income_type}
                          onChange={(value) =>
                            setFiltersDraft((prev) => ({ ...prev, income_type: String(value) }))
                          }
                          options={INCOME_TYPE_FILTER_OPTIONS}
                          columns={3}
                          compact
                        />
                      </div>
                    </div>
                    <label className="block">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-app-muted">Desde</span>
                      <DateInputDmy
                        value={filtersDraft.from_date}
                        onChange={(nextValue) => setFiltersDraft((prev) => ({ ...prev, from_date: nextValue }))}
                        className="mt-1 app-input"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-app-muted">Hasta</span>
                      <DateInputDmy
                        value={filtersDraft.to_date}
                        onChange={(nextValue) => setFiltersDraft((prev) => ({ ...prev, to_date: nextValue }))}
                        className="mt-1 app-input"
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={applyFilters}
                    className="mt-3 w-full rounded-lg border border-app-ink/30 bg-app-mint px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-app-ink hover:bg-app-bg"
                  >
                    Aplicar filtros
                  </button>
                </div>
              </div>
            </div>
          </div>

          {!loading && filteredIncomes.length > 0 ? (
            <div className={`rounded-2xl border-0 bg-indigo-900 px-4 py-3 ${filtersBarVisible ? 'mb-0' : 'mb-3'}`}>
              <p className="text-[10px] font-bold uppercase tracking-wide text-app-muted">Total filtrado</p>
              <p className="mt-1 font-heading text-2xl font-bold text-app-ink">
                ${filteredTotalAmount.toLocaleString('es-AR')}
              </p>
            </div>
          ) : null}

          <div className="min-h-0 flex flex-1 flex-col rounded-2xl border-0 bg-app-panel/70 p-3">
            <div
              ref={incomeListContainerRef}
              className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pr-1"
              onScroll={handleIncomeListScroll}
            >
              {loading ? <p className="text-sm font-semibold text-app-muted">Cargando ingresos...</p> : null}
              {!loading && filteredIncomes.length === 0 ? (
                <p className="text-sm font-semibold text-app-muted">
                  {hasAppliedIncomeFilters ? 'No hay ingresos con esos filtros.' : 'No hay ingresos cargados.'}
                </p>
              ) : null}

              {!loading &&
                paginatedIncomes.map((income) => (
                  <article key={income.id} className="rounded-xl border-0 bg-app-panel p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-app-muted">
                        Tipo ingreso
                      </p>
                      <p className="text-lg font-extrabold text-app-ink">{formatMoney(income.amount)}</p>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <span
                        className="inline-flex rounded-md px-2 py-1 text-[11px] font-semibold uppercase text-app-ink"
                        style={{ backgroundColor: `rgb(var(${getPaymentMethodBgVarName(income.income_type)}))` }}
                      >
                        {getIncomeTypeLabel(income.income_type)}
                      </span>
                      <span className="text-xs font-semibold text-app-muted">{formatDateOnly(income.income_date)}</span>
                    </div>
                  </article>
                ))}
            </div>

            {!loading && filteredIncomes.length > 0 ? (
              <div className="mt-2 flex items-center justify-between gap-2 border-t border-app-ink/10 pt-2">
                <p className="text-[11px] font-semibold text-app-muted">
                  Mostrando {incomePageRange.from}-{incomePageRange.to} de {incomePageRange.total}
                </p>
                {totalIncomePages > 1 ? (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => goToIncomePage(incomePage - 1)}
                      disabled={incomePage <= 1}
                      className="app-pagination-edge-btn app-pagination-edge-btn-mobile"
                    >
                      <MonoIcon src={triangleUpIcon} colorVar="--app-ink" className="h-3.5 w-3.5 -rotate-90" />
                    </button>
                    <span className="app-pagination-mobile-counter">
                      {incomePage}/{totalIncomePages}
                    </span>
                    <button
                      type="button"
                      onClick={() => goToIncomePage(incomePage + 1)}
                      disabled={incomePage >= totalIncomePages}
                      className="app-pagination-edge-btn app-pagination-edge-btn-mobile"
                    >
                      <MonoIcon src={triangleUpIcon} colorVar="--app-ink" className="h-3.5 w-3.5 rotate-90" />
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <BottomActionBar
        label={actionLabel}
        disabled={!isAdmin || resolvedRole === null}
        borderless
        onClick={() =>
          navigate(`/sets/${setId}/incomes/new`, {
            state: {
              setName,
              role: resolvedRole,
            },
          })
        }
      />
    </main>
  );
}
