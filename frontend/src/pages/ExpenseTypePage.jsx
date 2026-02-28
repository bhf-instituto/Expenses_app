import { Link, useParams, useSearchParams } from 'react-router-dom';
import MobileShell from '../components/MobileShell';
import { EXPENSE_TYPE_LABELS } from '../constants/domain';

export default function ExpenseTypePage() {
  const { setId } = useParams();
  const [searchParams] = useSearchParams();
  const groupName = searchParams.get('name') || 'Grupo';

  return (
    <MobileShell
      title="Tipo de gasto"
      backTo="/"
      rightSlot={<span className="tag is-info is-light">{groupName}</span>}
    >
      <div className="mobile-list big-actions">
        {[1, 2, 3].map((type) => (
          <Link
            className="box list-card is-flex is-justify-content-center is-align-items-center huge"
            key={type}
            to={`/sets/${setId}/categories/${type}?name=${encodeURIComponent(groupName)}`}
          >
            <span className="title is-3">{EXPENSE_TYPE_LABELS[type]}</span>
          </Link>
        ))}
      </div>
    </MobileShell>
  );
}
