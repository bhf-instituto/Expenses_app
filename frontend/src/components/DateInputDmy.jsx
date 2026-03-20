import { useEffect, useRef, useState } from 'react';
import triangleDownIcon from '../assets/icons/triangle-down-icon.svg';
import MonoIcon from './MonoIcon.jsx';

const YMD_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad2 = (value) => String(value).padStart(2, '0');

const toDmyFromYmd = (value) => {
  const normalized = String(value || '').trim();
  const match = YMD_REGEX.exec(normalized);
  if (!match) return '';
  return `${match[3]}/${match[2]}/${match[1]}`;
};

const isValidDateParts = (day, month, year) => {
  const numericDay = Number(day);
  const numericMonth = Number(month);
  const numericYear = Number(year);

  if (!Number.isInteger(numericDay) || !Number.isInteger(numericMonth) || !Number.isInteger(numericYear)) {
    return false;
  }
  if (numericYear < 1000 || numericYear > 9999) return false;
  if (numericMonth < 1 || numericMonth > 12) return false;
  if (numericDay < 1 || numericDay > 31) return false;

  const date = new Date(Date.UTC(numericYear, numericMonth - 1, numericDay));
  return (
    date.getUTCFullYear() === numericYear
    && date.getUTCMonth() === numericMonth - 1
    && date.getUTCDate() === numericDay
  );
};

const toYmdFromDmy = (value) => {
  const normalized = String(value || '').trim();
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(normalized);
  if (!match) return '';
  const [, day, month, year] = match;
  if (!isValidDateParts(day, month, year)) return '';
  return `${year}-${month}-${day}`;
};

const normalizeDigits = (value) => String(value || '').replace(/\D/g, '').slice(0, 8);

const maskDigitsAsDmy = (digits) => {
  const normalized = normalizeDigits(digits);
  if (!normalized) return '';
  if (normalized.length <= 2) return normalized;
  if (normalized.length <= 4) {
    return `${normalized.slice(0, 2)}/${normalized.slice(2)}`;
  }
  return `${normalized.slice(0, 2)}/${normalized.slice(2, 4)}/${normalized.slice(4)}`;
};

const isIosDevice = () => {
  if (typeof navigator === 'undefined') return false;

  const userAgent = String(navigator.userAgent || '');
  const platform = String(navigator.platform || '');

  return /iPad|iPhone|iPod/.test(userAgent)
    || (platform === 'MacIntel' && Number(navigator.maxTouchPoints || 0) > 1);
};

export default function DateInputDmy({
  value,
  onChange,
  className,
  placeholder = 'dd/mm/yyyy',
  name,
  id,
  disabled = false,
  required = false,
}) {
  const [displayValue, setDisplayValue] = useState(() => toDmyFromYmd(value));
  const nativeDateInputRef = useRef(null);
  const useNativeOverlay = isIosDevice();

  useEffect(() => {
    setDisplayValue(toDmyFromYmd(value));
  }, [value]);

  const handleChange = (event) => {
    const maskedValue = maskDigitsAsDmy(event.target.value);
    setDisplayValue(maskedValue);

    const ymdValue = toYmdFromDmy(maskedValue);
    onChange(ymdValue);
  };

  const handleBlur = () => {
    if (!displayValue) {
      onChange('');
      return;
    }

    const ymdValue = toYmdFromDmy(displayValue);
    if (ymdValue) {
      setDisplayValue(toDmyFromYmd(ymdValue));
      onChange(ymdValue);
      return;
    }

    setDisplayValue(toDmyFromYmd(value));
  };

  const handleNativeDateChange = (event) => {
    const ymdValue = String(event.target.value || '').trim();
    setDisplayValue(toDmyFromYmd(ymdValue));
    onChange(ymdValue);
  };

  const openNativePicker = () => {
    if (disabled) return;
    const nativeInput = nativeDateInputRef.current;
    if (!nativeInput) return;

    if (typeof nativeInput.showPicker === 'function') {
      nativeInput.showPicker();
      return;
    }

    nativeInput.focus();
    nativeInput.click();
  };

  const nativeDateValue = toYmdFromDmy(displayValue) || String(value || '').trim() || '';

  return (
    <div className="relative w-full">
      {useNativeOverlay ? (
        <>
          <div
            className={`${className || ''} flex items-center pr-7 ${
              displayValue ? 'text-app-ink' : 'text-app-muted'
            } ${disabled ? 'cursor-not-allowed opacity-45' : ''}`}
          >
            {displayValue || placeholder}
          </div>
          <input
            ref={nativeDateInputRef}
            type="date"
            value={nativeDateValue}
            onChange={handleNativeDateChange}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            name={name}
            id={id}
            disabled={disabled}
            required={required}
          />
          <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-app-ink">
            <MonoIcon src={triangleDownIcon} colorVar="--app-text-primary" className="h-3 w-3" />
          </span>
        </>
      ) : (
        <>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder={placeholder}
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`${className || ''} pr-7`}
            name={name}
            id={id}
            disabled={disabled}
            required={required}
          />

          <input
            ref={nativeDateInputRef}
            type="date"
            value={nativeDateValue}
            onChange={handleNativeDateChange}
            tabIndex={-1}
            aria-hidden="true"
            className="pointer-events-none absolute h-0 w-0 opacity-0"
          />

          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={openNativePicker}
            disabled={disabled}
            title="Abrir calendario"
            aria-label="Abrir calendario"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-app-ink transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <MonoIcon src={triangleDownIcon} colorVar="--app-text-primary" className="h-3 w-3" />
          </button>
        </>
      )}
    </div>
  );
}
