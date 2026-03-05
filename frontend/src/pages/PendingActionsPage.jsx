import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileHeader from '../components/MobileHeader.jsx';
import BottomActionBar from '../components/BottomActionBar.jsx';
import MonoIcon from '../components/MonoIcon.jsx';
import closeLineIcon from '../assets/icons/close-line-icon.svg';
import { useAuth } from '../context/AuthContext.jsx';
import { useExpenseSync } from '../context/ExpenseSyncContext.jsx';
import { getExpenseTypeById, getPaymentMethodById } from '../constants/catalogs.js';
import { getCachedCategories } from '../lib/localCache.js';
import { resolveSessionScope } from '../lib/sessionScope.js';
import { getExpenseTypeBgVarName, getPaymentMethodBgVarName } from '../lib/uiColorSettings.js';

const INCOME_TYPE_OPTIONS = [
  { id: 1, label: 'Efectivo' },
  { id: 3, label: 'Debito' },
];

const isExpensePending = (action) => String(action?.type || '').toLowerCase() === 'expense.create';
const isIncomePending = (action) => String(action?.type || '').toLowerCase() === 'income.create';

const formatActionTypeLabel = (type) => {
  const normalized = String(type || '').trim().toLowerCase();
  const labels = {
    'set.create': 'Crear grupo',
    'set.update': 'Editar grupo',
    'set.delete': 'Eliminar grupo',
    'category.create': 'Crear categoria',
    'category.update': 'Editar categoria',
    'category.delete': 'Eliminar categoria',
    'expense.create': 'Crear gasto',
    'expense.update': 'Editar gasto',
    'expense.delete': 'Eliminar gasto',
    'income.create': 'Crear ingreso',
    'set.user.remove': 'Quitar usuario',
  };
  return labels[normalized] || type || 'Accion';
};

const formatQueuedDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDateOnly = (value) => {
  const rawValue = String(value || '');
  if (!rawValue) return '-';
  const dateMatch = rawValue.match(/\d{4}-\d{2}-\d{2}/);
  return dateMatch ? dateMatch[0] : rawValue;
};

const formatMoney = (value) => `$ ${Number(value || 0).toLocaleString('es-AR')}`;

const getExpensePayload = (action) =>
  action?.payload?.payload && typeof action.payload.payload === 'object' ? action.payload.payload : {};

