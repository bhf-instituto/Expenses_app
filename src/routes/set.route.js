import { Router } from 'express';
import { createSet, getAllSets, getSetUsers, editSetName, deleteSet, getSet, removeSetUser } from '../controllers/set.controller.js';
import { createCategory, getAllCategoriesFromSet } from '../controllers/category.controller.js';
import { createExpense, getExpenses, getDeletedExpenses, getExpenseTotals, getExpenseTotalsFiltered } from '../controllers/expenses.controller.js';
import { createIncome, getIncomes, getIncomeAnalytics } from '../controllers/income.controller.js';
import { requireUser } from '../middlewares/requireUser.middleware.js';
import { checkSetAccess } from '../middlewares/checkSetAccess.middleware.js';

const router = Router();

router.use(requireUser)

// sets
router.get('/', getAllSets);
router.post('/', createSet);
router.get('/:id_set', checkSetAccess(), getSet)
router.get('/:id_set/users', checkSetAccess(), getSetUsers)
router.delete('/:id_set/users/:id_user', checkSetAccess(true), removeSetUser)
router.put('/:id_set', checkSetAccess(true), editSetName)
router.delete('/:id_set', checkSetAccess(true), deleteSet)

// categories create, list
router.post('/:id_set/categories', checkSetAccess(true), createCategory);
router.get('/:id_set/categories', checkSetAccess(), getAllCategoriesFromSet)

// expenses create, list
router.post('/:id_set/expenses', checkSetAccess(), createExpense);
router.get('/:id_set/expenses', checkSetAccess(), getExpenses);
router.get('/:id_set/expenses/deleted', checkSetAccess(), getDeletedExpenses);
router.get('/:id_set/expenses/totals', checkSetAccess(), getExpenseTotals);
router.get('/:id_set/expenses/totalsFiltered', checkSetAccess(), getExpenseTotalsFiltered);

// incomes create (admin only)
router.post('/:id_set/incomes', checkSetAccess(true), createIncome);
router.get('/:id_set/incomes', checkSetAccess(), getIncomes);
router.get('/:id_set/incomes/analytics', checkSetAccess(), getIncomeAnalytics);

export default router;
