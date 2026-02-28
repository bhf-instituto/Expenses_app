import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import MobileShell from '../components/MobileShell';
import { api } from '../services/api';
import { EXPENSE_TYPE_LABELS } from '../constants/domain';

export default function CategoriesPage({ isOnline }) {
  const { setId, expenseType } = useParams();
  const [searchParams] = useSearchParams();
  const groupName = searchParams.get('name') || 'Grupo';
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.categoriesBySet(setId, expenseType)
      .then((res) => setItems(res.data?.items || []))
      .catch((err) => setError(err.message));
  }, [setId, expenseType]);

  return (
    <MobileShell
      title={expenseType === '3' ? 'Proveedores' : 'Categorias'}
      backTo={`/sets/${setId}/types?name=${encodeURIComponent(groupName)}`}
      rightSlot={<span className="tag is-info is-light">{EXPENSE_TYPE_LABELS[expenseType]}</span>}
      footer={
        isOnline ? (
          <Link className="button is-primary is-fullwidth is-medium" to={`/sets/${setId}/categories/new/${expenseType}?name=${encodeURIComponent(groupName)}`}>
            + Crear {expenseType === '3' ? 'proveedor' : 'categoria'}
          </Link>
        ) : null
      }
    >
      {error ? <p className="help is-danger mb-2">{error}</p> : null}
      <div className="mobile-list">
        {items.map((item) => (
          <Link
            key={item.id}
            className="box list-card"
            to={`/sets/${setId}/new-expense/${item.id}/${expenseType}?name=${encodeURIComponent(groupName)}&category=${encodeURIComponent(item.name)}`}
          >
            <p className="title is-5 mb-0">{item.name}</p>
          </Link>
        ))}
      </div>
    </MobileShell>
  );
}
