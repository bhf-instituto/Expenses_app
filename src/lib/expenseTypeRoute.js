import { EXPENSE_TYPE } from '../constants/expenseTypes.js'

export function toExpenseTypeSlug(expenseType) {
  return Number(expenseType) === EXPENSE_TYPE.FIXED ? 'fijo' : 'variable'
}

export function fromExpenseTypeSlug(slug) {
  if (slug === 'fijo') return EXPENSE_TYPE.FIXED
  if (slug === 'variable') return EXPENSE_TYPE.VARIABLE
  return null
}

export function getExpenseTypePageTitle(expenseType) {
  return Number(expenseType) === EXPENSE_TYPE.FIXED
    ? 'Categorias de gasto fijo'
    : 'Categorias de gasto variable'
}