export default function PendingActionsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { pendingActions, removePendingAction } = useExpenseSync();
  const sessionScope = resolveSessionScope(user);

  const orderedActions = useMemo(
    () => [...pendingActions].sort((a, b) => String(a.queuedAt || '').localeCompare(String(b.queuedAt || ''))),
    [pendingActions]
  );

  const setContextById = useMemo(() => {
    const map = new Map();
    orderedActions.forEach((action) => {
      const setId = Number(action?.payload?.setId);
      if (!Number.isInteger(setId) || setId <= 0 || map.has(setId)) return;
      map.set(setId, {
        categories: getCachedCategories(setId, undefined, sessionScope),
      });
    });
    return map;
  }, [orderedActions, sessionScope]);

  return (
    <main className="app-shell">
      <MobileHeader title="Acciones pendientes" backTo="/groups" />

      <section className="min-h-0 flex-1 overflow-hidden px-4 pb-2 pt-3">
        <div className="flex h-full min-h-0 flex-col gap-3">
          <div className="min-h-0 flex flex-1 flex-col rounded-2xl border-0 bg-app-panel/70 p-3">
            <div className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {orderedActions.length === 0 ? (
                <p className="text-sm font-semibold text-app-muted">No hay acciones pendientes.</p>
              ) : null}

              {orderedActions.map((action) => {
                const actionSetId = Number(action?.payload?.setId);
                const actionPayload = getExpensePayload(action);
                const actionCategories = setContextById.get(actionSetId)?.categories || [];
                const category = actionCategories.find(
                  (item) => Number(item.id) === Number(actionPayload.category_id)
                );
                const expenseTypeId = Number(category?.expense_type || 0);
                const paymentMethodId = Number(actionPayload.payment_method || actionPayload.income_type || 0);
                const isExpense = isExpensePending(action);
                const isIncome = isIncomePending(action);
                const amount = Number(actionPayload.amount || 0);
                const actionDate = isExpense
                  ? formatDateOnly(actionPayload.expense_date)
                  : formatDateOnly(actionPayload.income_date);
                const bottomDate = isExpense || isIncome ? actionDate : formatQueuedDate(action.queuedAt);
                const expenseTypeLabel = isExpense
                  ? (getExpenseTypeById(expenseTypeId)?.label || 'Sin tipo')
                  : '';
                const incomeTypeLabel = INCOME_TYPE_OPTIONS.find(
                  (option) => Number(option.id) === paymentMethodId
                )?.label || 'Sin tipo';
                const paymentLabel = getPaymentMethodById(paymentMethodId)?.label || 'Sin pago';
                const categoryLabel = isExpense ? (category?.name || 'Sin categoria') : 'No aplica';

                return (
                  <article key={action.id} className="rounded-xl border-0 bg-app-panel p-3 shadow-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-md font-bold uppercase tracking-wide text-app-muted">
                          {isExpense ? 'Gasto' : isIncome ? 'Ingreso' : 'Accion pendiente'}
                        </p>
                        {!isExpense && !isIncome ? (
                          <p className="mt-0.5 font-heading text-sm font-semibold uppercase text-app-ink">
                            {formatActionTypeLabel(action.type)}
                          </p>
                        ) : null}
                      </div>
                      <p className="text-xl font-extrabold  text-app-ink">
                        {formatMoney(amount)}
                      </p>
                    </div>

                    {isExpense ? (
                      <>
                        <p className="mt-1 text-sm font-semibold text-app-ink">{categoryLabel}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-app-muted">
                          <span
                            className="inline-flex rounded-md px-2 py-1 text-app-ink"
                            style={{ backgroundColor: `rgb(var(${getExpenseTypeBgVarName(expenseTypeId || 1)}))` }}
                          >
                            {expenseTypeLabel}
                          </span>
                          <span
                            className="inline-flex rounded-md px-2 py-1 text-app-ink"
                            style={{ backgroundColor: `rgb(var(${getPaymentMethodBgVarName(paymentMethodId || 1)}))` }}
                          >
                            {paymentLabel}
                          </span>
                        </div>
                      </>
                    ) : null}

                    {isIncome ? (
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-app-muted">
                        <span
                          className="inline-flex rounded-md px-2 py-1 text-app-ink"
                          style={{ backgroundColor: `rgb(var(${getPaymentMethodBgVarName(paymentMethodId || 1)}))` }}
                        >
                          {incomeTypeLabel}
                        </span>
                      </div>
                    ) : null}

                    {isExpense && actionPayload.description ? (
                      <p className="mt-1 text-xs font-semibold text-app-muted">{actionPayload.description}</p>
                    ) : null}

                    {(!isExpense && !isIncome) ? (
                      <p className="mt-1 text-xs font-semibold text-app-muted">
                        Set #{actionSetId || '-'} | En cola: {formatQueuedDate(action.queuedAt)}
                      </p>
                    ) : null}

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-app-muted">{bottomDate}</span>
                      <button
                        type="button"
                        onClick={() => {
                          removePendingAction(action.id);
                        }}
                        className="flex h-7 w-7 items-center justify-center p-1.5 transition hover:opacity-80"
                        title="Eliminar pendiente"
                      >
                        <MonoIcon src={closeLineIcon} colorVar="--app-icon-offline" className="h-3.5 w-3.5" />
                      </button>
                    </div>

                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <BottomActionBar label="Volver a grupos" borderless tone="logout" onClick={() => navigate('/groups')} />
    </main>
  );
}
