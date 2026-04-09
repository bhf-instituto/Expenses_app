import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError } from '../lib/apiClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import useDesktopViewport from '../hooks/useDesktopViewport.js';

const DEMO_LOGIN_PRESETS = Object.freeze({
  portfolio: {
    email: 'test_01@gmail.com',
    password: '12345678',
    helperText: 'Demo portfolio activa. Las credenciales ya estan cargadas: solo hace click en Ingresar.',
  },
});

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register, isOnline } = useAuth();
  const isDesktop = useDesktopViewport();
  const demoPresetKey = String(searchParams.get('demo') || '').trim().toLowerCase();
  const demoPreset = DEMO_LOGIN_PRESETS[demoPresetKey] || null;
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!demoPreset) return;
    setMode('login');
    setEmail(demoPreset.email);
    setPassword(demoPreset.password);
    setError('');
  }, [demoPreset]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const action = mode === 'login' ? login : register;
      await action({ email, password });
      navigate('/', { replace: true });
    } catch (requestError) {
      const message =
        requestError instanceof ApiError ? requestError.message : 'No se pudo completar la solicitud';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={isDesktop ? 'flex min-h-[100dvh] w-full items-center justify-center px-4 py-6' : 'app-shell'}>
      <section
        className={
          isDesktop
            ? 'w-full max-w-md rounded-2xl bg-app-panel/90 p-4 shadow-card'
            : 'no-scrollbar flex min-h-0 flex-1 flex-col justify-center overflow-y-auto p-4'
        }
      >
        <div className={isDesktop ? 'space-y-3' : 'my-auto space-y-3'}>
          <header className="flex rounded-xl border-0 bg-app-panel p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 rounded-lg py-2 font-heading text-sm font-semibold uppercase ${
                mode === 'login' ? 'bg-app-mint text-app-ink' : 'text-app-muted'
              }`}
            >
              Loguearse
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 rounded-lg py-2 font-heading text-sm font-semibold uppercase ${
                mode === 'register' ? 'bg-app-sky text-app-ink' : 'text-app-muted'
              }`}
            >
              Registrarse
            </button>
          </header>

          {/* <div className="mb-3 rounded-xl border border-app-ink/15 bg-app-panel px-4 py-3 text-xs font-semibold uppercase tracking-wide text-app-muted">
          {isOnline
            ? 'Conectado. Inicia sesion para continuar.'
            : 'Sin conexion. Solo podras entrar si ya tenias sesion local.'}
        </div> */}

          {demoPreset ? (
            <div className="rounded-2xl border border-app-sky/30 bg-app-sky/10 px-4 py-3 text-sm font-semibold text-app-ink">
              {demoPreset.helperText}
            </div>
          ) : null}

          <form
            onSubmit={onSubmit}
            className={`animate-riseIn rounded-2xl border-0 bg-app-panel p-4 ${isDesktop ? '' : 'shadow-card'}`}
          >
            {/* <h1 className="font-heading text-lg font-semibold uppercase text-app-ink">
            {mode === 'login' ? 'Acceso' : 'Crear cuenta'}
          </h1> */}
            <div className="mt-0 space-y-3">
              <label className="block">
                <span className="text-sm font-semibold uppercase tracking-wide text-app-muted">Email</span>
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1 app-input"
                  placeholder="usuario@correo.com"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Password</span>
                <input
                  type={demoPreset ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-1 app-input"
                  placeholder="Minimo 8 caracteres"
                />
              </label>
            </div>

            {error ? (
              <p className="mt-3 rounded-lg bg-app-error-bg px-3 py-2 text-sm font-semibold text-app-error-text">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={submitting || (!isOnline && mode === 'register')}
              className={`mt-4 w-full rounded-xl py-3 font-heading text-sm font-semibold uppercase tracking-wide ${
                submitting || (!isOnline && mode === 'register')
                  ? 'cursor-not-allowed bg-app-mint text-app-muted'
                  : 'bg-app-sky/30 text-app-ink hover:bg-app-warning'
              }`}
            >
              {submitting ? 'Procesando...' : mode === 'login' ? 'Ingresar' : 'Crear usuario'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
