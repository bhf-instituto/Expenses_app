import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import MobileHeader from '../components/MobileHeader.jsx';
import BottomActionBar from '../components/BottomActionBar.jsx';
import OfflineBanner from '../components/OfflineBanner.jsx';
import { ApiError, categoriesApi } from '../lib/apiClient.js';
import { getExpenseTypeByKey } from '../constants/catalogs.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function CreateCategoryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setId, typeKey } = useParams();
  const { isOnline } = useAuth();
  const expenseType = getExpenseTypeByKey(typeKey);
  const [categoryName, setCategoryName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const backToCategories = `/sets/${setId}/categories/${typeKey}`;
  const currentSetName = location.state?.setName || `Grupo ${setId}`;

  const handleSubmit = async () => {
    if (!isOnline || submitting || !expenseType) return;

    setError('');
    setSubmitting(true);
    try {
      await categoriesApi.create(setId, {
        category_name: categoryName,
        expense_type: expenseType.id,
      });
      navigate(backToCategories, {
        replace: true,
        state: { setName: currentSetName },
      });
    } catch (requestError) {
      const message =
        requestError instanceof ApiError ? requestError.message : 'No se pudo crear la categoria';
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
          <p className="rounded-xl bg-red-100 px-3 py-2 text-sm font-semibold text-red-700">
            Tipo de gasto no reconocido.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <MobileHeader title={`Crear ${typeKey === 'proveedor' ? 'proveedor' : 'categoria'}`} backTo={backToCategories} />
      <section className="scroll-pane">
        <div className="space-y-3">
          <OfflineBanner isOnline={isOnline} />
          <div className="rounded-xl border border-app-ink/15 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-app-muted">
            {currentSetName}
          </div>
          <div className="rounded-2xl border border-app-ink/20 bg-white p-4 shadow-card">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">
                {typeKey === 'proveedor' ? 'Nombre del proveedor' : 'Nombre de la categoria'}
              </span>
              <input
                type="text"
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-app-ink/20 px-3 py-3 text-sm outline-none focus:border-app-ink/50"
                placeholder={typeKey === 'proveedor' ? 'Proveedor central' : 'Categoria principal'}
              />
            </label>

            {error ? (
              <p className="mt-3 rounded-lg bg-red-100 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>
            ) : null}
          </div>
        </div>
      </section>
      <BottomActionBar
        label={submitting ? 'Guardando...' : 'Guardar'}
        disabled={!isOnline || submitting || !categoryName.trim()}
        onClick={handleSubmit}
      />
    </main>
  );
}
