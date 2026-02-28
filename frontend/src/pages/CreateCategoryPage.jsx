import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import MobileShell from '../components/MobileShell';
import { api } from '../services/api';

export default function CreateCategoryPage() {
  const navigate = useNavigate();
  const { setId, expenseType } = useParams();
  const [searchParams] = useSearchParams();
  const groupName = searchParams.get('name') || 'Grupo';
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    try {
      await api.createCategory(setId, {
        name,
        expense_type: Number(expenseType)
      });
      navigate(`/sets/${setId}/categories/${expenseType}?name=${encodeURIComponent(groupName)}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <MobileShell
      title={expenseType === '3' ? 'Crear proveedor' : 'Crear categoria'}
      backTo={`/sets/${setId}/categories/${expenseType}?name=${encodeURIComponent(groupName)}`}
    >
      <form className="box" onSubmit={submit}>
        <div className="field">
          <label className="label">Nombre</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        {error ? <p className="help is-danger mb-2">{error}</p> : null}
        <button className="button is-primary is-fullwidth" type="submit">Guardar</button>
      </form>
    </MobileShell>
  );
}
