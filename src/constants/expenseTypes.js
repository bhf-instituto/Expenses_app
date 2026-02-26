export const EXPENSE_TYPE = {
  FIXED: 1,
  VARIABLE: 2,
}

export function getExpenseTypeLabel(expenseType) {
  if (Number(expenseType) === EXPENSE_TYPE.FIXED) return 'FIJO'
  if (Number(expenseType) === EXPENSE_TYPE.VARIABLE) return 'VARIABLE'
  return 'DESCONOCIDO'
}
