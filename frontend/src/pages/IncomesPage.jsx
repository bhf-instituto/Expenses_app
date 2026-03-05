import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import MobileHeader from '../components/MobileHeader.jsx';
import BottomActionBar from '../components/BottomActionBar.jsx';
import { ApiError, incomesApi, setsApi } from '../lib/apiClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { resolveSessionScope } from '../lib/sessionScope.js';
import { getCachedIncomes, getCachedSetUsers, setCachedIncomes, setCachedSetUsers } from '../lib/localCache.js';
import { getPaymentMethodBgVarName } from '../lib/uiColorSettings.js';

const INCOME_TYPE_OPTIONS = [
  { id: 1, label: 'Efectivo' },
  { id: 3, label: 'Debito' },
];

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
  const [incomePage, setIncomePage] = useState(1);
  const incomeRowsPerPage = MOBILE_ITEMS_PER_PAGE;

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

  const isAdmin = Number(resolvedRole) === 1;

  const totalIncomePages = useMemo(
    () => Math.max(1, Math.ceil(sortedIncomes.length / Math.max(1, incomeRowsPerPage))),
    [incomeRowsPerPage, sortedIncomes.length]
  );

  const paginatedIncomes = useMemo(() => {
    const startIndex = (incomePage - 1) * incomeRowsPerPage;
    const endIndex = startIndex + incomeRowsPerPage;
    return sortedIncomes.slice(startIndex, endIndex);
  }, [incomePage, incomeRowsPerPage, sortedIncomes]);

  const incomePageRange = useMemo(() => {
    if (sortedIncomes.length === 0) {
      return { from: 0, to: 0, total: 0 };
    }
    const from = (incomePage - 1) * incomeRowsPerPage + 1;
    const to = Math.min(incomePage * incomeRowsPerPage, sortedIncomes.length);
    return { from, to, total: sortedIncomes.length };
  }, [incomePage, incomeRowsPerPage, sortedIncomes.length]);

  const goToIncomePage = (nextPage) => {
    setIncomePage((prev) => {
      const normalized = Number(nextPage);
      if (!Number.isFinite(normalized)) return prev;
      return Math.max(1, Math.min(totalIncomePages, Math.trunc(normalized)));
    });
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIncomePage((prev) => Math.min(prev, totalIncomePages));
  }, [totalIncomePages]);

  const actionLabel = resolvedRole === null
    ? 'Cargando permisos...'
    : !isAdmin
    ? 'Solo admin puede crear ingresos'
    : isOnline
    ? 'Crear ingreso'
    : 'Crear ingreso (offline)';

  return (
    <main className="app-shell">
      <MobileHeader title={`Ingresos: ${setName}`} backTo="/groups" />
      <section className="min-h-0 flex-1 overflow-hidden px-4 pb-2 pt-3">
        <div className="flex h-full min-h-0 flex-col gap-3">
          {!isOnline ? (
            <p className="rounded-xl bg-app-warning px-3 py-2 text-sm font-semibold text-app-ink">
              Modo offline: se muestran ingresos cacheados.
            </p>
          ) : null}
          {flashMessage ? (
            <p className="rounded-xl bg-app-success-bg px-3 py-2 text-sm font-semibold text-app-success-text">
              {flashMessage}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-xl bg-app-error-bg px-3 py-2 text-sm font-semibold text-app-error-text">{error}</p>
          ) : null}

          <div className="min-h-0 flex flex-1 flex-col rounded-2xl border-0 bg-app-panel/70 p-3">
            <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {loading ? <p className="text-sm font-semibold text-app-muted">Cargando ingresos...</p> : null}
              {!loading && sortedIncomes.length === 0 ? (
                <p className="text-sm font-semibold text-app-muted">No hay ingresos cargados.</p>
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

            {!loading && sortedIncomes.length > 0 ? (
              <div className="mt-2 flex items-center justify-between gap-2 border-t border-app-ink/10 pt-2">
                <p className="text-[11px] font-semibold text-app-muted">
                  Mostrando {incomePageRange.from}-{incomePageRange.to} de {incomePageRange.total}
                </p>
                {totalIncomePages > 1 ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => goToIncomePage(1)}
                      disabled={incomePage <= 1}
                      className="rounded-md bg-app-panel px-1.5 py-1 text-[11px] font-extrabold text-app-ink disabled:opacity-40"
                    >
                      {'<<'}
                    </button>
                    <button
                      type="button"
                      onClick={() => goToIncomePage(incomePage - 1)}
                      disabled={incomePage <= 1}
                      className="rounded-md bg-app-panel px-1.5 py-1 text-[11px] font-extrabold text-app-ink disabled:opacity-40"
                    >
                      {'<'}
                    </button>
                    <span className="min-w-7 rounded-md bg-app-ink px-2 py-1 text-center text-[11px] font-extrabold text-app-bg">
                      {incomePage}
                    </span>
                    <button
                      type="button"
                      onClick={() => goToIncomePage(incomePage + 1)}
                      disabled={incomePage >= totalIncomePages}
                      className="rounded-md bg-app-panel px-1.5 py-1 text-[11px] font-extrabold text-app-ink disabled:opacity-40"
                    >
                      {'>'}
                    </button>
                    <button
                      type="button"
                      onClick={() => goToIncomePage(totalIncomePages)}
                      disabled={incomePage >= totalIncomePages}
                      className="rounded-md bg-app-panel px-1.5 py-1 text-[11px] font-extrabold text-app-ink disabled:opacity-40"
                    >
                      {'>>'}
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
