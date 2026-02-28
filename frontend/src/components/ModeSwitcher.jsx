export default function ModeSwitcher({ mode, onChange }) {
  return (
    <div className="tabs is-toggle is-fullwidth is-small mb-2">
      <ul>
        <li className={mode === 'create' ? 'is-active' : ''}>
          <button type="button" onClick={() => onChange('create')}>Crear</button>
        </li>
        <li className={mode === 'view' ? 'is-active' : ''}>
          <button type="button" onClick={() => onChange('view')}>Ver</button>
        </li>
      </ul>
    </div>
  );
}
