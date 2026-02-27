import { Navigate, useNavigate, useParams } from 'react-router-dom'
import MobileHeader from '../../components/mobile/MobileHeader.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { getSetNameFromSnapshot } from '../../lib/setsFlow.js'

function MobileExpenseTypePage() {
  const navigate = useNavigate()
  const { setId } = useParams()
  const { isAuthenticated } = useAuth()
  const setName = getSetNameFromSnapshot(setId)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!setId) {
    return <Navigate to="/app/crear" replace />
  }

  return (
    <section className="mobile-screen">
      <MobileHeader
        leftAction={{ label: 'Atras', onClick: () => navigate(-1) }}
        rightAction={setName ? { label: setName } : null}
        title="Tipo de gasto"
      />

      <article className="mobile-card">
        <div className="type-selector">
          <button
            className="type-selector__button is-fixed"
            onClick={() => navigate(`/app/grupos/${setId}/categorias/fijo`)}
            type="button"
          >
            Fijo
          </button>
          <button
            className="type-selector__button is-variable"
            onClick={() => navigate(`/app/grupos/${setId}/categorias/variable`)}
            type="button"
          >
            Variable
          </button>
        </div>
      </article>
    </section>
  )
}

export default MobileExpenseTypePage
