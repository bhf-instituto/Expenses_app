import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import MobileHeader from '../components/MobileHeader.jsx';
import ListCardButton from '../components/ListCardButton.jsx';
import { EXPENSE_TYPES } from '../constants/catalogs.js';
import { setsApi } from '../lib/apiClient.js';
import { getCachedSets } from '../lib/localCache.js';

export default function ExpenseTypePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setId } = useParams();
  const [setName, setSetName] = useState(location.state?.setName || `Grupo ${setId}`);

  useEffect(() => {
    let cancelled = false;

    const loadSetName = async () => {
      if (location.state?.setName) return;

      const cached = getCachedSets();
      const fromCache = cached.find((set) => String(set.id) === String(setId));
      if (fromCache && !cancelled) {
        setSetName(fromCache.name);
      }

      try {
        const data = await setsApi.getById(setId);
        if (!cancelled && data?.set?.name) {
          setSetName(data.set.name);
        }
      } catch {
        // fallback to cached/default label
      }
    };

    loadSetName();
    return () => {
      cancelled = true;
    };
  }, [location.state?.setName, setId]);

  return (
    <main className="app-shell">
      <MobileHeader title={setName} backTo="/groups" leftLabel="Back" />
      <section className="flex min-h-0 flex-1 px-4 py-3">
        <div className="flex h-full w-full flex-col gap-3 rounded-2xl border border-app-ink/20 bg-app-mint/35 p-3">
          {EXPENSE_TYPES.map((type) => (
            <div key={type.id} className="min-h-0 flex-1">
              <ListCardButton
                title={type.label}
                subtitle="Seleccionar tipo de gasto"
                accent={type.accent}
                size="fill"
                onClick={() =>
                  navigate(`/sets/${setId}/categories/${type.key}`, {
                    state: { setName },
                  })
                }
              />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
