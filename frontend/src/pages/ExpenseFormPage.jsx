import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import MobileShell from '../components/MobileShell';
import { api } from '../services/api';
import { storage } from '../services/storage';

export default function ExpenseFormPage({ isOnline }) {
  const { setId, categoryId, expenseType } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const groupName = searchParams.get('name') || 'Grupo';
  const categoryName = searchParams.get('category') || 'Categoria';

  const [form, setForm] = useState({
    amount: '',
    payment_method: '1',
    description: '',
    expense_date: new Date().toISOString().slice(0, 10)
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    const payload = {
      category_id: Number(categoryId),
      amount: Number(form.amount),
      payment_method: Number(form.payment_method),
      description: form.description,
      expense_date: form.expense_date
    };

    if (!isOnline) {
      const queue = storage.getOfflineQueue();
      queue.push({ setId, payload });
      storage.setOfflineQueue(queue);
      setMessage('Gasto guardado offline. Se sincroniza al volver internet.');
      setError('');
      navigate(`/sets/${setId}/types?name=${encodeURIComponent(groupName)}`);
      return;
    }

    try {
      await api.createExpense(setId, payload);
      navigate(`/sets/${setId}/types?name=${encodeURIComponent(groupName)}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <MobileShell
      title="Nuevo gasto"
      backTo={`/sets/${setId}/categories/${expenseType}?name=${encodeURIComponent(groupName)}`}
      rightSlot={<span className="tag is-info is-light">{categoryName}</span>}
    >
      <form className="box" onSubmit={submit}>
        <div className="field">
          <label className="label">Monto</label>
          <input className="input is-medium" type="number" min="1" required value={form.amount} onChange={(e) => update('amount', e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Forma de pago</label>
          <div className="select is-fullwidth is-medium">
            <select value={form.payment_method} onChange={(e) => update('payment_method', e.target.value)}>
              <option value="1">Efectivo</option>
              <option value="2">Tarjeta crédito</option>
              <option value="3">Tarjeta débito</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label className="label">Fecha</label>
          <input className="input" type="date" value={form.expense_date} onChange={(e) => update('expense_date', e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Descripción</label>
          <textarea className="textarea" value={form.description} onChange={(e) => update('description', e.target.value)} />
        </div>
        {error ? <p className="help is-danger mb-2">{error}</p> : null}
        {message ? <p className="help is-success mb-2">{message}</p> : null}
        <button className="button is-primary is-fullwidth is-medium" type="submit">Guardar gasto</button>
      </form>
    </MobileShell>
  );
}
