import { useNavigate } from 'react-router-dom';
import connectionIcon from '../assets/icons/connection-icon.svg';
import offlineIcon from '../assets/icons/connection-offline-icon.svg';
import pendingIcon from '../assets/icons/pending-icon.svg';
import backIcon from '../assets/icons/back-icon.svg';
import { useAuth } from '../context/AuthContext.jsx';
import { useExpenseSync } from '../context/ExpenseSyncContext.jsx';
import MonoIcon from './MonoIcon.jsx';

export default function MobileHeader({
  title,
  backTo = null,
  onBack = null,
  rightSlot = null,
  leftLabel = 'Back',
}) {
  const navigate = useNavigate();
  const { isOnline, connectionDebug } = useAuth();
  const { pendingCount } = useExpenseSync();
  const showNetDebug = typeof window !== 'undefined'
    && (
      new URLSearchParams(window.location.search).get('netdebug') === '1'
      || window.localStorage.getItem('expenses_net_debug') === '1'
    );

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    if (backTo) {
      navigate(backTo);
      return;
    }

    navigate(-1);
  };

  return (
    <header className="safe-top border-0 border-app-ink/10 bg-app-panel/80 px-4 pb-2 backdrop-blur">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleBack}
          title={leftLabel}
          aria-label={leftLabel}
          className="flex h-8 w-10 shrink-0 items-center justify-center rounded-lg border-0 bg-transparent text-xs font-bold uppercase tracking-wide text-app-ink hover:bg-app-bg"
        >
          <MonoIcon src={backIcon} className="h-4 w-4" />
        </button>
        <h1 className="min-w-0 flex-1 ml-2 truncate font-heading text-sm font-semibold uppercase tracking-wide text-app-ink">
          {title}
        </h1>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {isOnline ? (
            <div
              className="flex h-8 shrink-0 items-center rounded-full border-0 bg-transparent border-app-status-online-border bg-app-status-online-bg px-2"
              title="Conectado y sincronizado"
              aria-label="Conectado y sincronizado"
            >
              <MonoIcon src={connectionIcon} colorVar="--app-icon-connection" className="h-4 w-7" />
            </div>
          ) : (
            <div
              className="flex h-8 shrink-0 items-center rounded-full border-0 bg-transparent border-app-status-offline-border bg-app-status-offline-bg px-2"
              title="Modo offline"
              aria-label="Modo offline"
            >
              <MonoIcon src={offlineIcon} colorVar="--app-icon-offline" className="h-4 w-7 scale-[1.12]" />
            </div>
          )}
          {pendingCount > 0 ? (
            <button
              type="button"
              onClick={() => navigate('/pending-actions')}
              className="flex h-8 shrink-0 items-center gap-0.5 rounded-full border-0 bg-transparent border-app-status-pending-border bg-app-status-pending-bg px-2"
              title={`Acciones pendientes: ${pendingCount}`}
              aria-label={`Acciones pendientes: ${pendingCount}`}
            >
              <MonoIcon src={pendingIcon} colorVar="--app-icon-pending" className="h-4 w-4" />
              <span className="text-xs font-extrabold leading-none text-app-ink">{pendingCount}</span>
            </button>
          ) : null}
          {showNetDebug ? (
            <div
              className="rounded-md bg-app-bg/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-app-muted"
              title="Debug conectividad: B=browser, P=probe backend"
              aria-label="Debug conectividad"
            >
              B:{connectionDebug?.browserOnline ? 1 : 0} P:{connectionDebug?.backendReachable ? 1 : 0}
            </div>
          ) : null}
          {rightSlot}
        </div>
      </div>
    </header>
  );
}
