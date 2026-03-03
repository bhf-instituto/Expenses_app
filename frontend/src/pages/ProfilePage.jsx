import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileHeader from '../components/MobileHeader.jsx';
import HorizontalScrollableChoice from '../components/HorizontalScrollableChoice.jsx';
import InlineActionInput from '../components/InlineActionInput.jsx';
import copyIcon from '../assets/icons/copy-icon.svg';
import pasteIcon from '../assets/icons/paste-icon.svg';
import { useAuth } from '../context/AuthContext.jsx';
import { ApiError, inviteApi, setsApi } from '../lib/apiClient.js';
import { getCachedSets, setCachedSets } from '../lib/localCache.js';
import { resolveSessionScope } from '../lib/sessionScope.js';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, isOnline } = useAuth();
  const sessionScope = resolveSessionScope(user);
  const [groups, setGroups] = useState(() => getCachedSets(sessionScope));
  const [selectedSetId, setSelectedSetId] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [createdToken, setCreatedToken] = useState('');
  const [acceptToken, setAcceptToken] = useState('');
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [acceptingInvite, setAcceptingInvite] = useState(false);
  const [createInviteOpen, setCreateInviteOpen] = useState(false);
  const [acceptInviteOpen, setAcceptInviteOpen] = useState(false);
  const [createFeedback, setCreateFeedback] = useState('');
  const [createError, setCreateError] = useState('');
  const [acceptFeedback, setAcceptFeedback] = useState('');
  const [acceptError, setAcceptError] = useState('');

  const groupOptions =
    groups.length > 0
      ? groups.map((group) => ({ value: String(group.id), label: group.name }))
      : [{ value: '', label: 'Sin grupos' }];

  useEffect(() => {
    let cancelled = false;
    const cached = getCachedSets(sessionScope);
    if (!cancelled) {
      setGroups(cached);
      setSelectedSetId((prev) => prev || (cached.length > 0 ? String(cached[0].id) : ''));
    }

    if (!isOnline)
      return () => {
        cancelled = true;
      };

    const loadGroups = async () => {
      try {
        const data = await setsApi.getAll();
        const next = data?.sets || [];
        if (!cancelled) {
          setGroups(next);
          setCachedSets(next, sessionScope);
          setSelectedSetId((prev) => prev || (next.length > 0 ? String(next[0].id) : ''));
        }
      } catch {
        // keep cached groups
      }
    };

    loadGroups();

    return () => {
      cancelled = true;
    };
  }, [isOnline, sessionScope]);

  const createInvite = async () => {
    if (creatingInvite || !isOnline) return;

    const trimmedEmail = inviteEmail.trim();
    if (!selectedSetId) {
      setCreateError('Selecciona un grupo.');
      setCreateFeedback('');
      return;
    }
    if (!trimmedEmail) {
      setCreateError('Ingresa el email del usuario a invitar.');
      setCreateFeedback('');
      return;
    }

    setCreatingInvite(true);
    setCreateError('');
    setCreateFeedback('');

    try {
      const data = await inviteApi.create(selectedSetId, { email: trimmedEmail });
      setCreatedToken(data?.invite_token || '');
      setCreateFeedback('Invitacion creada correctamente.');
    } catch (requestError) {
      const message = requestError instanceof ApiError ? requestError.message : 'No se pudo crear la invitacion';
      setCreateError(message);
    } finally {
      setCreatingInvite(false);
    }
  };

  const copyCreatedToken = async () => {
    if (!createdToken) return;

    setCreateError('');
    setCreateFeedback('');
    try {
      await navigator.clipboard.writeText(createdToken);
      setCreateFeedback('Token copiado.');
    } catch {
      setCreateError('No se pudo copiar el token.');
    }
  };

  const pasteInviteEmail = async () => {
    setCreateError('');
    setCreateFeedback('');
    try {
      const text = await navigator.clipboard.readText();
      setInviteEmail(text || '');
      if (text) {
        setCreateFeedback('Email pegado.');
      }
    } catch {
      setCreateError('No se pudo pegar el email.');
    }
  };

  const pasteAcceptToken = async () => {
    setAcceptError('');
    setAcceptFeedback('');
    try {
      const text = await navigator.clipboard.readText();
      setAcceptToken(text || '');
      if (text) {
        setAcceptFeedback('Token pegado.');
      }
    } catch {
      setAcceptError('No se pudo pegar el token.');
    }
  };

  const acceptInvite = async () => {
    if (acceptingInvite || !isOnline) return;

    const trimmedToken = acceptToken.trim();
    if (!trimmedToken) {
      setAcceptError('Pega un token valido.');
      setAcceptFeedback('');
      return;
    }

    setAcceptingInvite(true);
    setAcceptError('');
    setAcceptFeedback('');
    try {
      await inviteApi.accept({ invite_token: trimmedToken });
      setAcceptFeedback('Invitacion aceptada correctamente.');
      setAcceptToken('');
    } catch (requestError) {
      const message =
        requestError instanceof ApiError ? requestError.message : 'No se pudo aceptar la invitacion';
      setAcceptError(message);
    } finally {
      setAcceptingInvite(false);
    }
  };

  return (
    <main className="app-shell">
      <MobileHeader title="Perfil" backTo="/groups" />
      <section className="scroll-pane">
        <div className="space-y-3">
          <article className="rounded-2xl border-0 bg-app-panel p-4 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Usuario</p>
            <p className="mt-1 font-heading text-base font-semibold text-app-ink">{user?.email || '-'}</p>
          </article>

          <article className="rounded-2xl border-0 bg-app-panel p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Estado</p>
            {/* <p className="mt-1 text-sm font-semibold text-app-ink">{isOnline ? 'Online' : 'Offline'}</p> */}

            <p
              className={`mt-1 text-sm font-bold ${isOnline ? 'text-app-status-online-text' : 'text-app-status-offline-text'
                }`}
            >
              {isOnline ? 'Online' : 'Offline'}
            </p>

          </article>

          {isOnline ? (
            <article className="space-y-3 rounded-2xl border-0 bg-app-panel p-4">
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setCreateInviteOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between border border-app-ink/20 bg-app-panel px-3 py-2 bg-transparent border-0 border-b-2 bor p-0 m-0 text-inherit"
                >
                  <span className="font-heading text-sm font-semibold uppercase tracking-wide text-app-ink ">
                    Crear invitacion
                  </span>
                  <span className="text-xs font-extrabold text-app-ink">{createInviteOpen ? 'Ocultar' : 'Mostrar'}</span>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-out ${
                    createInviteOpen ? 'max-h-[48rem] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="space-y-2 pt-1">
                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Grupo</span>
                      <div className="mt-1">
                        <HorizontalScrollableChoice
                          options={groupOptions}
                          value={selectedSetId}
                          onChange={(nextValue) => setSelectedSetId(String(nextValue))}
                          itemMinWidth={120}
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Email destino</span>
                      <InlineActionInput
                        type="email"
                        value={inviteEmail}
                        onChange={(event) => setInviteEmail(event.target.value)}
                        placeholder="usuario@email.com"
                        disabled={!isOnline}
                        onAction={pasteInviteEmail}
                        actionIconSrc={pasteIcon}
                        actionIconColorVar="--app-icon-action"
                        actionLabel="Pegar email"
                        actionDisabled={!isOnline}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={createInvite}
                      disabled={!isOnline || creatingInvite || groups.length === 0}
                      className="w-full rounded-xl border border-app-ink/30 bg-app-sky px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-app-ink disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {creatingInvite ? 'Creando...' : 'Crear invitacion'}
                    </button>

                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Token generado</span>
                      <InlineActionInput
                        value={createdToken}
                        placeholder="Aun no se genero un token."
                        readOnly
                        onAction={copyCreatedToken}
                        actionIconSrc={copyIcon}
                        actionIconColorVar="--app-icon-action"
                        actionLabel="Copiar token"
                        actionDisabled={!createdToken}
                      />
                    </label>

                    {createFeedback ? (
                      <p className="rounded-lg border border-app-success-border bg-app-success-bg px-3 py-2 text-xs font-semibold text-app-success-text">
                        {createFeedback}
                      </p>
                    ) : null}

                    {createError ? (
                      <p className="rounded-lg border border-app-error-border bg-app-error-bg px-3 py-2 text-xs font-semibold text-app-error-text">
                        {createError}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setAcceptInviteOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between border border-app-ink/20 bg-app-panel px-3 py-2 bg-transparent border-0 border-b-2 bor p-0 m-0 text-inherit"
                >
                  <span className="font-heading text-sm font-semibold uppercase tracking-wide text-app-ink">
                    Aceptar invitacion
                  </span>
                  <span className="text-xs font-extrabold text-app-ink">{acceptInviteOpen ? 'Ocultar' : 'Mostrar'}</span>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-out ${
                    acceptInviteOpen ? 'max-h-[48rem] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="space-y-2 pt-1">
                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-wide text-app-muted">Token</span>
                      <InlineActionInput
                        value={acceptToken}
                        onChange={(event) => setAcceptToken(event.target.value)}
                        placeholder="Pega aqui el token de invitacion."
                        disabled={!isOnline}
                        onAction={pasteAcceptToken}
                        actionIconSrc={pasteIcon}
                        actionIconColorVar="--app-icon-action"
                        actionLabel="Pegar token"
                        actionDisabled={!isOnline}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={acceptInvite}
                      disabled={!isOnline || acceptingInvite}
                      className="w-full rounded-xl border border-app-ink/30 bg-app-sky px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-app-ink disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {acceptingInvite ? 'Aceptando...' : 'Aceptar'}
                    </button>

                    {acceptFeedback ? (
                      <p className="rounded-lg border border-app-success-border bg-app-success-bg px-3 py-2 text-xs font-semibold text-app-success-text">
                        {acceptFeedback}
                      </p>
                    ) : null}

                    {acceptError ? (
                      <p className="rounded-lg border border-app-error-border bg-app-error-bg px-3 py-2 text-xs font-semibold text-app-error-text">
                        {acceptError}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          ) : null}

          <button
            type="button"
            onClick={() => navigate('/groups')}
            className="w-full rounded-xl border border-app-ink/30 bg-app-sky px-4 py-3 font-heading text-sm font-semibold uppercase tracking-wide text-app-ink"
          >
            Volver a grupos
          </button>
        </div>
      </section>
    </main>
  );
}
