export default function MonoIcon({
  src,
  colorVar = '--app-icon-action',
  className = '',
}) {
  return (
    <span
      aria-hidden="true"
      className={`icon-mask ${className}`}
      style={{
        '--icon-src': `url("${src}")`,
        '--icon-color': `rgb(var(${colorVar}))`,
      }}
    />
  );
}
