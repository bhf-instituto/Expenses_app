import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import MobileHeader from '../components/MobileHeader.jsx';
import BottomActionBar from '../components/BottomActionBar.jsx';
import SingleChoiceButtons from '../components/SingleChoiceButtons.jsx';
import { ApiError, incomesApi, setsApi } from '../lib/apiClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useExpenseSync } from '../context/ExpenseSyncContext.jsx';
import { formatAmountInput, parseAmountInput } from '../lib/amountFormat.js';
import { resolveSessionScope } from '../lib/sessionScope.js';
import { getCachedIncomes, getCachedSetUsers, setCachedIncomes, setCachedSetUsers } from '../lib/localCache.js';
import { getPaymentMethodBgVarName } from '../lib/uiColorSettings.js';

const INCOME_TYPE_OPTIONS = [
  { id: 1, label: 'Efectivo' },
  { id: 3, label: 'Debito' },
];

const createTempId = () => -Math.floor(Date.now() + Math.random() * 100000);
const todayDate = new Date().toISOString().slice(0, 10);

const defaultIncomeForm = {
  income_type: '',
  amount: '',
  income_date: todayDate,
};

export default function CreateIncomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setId } = useParams();
  const { isOnline, user } = useAuth();
  const { queueAction } = useExpenseSync();
  const sessionScope = resolveSessionScope(user);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [resolvedRole, setResolvedRole] = useState(() => {
    const incomingRole = Number(location.state?.role);
    return Number.isInteger(incomingRole) ? incomingRole : null;
  });
  const [incomeForm, setIncomeForm] = useState(defaultIncomeForm);

  const setName = location.state?.setName || `Grupo ${setId}`;
  const isAdmin = Number(resolvedRole) === 1;
  const canSubmitIncome =
    Number.isInteger(parseAmountInput(incomeForm.amount))
    && parseAmountInput(incomeForm.amount) > 0
    && [1, 3].includes(Number(incomeForm.income_type))
    && Boolean(String(incomeForm.income_date || '').trim());

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

  const upsertIncomeLocal = (nextIncome) => {
    const existing = getCachedIncomes(setId, sessionScope);
    const next = [nextIncome, ...existing.filter((item) => Number(item.id) !== Number(nextIncome.id))];
    setCachedIncomes(setId, next, sessionScope);
  };

  const submitIncome = async () => {
    if (submitting) return;
    if (!isAdmin) {
      setError('Solo administradores pueden cargar ingresos.');
      return;
    }

    const incomeType = Number(incomeForm.income_type);
    const amount = parseAmountInput(incomeForm.amount);
    const incomeDate = String(incomeForm.income_date || '').trim();

    if (![1, 3].includes(incomeType)) {
      setError('Debes seleccionar un tipo de ingreso.');
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

    const payload = {
      income_type: incomeType,
      amount,
      income_date: incomeDate,
    };

    try {
      if (!isOnline) {
        const tempIncomeId = createTempId();
        const queuedIncome = {
          id: tempIncomeId,
          ...payload,
          pending_sync: true,
        };
        upsertIncomeLocal(queuedIncome);
        queueAction({
          type: 'income.create',
          payload: {
            setId: Number(setId),
            payload,
            tempIncomeId,
          },
        });

        navigate(`/sets/${setId}/incomes`, {
          replace: true,
          state: {
            setName,
            role: resolvedRole,
            flash: 'Ingreso pendiente.',
          },
        });
        return;
      }

      const data = await incomesApi.create(setId, payload);
      const createdIncome = {
        id: Number(data?.id),
        income_type: Number(data?.income_type ?? payload.income_type),
        amount: Number(data?.amount ?? payload.amount),
        income_date: String(data?.income_date ?? payload.income_date),
      };
      upsertIncomeLocal(createdIncome);

      navigate(`/sets/${setId}/incomes`, {
        replace: true,
        state: {
          setName,
          role: resolvedRole,
          flash: 'Ingreso guardado.',
        },
      });
    } catch (requestError) {
      const message =
        requestError instanceof ApiError ? requestError.message : 'No se pudo guardar el ingreso';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const actionLabel = submitting
    ? 'Guardando...'
    : resolvedRole === null
    ? 'Cargando permisos...'
    : !isAdmin
    ? 'Solo admin puede crear ingresos'
    : 'Guardar ingreso';

  return (
    <main className="app-shell">
      <MobileHeader title={`Crear ingreso: ${setName}`} backTo={`/sets/${setId}/incomes`} />
      <section className="min-h-0 flex-1 overflow-hidden px-4 pb-2 pt-3">
        <div className="flex h-full min-h-0 flex-col gap-3">
          {/* {!isOnline ? (
            <p className="rounded-xl bg-app-warning px-3 py-2 text-sm font-semibold text-app-ink">
              Modo offline: el ingreso se guardara en cola para sincronizar despues.
            </p>
          ) : null} */}

          {error ? (
            <p className="rounded-xl bg-app-error-bg px-3 py-2 text-sm font-semibold text-app-error-text">{error}</p>
          ) : null}

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
                    options={INCOME_TYPE_OPTIONS.map((item) => ({
                      value: String(item.id),
                      label: item.label,
                      bgColorVar: getPaymentMethodBgVarName(item.id),
                    }))}
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
            </div>
          </div>
        </div>
      </section>

      <BottomActionBar
        label={actionLabel}
        disabled={submitting || !isAdmin || resolvedRole === null || !canSubmitIncome}
        borderless
        tone="success"
        onClick={submitIncome}
      />
    </main>
  );
}
