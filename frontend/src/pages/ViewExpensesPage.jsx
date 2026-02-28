import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import MobileShell from '../components/MobileShell';
import { api } from '../services/api';

export default function ViewExpensesPage() {
  const { setId } = useParams();
  const [searchParams] = useSearchParams();
  const groupName = searchParams.get('name') || 'Grupo';

  const [expenseType, setExpenseType] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (expenseType) params.set('expense_type', expenseType);
    if (paymentMethod) params.set('payment_method', paymentMethod);

    api.listExpenses(setId, params.toString())
      .then((res) => setItems(res.data?.items || []))
      .catch((err) => setError(err.message));
  }, [setId, expenseType, paymentMethod]);

  return (
    <MobileShell title="Ver gastos" backTo="/" rightSlot={<span className="tag is-info is-light">{groupName}</span>}>
      <div className="box mb-3">
        <div className="columns is-mobile">
          <div className="column">
            <label className="label is-small">Tipo</label>
            <div className="select is-fullwidth is-small">
              <select value={expenseType} onChange={(e) => setExpenseType(e.target.value)}>
                <option value="">Todos</option>
                <option value="1">Fijo</option>
                <option value="2">Variable</option>
                <option value="3">Proveedor</option>
              </select>
            </div>
          </div>
          <div className="column">
            <label className="label is-small">Pago</label>
            <div className="select is-fullwidth is-small">
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="">Todos</option>
                <option value="1">Efectivo</option>
                <option value="2">Crédito</option>
                <option value="3">Débito</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      {error ? <p className="help is-danger mb-2">{error}</p> : null}
      <div className="mobile-list">
        {items.map((expense) => (
          <article key={expense.id} className="box list-card">
            <p className="title is-6 mb-1">${expense.amount}</p>
            <p className="subtitle is-7 mb-1">{expense.category_name} · {expense.expense_date}</p>
            <p className="is-size-7">{expense.description || 'Sin descripción'}</p>
          </article>
        ))}
      </div>
    </MobileShell>
  );
}
