export default function OfflineBanner({ isOnline }) {
  if (isOnline) return null;

  return (
    <div className="rounded-xl border border-app-ink/20 bg-app-warning px-3 py-2 text-xs font-semibold uppercase tracking-wide text-app-ink">
      Modo offline: solo crear gastos. Ver, crear grupo y crear categoria deshabilitado.
    </div>
  );
}
