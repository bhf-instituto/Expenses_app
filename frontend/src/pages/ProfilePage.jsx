import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileHeader from '../components/MobileHeader.jsx';
import HorizontalScrollableChoice from '../components/HorizontalScrollableChoice.jsx';
import InlineActionInput from '../components/InlineActionInput.jsx';
import MonoIcon from '../components/MonoIcon.jsx';
import copyIcon from '../assets/icons/copy-icon.svg';
import pasteIcon from '../assets/icons/paste-icon.svg';
import logoutIcon from '../assets/icons/logout-icon.svg';
import backIcon from '../assets/icons/back-icon.svg';
import useDesktopViewport from '../hooks/useDesktopViewport.js';
import { EXPENSE_TYPES, PAYMENT_METHODS } from '../constants/catalogs.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ApiError, inviteApi, profileApi, setsApi } from '../lib/apiClient.js';
import { getCachedSets, setCachedSets } from '../lib/localCache.js';
import { resolveSessionScope } from '../lib/sessionScope.js';
import {
  DEFAULT_UI_COLOR_SETTINGS,
  applyUiColorSettingsToDocument,
  getScopedUiColorSettings,
  setScopedUiColorSettings,
  hexToRgbTriplet,
  rgbTripletToHex,
} from '../lib/uiColorSettings.js';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, isOnline, logout } = useAuth();
  const isDesktop = useDesktopViewport();
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
  const [uiColorSettings, setUiColorSettings] = useState(() => getScopedUiColorSettings(sessionScope));
  const colorProfileSaveTimerRef = useRef(null);

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

  useEffect(() => {
    const nextSettings = getScopedUiColorSettings(sessionScope);
    setUiColorSettings(nextSettings);
    applyUiColorSettingsToDocument(nextSettings);
  }, [sessionScope]);

  useEffect(
    () => () => {
      if (colorProfileSaveTimerRef.current) {
        clearTimeout(colorProfileSaveTimerRef.current);
      }
    },
    []
  );

  const scheduleColorProfileSave = useCallback(
    (settings, { immediate = false } = {}) => {
      if (!isOnline || !user?.id) return;

      const persist = async () => {
        try {
          await profileApi.saveColorProfile(settings);
        } catch {
          // keep local cache as source of truth when request fails
        }
      };

      if (colorProfileSaveTimerRef.current) {
        clearTimeout(colorProfileSaveTimerRef.current);
      }

      if (immediate) {
        void persist();
        return;
      }

      colorProfileSaveTimerRef.current = setTimeout(() => {
        void persist();
      }, 450);
    },
    [isOnline, user?.id]
  );

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

  const updateUiColor = (groupKey, id, key, hexValue) => {
    const fallback = DEFAULT_UI_COLOR_SETTINGS?.[groupKey]?.[String(id)]?.[key] || '255 255 255';
    const nextTriplet = hexToRgbTriplet(hexValue, fallback);

    setUiColorSettings((prev) => {
      const next = {
        ...prev,
        [groupKey]: {
          ...(prev?.[groupKey] || {}),
          [String(id)]: {
            ...(prev?.[groupKey]?.[String(id)] || {}),
            [key]: nextTriplet,
          },
        },
      };
      const normalized = setScopedUiColorSettings(next, sessionScope);
      applyUiColorSettingsToDocument(normalized);
      scheduleColorProfileSave(normalized);
      return normalized;
    });
  };

  const resetUiColors = () => {
    const normalized = setScopedUiColorSettings(DEFAULT_UI_COLOR_SETTINGS, sessionScope);
    setUiColorSettings(normalized);
    applyUiColorSettingsToDocument(normalized);
    scheduleColorProfileSave(normalized, { immediate: true });
  };

  const goToDashboard = () => navigate('/dashboard');
  const onLogout = async () => {
    await logout();
    navigate('/auth', { replace: true });
  };

  if (isDesktop) {
    return (
      <main className="mx-auto flex h-[100dvh] w-full max-w-[1600px] flex-col border-x border-app-ink/10 bg-app-bg shadow-card">
        <header className="flex items-center justify-between border-b border-app-ink/10 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-app-muted">Perfil</p>
            <h1 className="font-heading text-2xl font-extrabold uppercase text-app-ink">{user?.email || '-'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToDashboard}
              title="Volver"
              aria-label="Volver"
              className="flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-app-mint/100 hover:bg-app-bg"
            >
              <MonoIcon src={backIcon} className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onLogout}
              title="Logout"
              aria-label="Logout"
              className="flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-app-mint/100 hover:bg-app-bg"
            >
              <MonoIcon src={logoutIcon} className="h-4 w-4" />
            </button>
          </div>
        </header>

        <section className="no-scrollbar min-h-0 flex-1 overflow-auto p-6">
          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
              <div className="space-y-4">
                <article className="rounded-2xl bg-app-panel p-4 shadow-card">
                  <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Usuario</p>
                  <p className="mt-1 font-heading text-sm font-semibold text-app-ink">{user?.email || '-'}</p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-app-muted">Estado</p>
                  <p
                    className={`mt-1 text-sm font-bold ${
                      isOnline ? 'text-app-status-online-text' : 'text-app-status-offline-text'
                    }`}
                  >
                    {isOnline ? 'Online' : 'Offline'}
                  </p>
                </article>

                {isOnline ? (
                  <article className="space-y-3 rounded-2xl bg-app-panel p-4 shadow-card">
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setCreateInviteOpen((prev) => !prev)}
                        className="flex w-full items-center justify-between border-0 border-b border-app-ink/20 bg-transparent p-0 pb-2"
                      >
                        <span className="font-heading text-sm font-semibold uppercase tracking-wide text-app-ink">
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
                        className="flex w-full items-center justify-between border-0 border-b border-app-ink/20 bg-transparent p-0 pb-2"
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
                ) : (
                  <article className="rounded-2xl bg-app-panel p-4 shadow-card">
                    <p className="text-sm font-semibold text-app-muted">
                      Las invitaciones solo estan disponibles en modo online.
                    </p>
                  </article>
                )}
              </div>

              <div className="space-y-4">
                <article className="rounded-2xl bg-app-panel p-4 shadow-card">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-app-muted">Colores locales</p>
                    <button
                      type="button"
                      onClick={resetUiColors}
                      className="rounded-lg bg-app-bg/35 px-2 py-1 text-[11px] font-extrabold uppercase tracking-wide text-app-ink"
                    >
                      Reset
                    </button>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[minmax(0,320px)_minmax(0,320px)_minmax(0,320px)] xl:justify-start">
                    <div className="space-y-3">
                      <p className="text-[11px] font-extrabold uppercase tracking-wide text-app-muted">Tipos de gasto</p>
                      {EXPENSE_TYPES.map((type) => {
                        const bgTriplet = uiColorSettings?.expenseType?.[String(type.id)]?.bg;
                        return (
                          <div key={`profile-color-expense-type-${type.id}`} className="rounded-xl bg-app-bg/25 p-2">
                            <p className="text-xs font-semibold uppercase text-app-ink">{type.label}</p>
                            <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-2">
                              <label className="flex items-center justify-between rounded-lg bg-app-panel/70 px-3 py-2 text-[11px] font-semibold uppercase text-app-muted">
                                Fondo
                                <input
                                  type="color"
                                  value={rgbTripletToHex(bgTriplet, '#1b2d42')}
                                  onChange={(event) => updateUiColor('expenseType', type.id, 'bg', event.target.value)}
                                  className="h-4 w-7 cursor-pointer rounded-sm border border-app-ink/20 bg-transparent p-0"
                                />
                              </label>
                              <span
                                className="rounded-lg border border-app-ink/25 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide"
                                style={{ color: 'rgb(var(--app-text-primary))', backgroundColor: `rgb(${bgTriplet})` }}
                              >
                                {type.shortLabel || type.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="space-y-3">
                      <p className="text-[11px] font-extrabold uppercase tracking-wide text-app-muted">Formas de pago</p>
                      {PAYMENT_METHODS.map((method) => {
                        const bgTriplet = uiColorSettings?.paymentMethod?.[String(method.id)]?.bg;
                        return (
                          <div key={`profile-color-payment-method-${method.id}`} className="rounded-xl bg-app-bg/25 p-2">
                            <p className="text-xs font-semibold uppercase text-app-ink">{method.label}</p>
                            <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-2">
                              <label className="flex items-center justify-between rounded-lg bg-app-panel/70 px-3 py-2 text-[11px] font-semibold uppercase text-app-muted">
                                Fondo
                                <input
                                  type="color"
                                  value={rgbTripletToHex(bgTriplet, '#2e455d')}
                                  onChange={(event) => updateUiColor('paymentMethod', method.id, 'bg', event.target.value)}
                                  className="h-4 w-7 cursor-pointer rounded-sm border border-app-ink/20 bg-transparent p-0"
                                />
                              </label>
                              <span
                                className="rounded-lg border border-app-ink/25 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide"
                                style={{ color: 'rgb(var(--app-text-primary))', backgroundColor: `rgb(${bgTriplet})` }}
                              >
                                {method.shortLabel || method.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="space-y-3">
                      <p className="text-[11px] font-extrabold uppercase tracking-wide text-app-muted">Graficos (analiticas)</p>
                      {[
                        { key: 'expense', label: 'Gastos' },
                        { key: 'income', label: 'Ingresos' },
                        { key: 'balance', label: 'Saldo' },
                      ].map((seriesItem) => {
                        const triplet = uiColorSettings?.analyticsSeries?.[seriesItem.key]?.color;
                        return (
                          <div key={`profile-color-chart-${seriesItem.key}`} className="rounded-xl bg-app-bg/25 p-2">
                            <p className="text-xs font-semibold uppercase text-app-ink">{seriesItem.label}</p>
                            <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-2">
                              <label className="flex items-center justify-between rounded-lg bg-app-panel/70 px-3 py-2 text-[11px] font-semibold uppercase text-app-muted">
                                Color
                                <input
                                  type="color"
                                  value={rgbTripletToHex(triplet, '#dfd0b8')}
                                  onChange={(event) =>
                                    updateUiColor('analyticsSeries', seriesItem.key, 'color', event.target.value)
                                  }
                                  className="h-4 w-7 cursor-pointer rounded-sm border border-app-ink/20 bg-transparent p-0"
                                />
                              </label>
                              <span
                                className="rounded-lg border border-app-ink/25 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-app-ink"
                                style={{ backgroundColor: `rgb(${triplet})` }}
                              >
                                {seriesItem.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </article>
              </div>
            </div>

          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <MobileHeader
        title="Perfil"
        backTo="/groups"
        rightSlot={
          <button
            type="button"
            onClick={onLogout}
            title="Logout"
            aria-label="Logout"
            className="flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-app-panel/50 hover:bg-app-bg"
          >
            <MonoIcon src={logoutIcon} className="h-4 w-4" />
          </button>
        }
      />
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
                  className="flex w-full items-center justify-between border border-app-ink/20 bg-app-panel px-3 py-2  border-0 border-b-2 bor p-0 m-0 text-inherit"
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
                  className="flex w-full items-center justify-between border border-app-ink/20 bg-app-panel px-3 py-2 border- border-b-2 bor p-0 m-0 text-inherit"
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
        </div>
      </section>
    </main>
  );
}
