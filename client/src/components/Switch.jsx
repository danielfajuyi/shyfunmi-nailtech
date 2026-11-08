/* Accessible on/off switch. Uses a real checkbox underneath so keyboard + screen readers just work. */
export default function Switch({ checked, onChange, label, disabled = false, className = '' }) {
  return (
    <label className={`switch ${disabled ? 'is-disabled' : ''} ${className}`}>
      <input type="checkbox" role="switch" checked={checked} onChange={onChange} disabled={disabled} />
      <i aria-hidden="true" />
      {label && <span>{label}</span>}
    </label>
  );
}
