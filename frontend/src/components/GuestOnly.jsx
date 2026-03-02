import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function GuestOnly({ children }) {
  const { user, booting } = useAuth();

  if (booting) {
    return (
      <div className="flex h-[100dvh] items-center justify-center font-heading text-lg text-app-ink">
        Cargando sesion...
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}
