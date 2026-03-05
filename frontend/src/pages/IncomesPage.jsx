import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import MobileHeader from '../components/MobileHeader.jsx';
import BottomActionBar from '../components/BottomActionBar.jsx';
import SingleChoiceButtons from '../components/SingleChoiceButtons.jsx';
import { ApiError, incomesApi, setsApi } from '../lib/apiClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { resolveSessionScope } from '../lib/sessionScope.js';
import { formatAmountInput, parseAmountInput } from '../lib/amountFormat.js';
import {
  getCachedIncomes,
  getCachedSetUsers,
  setCachedIncomes,
  setCachedSetUsers,
} from '../lib/localCache.js';
import { getPaymentMethodBgVarName } from '../lib/uiColorSettings.js';

const INCOME_TYPE_OPTIONS = [
  { id: 1, label: 'Efectivo' },
  { id: 3, label: 'Debito' },
];

const todayDate = new Date().toISOString().slice(0, 10);
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

const defaultIncomeForm = {
  income_type: '1',
  amount: '',
  income_date: todayDate,
};

export default function IncomesPage() {
  const location = useLocation();
  const { setId } = useParams();
  const { isOnline, user } = useAuth();
  const sessionScope = resolveSessionScope(user);

  const [incomes, setIncomes] = useState(() => getCachedIncomes(setId, sessionScope));
  const [loading, setLoading] = useState(() => getCachedIncomes(setId, sessionScope).length === 0);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [incomeForm, setIncomeForm] = useState(defaultIncomeForm);
  const [resolvedRole, setResolvedRole] = useState(() => {
    const incomingRole = Number(location.state?.role);
    return Number.isInteger(incomingRole) ? incomingRole : null;
  });
  const [incomePage, setIncomePage] = useState(1);
  const incomeRowsPerPage = MOBILE_ITEMS_PER_PAGE;

  const setName = location.state?.setName || `Grupo ${setId}`;

  const sortedIncomes = useMemo(() => {
    const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });
    return [...incomes].sort((a, b) => {
      const dateCompare = collator.compare(formatDateOnly(b.income_date), formatDateOnly(a.income_date));
      if (dateCompare !== 0) return dateCompare;
      return Number(b.id || 0) - Number(a.id || 0);
    });
  }, [incomes]);

  const isAdmin = Number(resolvedRole) === 1;
  const canManageIncomes = isOnline && isAdmin;

  const incomeTypeChoiceOptions = useMemo(
    () =>
      INCOME_TYPE_OPTIONS.map((item) => ({
        value: String(item.id),
        label: item.label,
        bgColorVar: getPaymentMethodBgVarName(item.id),
      })),
    []
  );

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

  const openCreateForm = () => {
    if (!canManageIncomes) {
      setError(!isOnline ? 'La carga de ingresos esta disponible solo online.' : 'Solo administradores pueden cargar ingresos.');
      return;
    }

    setIncomeForm({
      ...defaultIncomeForm,
      income_date: todayDate,
    });
    setError('');
    setFormOpen(true);
  };

  const closeIncomeForm = () => {
    setFormOpen(false);
    setIncomeForm({
      ...defaultIncomeForm,
      income_date: todayDate,
    });
    setError('');
  };

  const upsertIncomeLocal = (nextIncome) => {
    setIncomes((prev) => {
      const next = [nextIncome, ...prev.filter((item) => Number(item.id) !== Number(nextIncome.id))];
      setCachedIncomes(setId, next, sessionScope);
      return next;
    });
  };

  const submitIncome = async () => {
    if (submitting) return;
    if (!canManageIncomes) {
      setError(!isOnline ? 'La carga de ingresos esta disponible solo online.' : 'Solo administradores pueden cargar ingresos.');
      return;
    }

    const incomeType = Number(incomeForm.income_type);
    const amount = parseAmountInput(incomeForm.amount);
    const incomeDate = String(incomeForm.income_date || '').trim();

    if (![1, 3].includes(incomeType)) {
      setError('Tipo de ingreso invalido.');
      return;
    }
    if (!Number.isInteger(amount) || amount <= 0) {
      setError('El monto debe ser un entero positivo.');
      return;
    }
    if (!incomeDate) {
      setError('Debes seleccionar una fecha.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        income_type: incomeType,
        amount,
        income_date: incomeDate,
      };

      const data = await incomesApi.create(setId, payload);
      upsertIncomeLocal(data);

      setIncomePage(1);
      closeIncomeForm();
    } catch (requestError) {
      const message =
        requestError instanceof ApiError ? requestError.message : 'No se pudo guardar el ingreso';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const actionLabel = !isOnline
    ? 'Ingresos solo online'
    : resolvedRole === null
    ? 'Cargando permisos...'
    : !isAdmin
    ? 'Solo admin puede crear ingresos'
    : formOpen
    ? 'Cerrar formulario'
    : 'Crear ingreso';

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

          {formOpen ? (
            <div className="rounded-2xl border-0 bg-app-panel p-4">
              <div className="space-y-3">
                <div className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Tipo ingreso</span>
                  <div className="mt-2">
                    <SingleChoiceButtons
                      value={incomeForm.income_type}
                      onChange={(value) =>
                        setIncomeForm((prev) => ({
                          ...prev,
                          income_type: String(value),
                        }))
                      }
                      options={incomeTypeChoiceOptions}
                      columns={2}
                    />
                  </div>
                </div>

                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Monto</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9.]*"
                    value={incomeForm.amount}
                    onChange={(event) =>
                      setIncomeForm((prev) => ({
                        ...prev,
                        amount: formatAmountInput(event.target.value),
                      }))
                    }
                    className="mt-1 app-input"
                    placeholder="10.000"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Fecha</span>
                  <input
                    type="date"
                    value={incomeForm.income_date}
                    onChange={(event) =>
                      setIncomeForm((prev) => ({
                        ...prev,
                        income_date: event.target.value,
                      }))
                    }
                    className="mt-1 app-input"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={closeIncomeForm}
                    className="rounded-lg bg-app-panel px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-app-muted"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={submitIncome}
                    disabled={submitting}
                    className="rounded-lg bg-app-sky px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-app-ink disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {submitting ? 'Guardando...' : 'Guardar ingreso'}
                  </button>
                </div>
              </div>
            </div>
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

          {error ? (
            <p className="rounded-xl bg-app-error-bg px-3 py-2 text-sm font-semibold text-app-error-text">{error}</p>
          ) : null}
        </div>
      </section>

      <BottomActionBar
        label={actionLabel}
        disabled={!isOnline || !isAdmin || resolvedRole === null}
        borderless
        onClick={() => {
          if (formOpen) {
            closeIncomeForm();
            return;
          }
          openCreateForm();
        }}
      />
    </main>
  );
}




