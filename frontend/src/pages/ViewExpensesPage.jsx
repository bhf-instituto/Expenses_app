import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import MobileHeader from '../components/MobileHeader.jsx';
import BottomActionBar from '../components/BottomActionBar.jsx';
import SingleChoiceButtons from '../components/SingleChoiceButtons.jsx';
import { categoriesApi, expensesApi } from '../lib/apiClient.js';
import { EXPENSE_TYPES, PAYMENT_METHODS, getExpenseTypeById, getPaymentMethodById } from '../constants/catalogs.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ViewExpensesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOnline } = useAuth();
  const { setId } = useParams();
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    expense_type: '',
    category_id: '',
    payment_method: '',
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
    if (!isOnline) return;

    let cancelled = false;
    const loadCategories = async () => {
      try {
        const data = await categoriesApi.getAll(setId, undefined);
        if (!cancelled) {
          setCategories(data?.categories || []);
        }
      } catch {
        if (!cancelled) {
          setCategories([]);
        }
      }
    };

    loadCategories();
    loadExpenses(query);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, setId]);

  if (!isOnline) {
    return (
      <main className="app-shell">
        <MobileHeader title="Ver gastos" backTo="/" />
        <section className="scroll-pane">
          <div className="rounded-2xl border border-app-ink/20 bg-app-warning p-4 text-sm font-semibold text-app-ink">
            El modo VER esta deshabilitado offline.
          </div>
        </section>
        <BottomActionBar label="Volver al home" onClick={() => navigate('/')} />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <MobileHeader title={`Ver gastos: ${setName}`} backTo="/" />
      <section className="scroll-pane">
        <div className="space-y-3">
          <div className="rounded-2xl border border-app-ink/20 bg-white p-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="col-span-2 block">
                <span className="text-[10px] font-bold uppercase tracking-wide text-app-muted">Tipo</span>
                <div className="mt-1">
                  <SingleChoiceButtons
                    value={filters.expense_type}
                    onChange={(value) => setFilters((prev) => ({ ...prev, expense_type: String(value) }))}
                    options={typeFilterOptions}
                    columns={4}
                    compact
                  />
                </div>
              </label>
              <label className="col-span-2 block">
                <span className="text-[10px] font-bold uppercase tracking-wide text-app-muted">Forma pago</span>
                <div className="mt-1">
                  <SingleChoiceButtons
                    value={filters.payment_method}
                    onChange={(value) => setFilters((prev) => ({ ...prev, payment_method: String(value) }))}
                    options={paymentFilterOptions}
                    columns={4}
                    compact
                  />
                </div>
              </label>
              <label className="block col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-app-muted">Categoria</span>
                <select
                  value={filters.category_id}
                  onChange={(event) => setFilters((prev) => ({ ...prev, category_id: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-app-ink/20 px-2 py-2 text-xs"
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
                  className="mt-1 w-full rounded-lg border border-app-ink/20 px-2 py-2 text-xs"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wide text-app-muted">Hasta</span>
                <input
                  type="date"
                  value={filters.to_date}
                  onChange={(event) => setFilters((prev) => ({ ...prev, to_date: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-app-ink/20 px-2 py-2 text-xs"
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
                  <article key={expense.id} className="rounded-xl border border-app-ink/15 bg-white p-3">
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
            <p className="rounded-xl bg-red-100 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
