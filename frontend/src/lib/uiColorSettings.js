import { getCachedUiColorSettings, setCachedUiColorSettings } from './localCache.js';

const clampChannel = (value) => {
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) return 0;
  return Math.max(0, Math.min(255, Math.round(normalized)));
};

const normalizeTriplet = (value, fallback) => {
  const raw = String(value || '').trim();
  const channels = raw.split(/\s+/).map((channel) => clampChannel(channel));
  if (channels.length !== 3) return fallback;
  return `${channels[0]} ${channels[1]} ${channels[2]}`;
};

export const DEFAULT_UI_COLOR_SETTINGS = {
  expenseType: {
    '1': { text: '223 208 184', bg: '27 45 66' },
    '2': { text: '223 208 184', bg: '23 58 84' },
    '3': { text: '223 208 184', bg: '30 64 128' },
  },
  paymentMethod: {
    '1': { text: '223 208 184', bg: '35 75 51' },
    '2': { text: '223 208 184', bg: '87 58 45' },
    '3': { text: '223 208 184', bg: '48 69 93' },
  },
  analyticsSeries: {
    expense: { color: '148 137 121' },
    income: { color: '216 249 153' },
    balance: { color: '223 208 184' },
  },
};

const mergeColorGroup = (incomingGroup, defaultGroup) =>
  Object.fromEntries(
    Object.entries(defaultGroup).map(([id, defaults]) => {
      const current = incomingGroup?.[id] || {};
      return [
        id,
        {
          text: normalizeTriplet(current.text, defaults.text),
          bg: normalizeTriplet(current.bg, defaults.bg),
        },
      ];
    })
  );

const mergeSingleColorGroup = (incomingGroup, defaultGroup) =>
  Object.fromEntries(
    Object.entries(defaultGroup).map(([id, defaults]) => {
      const current = incomingGroup?.[id] || {};
      return [
        id,
        {
          color: normalizeTriplet(current.color, defaults.color),
        },
      ];
    })
  );

export const normalizeUiColorSettings = (settings) => ({
  expenseType: mergeColorGroup(settings?.expenseType, DEFAULT_UI_COLOR_SETTINGS.expenseType),
  paymentMethod: mergeColorGroup(settings?.paymentMethod, DEFAULT_UI_COLOR_SETTINGS.paymentMethod),
  analyticsSeries: mergeSingleColorGroup(
    settings?.analyticsSeries,
    DEFAULT_UI_COLOR_SETTINGS.analyticsSeries
  ),
});

export const getScopedUiColorSettings = (scope) =>
  normalizeUiColorSettings(getCachedUiColorSettings(scope));

export const setScopedUiColorSettings = (settings, scope) => {
  const normalized = normalizeUiColorSettings(settings);
  setCachedUiColorSettings(normalized, scope);
  return normalized;
};

const HEX_REGEX = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;

export const hexToRgbTriplet = (hex, fallback = '255 255 255') => {
  const match = HEX_REGEX.exec(String(hex || '').trim());
  if (!match) return fallback;
  const [, r, g, b] = match;
  return `${parseInt(r, 16)} ${parseInt(g, 16)} ${parseInt(b, 16)}`;
};

export const rgbTripletToHex = (triplet, fallback = '#ffffff') => {
  const normalized = normalizeTriplet(triplet, null);
  if (!normalized) return fallback;
  const [r, g, b] = normalized.split(' ').map((channel) => clampChannel(channel));
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
};

const normalizeChoiceId = (value) => {
  const normalized = Number(value);
  return Number.isInteger(normalized) && normalized > 0 ? normalized : 1;
};

export const getExpenseTypeTextVarName = (typeId) => `--app-expense-type-${normalizeChoiceId(typeId)}-text`;
export const getExpenseTypeBgVarName = (typeId) => `--app-expense-type-${normalizeChoiceId(typeId)}-bg`;
export const getPaymentMethodTextVarName = (paymentMethodId) =>
  `--app-payment-method-${normalizeChoiceId(paymentMethodId)}-text`;
export const getPaymentMethodBgVarName = (paymentMethodId) =>
  `--app-payment-method-${normalizeChoiceId(paymentMethodId)}-bg`;
export const getChartSeriesColorVarName = (seriesKey) => {
  const normalized = String(seriesKey || '').trim().toLowerCase();
  if (normalized === 'income') return '--app-chart-income-color';
  if (normalized === 'balance') return '--app-chart-balance-color';
  return '--app-chart-expense-color';
};

export const applyUiColorSettingsToDocument = (settings) => {
  if (typeof document === 'undefined') return;
  const rootStyle = document.documentElement?.style;
  if (!rootStyle) return;

  const normalized = normalizeUiColorSettings(settings);
  Object.entries(normalized.expenseType).forEach(([id, colorSet]) => {
    rootStyle.setProperty(getExpenseTypeTextVarName(id), colorSet.text);
    rootStyle.setProperty(getExpenseTypeBgVarName(id), colorSet.bg);
  });
  Object.entries(normalized.paymentMethod).forEach(([id, colorSet]) => {
    rootStyle.setProperty(getPaymentMethodTextVarName(id), colorSet.text);
    rootStyle.setProperty(getPaymentMethodBgVarName(id), colorSet.bg);
  });
  Object.entries(normalized.analyticsSeries).forEach(([seriesKey, colorSet]) => {
    rootStyle.setProperty(getChartSeriesColorVarName(seriesKey), colorSet.color);
  });
};
