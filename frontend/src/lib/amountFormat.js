const stripToDigits = (value) => String(value ?? '').replace(/\D+/g, '');

export const formatAmountInput = (value) => {
  const digits = stripToDigits(value);
  if (!digits) return '';

  return Number(digits).toLocaleString('es-AR');
};

export const parseAmountInput = (value) => {
  const digits = stripToDigits(value);
  if (!digits) return NaN;

  return Number(digits);
};

