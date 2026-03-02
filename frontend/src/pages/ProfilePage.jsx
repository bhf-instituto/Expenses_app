import { useNavigate } from 'react-router-dom';
import MobileHeader from '../components/MobileHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, isOnline } = useAuth();

  return (
    <main className="app-shell">
      <MobileHeader title="Perfil" backTo="/" />
      <section className="scroll-pane">
        <div className="space-y-3">
          <article className="rounded-2xl border border-app-ink/20 bg-white p-4 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Usuario</p>
            <p className="mt-1 font-heading text-base font-semibold text-app-ink">{user?.email || '-'}</p>
          </article>

          <article className="rounded-2xl border border-app-ink/20 bg-app-panel p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Estado</p>
            <p className="mt-1 text-sm font-semibold text-app-ink">{isOnline ? 'Online' : 'Offline'}</p>
          </article>

          <article className="rounded-2xl border border-app-ink/20 bg-app-mint/35 p-4">
            <p className="font-heading text-sm font-semibold uppercase tracking-wide text-app-ink">
              Opciones proximas
            </p>
            <ul className="mt-2 space-y-2 text-sm font-semibold text-app-muted">
              <li>Gestion de cuenta</li>
              <li>Preferencias de notificaciones</li>
              <li>Seguridad de sesion</li>
            </ul>
          </article>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full rounded-xl border border-app-ink/30 bg-app-sky px-4 py-3 font-heading text-sm font-semibold uppercase tracking-wide text-app-ink"
          >
            Volver al home
          </button>
        </div>
      </section>
    </main>
  );
}
