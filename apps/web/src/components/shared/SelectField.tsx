'use client';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface Props {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  required?: boolean;
}

const selectClass =
  'w-full rounded border border-border-default bg-surface-card px-3 py-2 text-sm text-brand';

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  error,
  className = '',
  required = false,
}: Props) {
  const selectId = id ?? (label ? `select-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

  return (
    <label className={`block text-sm ${className}`} htmlFor={selectId}>
      {label ? <span className="mb-1 block font-medium text-brand">{label}</span> : null}
      <select
        id={selectId}
        value={value}
        disabled={disabled}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className={selectClass}
        aria-invalid={error ? true : undefined}
        aria-describedby={error && selectId ? `${selectId}-error` : undefined}
      >
        {placeholder ? (
          <option value="" disabled={required}>
            {placeholder}
          </option>
        ) : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <span id={selectId ? `${selectId}-error` : undefined} className="mt-1 block text-xs text-red-600">
          {error}
        </span>
      ) : null}
    </label>
  );
}
