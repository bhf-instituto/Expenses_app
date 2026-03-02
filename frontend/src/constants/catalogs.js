export const EXPENSE_TYPES = [
  { id: 1, key: 'fijo', label: 'FIJO', shortLabel: 'Fijo', categoryTitle: 'Categorias fijas', accent: 'bg-app-mint/35' },
  { id: 2, key: 'variable', label: 'VARIABLE', shortLabel: 'Variable', categoryTitle: 'Categorias variables', accent: 'bg-app-mint/45' },
  { id: 3, key: 'proveedor', label: 'PROVEEDOR', shortLabel: 'Proveedor', categoryTitle: 'Proveedores', accent: 'bg-app-mint/55' },
];

export const PAYMENT_METHODS = [
  { id: 1, label: 'Efectivo', shortLabel: 'Efectivo' },
  { id: 2, label: 'Tarjeta credito', shortLabel: 'Credito' },
  { id: 3, label: 'Tarjeta debito', shortLabel: 'Debito' },
];

export const getExpenseTypeByKey = (key) => EXPENSE_TYPES.find((type) => type.key === key);

export const getExpenseTypeById = (id) => EXPENSE_TYPES.find((type) => type.id === Number(id));

export const getPaymentMethodById = (id) => PAYMENT_METHODS.find((item) => item.id === Number(id));
