import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import MobileHeader from '../components/MobileHeader.jsx';
import BottomActionBar from '../components/BottomActionBar.jsx';
import HorizontalScrollableChoice from '../components/HorizontalScrollableChoice.jsx';
import SingleChoiceButtons from '../components/SingleChoiceButtons.jsx';
import { ApiError, expensesApi, setsApi } from '../lib/apiClient.js';
import { PAYMENT_METHODS, getExpenseTypeByKey } from '../constants/catalogs.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useExpenseSync } from '../context/ExpenseSyncContext.jsx';
import { getCachedSetUsers, setCachedSetUsers } from '../lib/localCache.js';

const todayDate = new Date().toISOString().slice(0, 10);
const getEmailAlias = (email) => String(email || '').split('@')[0] || email;

export default function CreateExpensePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOnline, user } = useAuth();
  const { queueExpense } = useExpenseSync();
  const { setId, typeKey, categoryId } = useParams();
  const expenseType = getExpenseTypeByKey(typeKey);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(1);
  const [selectedCreatorId, setSelectedCreatorId] = useState(() => Number(user?.id));
  const [groupUsers, setGroupUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(todayDate);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const setName = location.state?.setName || `Grupo ${setId}`;
  const categoryName = location.state?.categoryName || `Categoria ${categoryId}`;
  const backToCategories = `/sets/${setId}/categories/${typeKey}`;

  const payload = useMemo(
    () => ({
      category_id: Number(categoryId),
      user_id: Number(selectedCreatorId || user?.id),
      amount: Number(amount),
      payment_method: Number(paymentMethod),
      description: description.trim() || null,
      expense_date: expenseDate,
    }),
    [categoryId, selectedCreatorId, user?.id, amount, paymentMethod, description, expenseDate]
  );

  const paymentMethodOptions = useMemo(
    () =>
      PAYMENT_METHODS.map((method) => ({
        value: method.id,
        label: method.shortLabel || method.label,
      })),
    []
  );

  const creatorOptions = useMemo(() => {
    const currentUserId = Number(user?.id);
    const meOption = Number.isInteger(currentUserId)
      ? [{ value: currentUserId, label: 'Yo' }]
      : [];

    const others = groupUsers
      .filter((item) => Number(item.id) !== currentUserId)
      .map((item) => ({
        value: Number(item.id),
        label: getEmailAlias(item.email),
      }));

    return [...meOption, ...others];
  }, [groupUsers, user?.id]);

  useEffect(() => {
    const currentUserId = Number(user?.id);
    if (Number.isInteger(currentUserId)) {
      setSelectedCreatorId((prev) => (Number.isInteger(Number(prev)) ? Number(prev) : currentUserId));
    }
  }, [user?.id]);

  useEffect(() => {
    if (creatorOptions.length === 0) return;
    const hasSelected = creatorOptions.some((option) => Number(option.value) === Number(selectedCreatorId));
    if (!hasSelected) {
      setSelectedCreatorId(Number(creatorOptions[0].value));
    }
  }, [creatorOptions, selectedCreatorId]);

  useEffect(() => {
    let cancelled = false;

    const loadSetUsers = async () => {
      setUsersError('');
      setUsersLoading(true);

      const cachedUsers = getCachedSetUsers(setId);
      if (cachedUsers.length > 0 && !cancelled) {
        setGroupUsers(cachedUsers);
      }

      if (!isOnline) {
        if (!cancelled) {
          setUsersLoading(false);
        }
        return;
      }

      try {
        const data = await setsApi.getUsers(setId);
        const users = data?.users || [];
        if (!cancelled) {
          setGroupUsers(users);
          setCachedSetUsers(setId, users);
        }
      } catch (requestError) {
        if (!cancelled) {
          const message =
            requestError instanceof ApiError ? requestError.message : 'No se pudieron cargar los usuarios del grupo';
          setUsersError(message);
        }
      } finally {
        if (!cancelled) {
          setUsersLoading(false);
        }
      }
    };

    loadSetUsers();

    return () => {
      cancelled = true;
    };
  }, [setId, isOnline]);

  const submitExpense = async () => {
    if (submitting) return;

    const numericAmount = Number(amount);
    if (!Number.isInteger(numericAmount) || numericAmount <= 0) {
      setError('El monto debe ser un entero positivo.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (isOnline) {
        await expensesApi.create(setId, payload);
        navigate(`/sets/${setId}/types`, {
          replace: true,
          state: { setName, flash: 'Gasto creado correctamente.' },
        });
      } else {
        queueExpense({ setId, payload });
        navigate(`/sets/${setId}/types`, {
          replace: true,
          state: { setName, flash: 'Gasto guardado offline. Se enviara automaticamente al reconectar.' },
        });
      }
    } catch (requestError) {
      const message =
        requestError instanceof ApiError ? requestError.message : 'No se pudo guardar el gasto';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!expenseType) {
    return (
      <main className="app-shell">
        <MobileHeader title="Tipo invalido" backTo={backToCategories} />
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
      <MobileHeader title={`Nuevo gasto ${expenseType.label.toLowerCase()}`} backTo={backToCategories} />
      <section className="scroll-pane">
        <div className="space-y-3">
          {/* <div className="rounded-xl border border-app-ink/15 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-app-muted">
            {setName}
          </div> */}

          <div className="rounded-2xl border border-app-ink/20 bg-app-panel p-4 shadow-card">
            <p className="font-heading text-lg font-bold uppercase tracking-wide text-app-muted">
              {/* {typeKey === 'proveedor' ? 'Proveedor' : 'Categoria'} */}
              {categoryName}
            </p>
            {/* <p className="mt-1 text-base font-bold text-app-ink">{categoryName}</p> */}

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Monto</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="mt-1 app-input"
                  placeholder="10000"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Fecha</span>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(event) => setExpenseDate(event.target.value)}
                  className="mt-1 app-input"
                />
              </label>

              <div className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Forma de pago</span>
                <div className="mt-2">
                  <SingleChoiceButtons
                    value={paymentMethod}
                    onChange={(value) => setPaymentMethod(Number(value))}
                    options={paymentMethodOptions}
                    columns={3}
                  />
                </div>
              </div>

              <div className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">
                  Quien creo este gasto
                </span>
                <div className="mt-2">
                  <HorizontalScrollableChoice
                    options={creatorOptions}
                    value={selectedCreatorId}
                    onChange={(value) => setSelectedCreatorId(Number(value))}
                    itemMinWidth={88}
                  />
                </div>
                {usersLoading ? (
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-app-muted">
                    Cargando usuarios...
                  </p>
                ) : null}
                {usersError ? (
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-app-error-text">
                    {usersError}
                  </p>
                ) : null}
              </div>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Descripcion (opcional)</span>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="mt-1 app-textarea"
                  placeholder="Detalle del gasto"
                />
              </label>
            </div>
          </div>

          {error ? (
            <p className="rounded-xl bg-app-error-bg px-3 py-2 text-sm font-semibold text-app-error-text">{error}</p>
          ) : null}
        </div>
      </section>
      <BottomActionBar
        label={submitting ? 'Guardando...' : isOnline ? 'Guardar gasto' : 'Guardar gasto offline'}
        disabled={submitting || !amount}
        onClick={submitExpense}
      />
    </main>
  );
}
