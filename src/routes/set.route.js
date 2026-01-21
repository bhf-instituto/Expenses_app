import { Router } from 'express';
import { createSet, getAllSets, editSetName, deleteSet, getSet } from '../controllers/set.controller.js';
import { createCategory, getAllCategoriesFromSet } from '../controllers/category.controller.js';
import { createProvider, getProviders } from '../controllers/providers.controller.js';
import { createExpense, getExpenses } from '../controllers/expenses.controller.js';
import { requireUser } from '../middlewares/requireUser.middleware.js';
import { checkSetAccess } from '../middlewares/checkSetAccess.middleware.js';

const router = Router();

router.use(requireUser)

// sets
router.get('/', getAllSets);
router.post('/', createSet);
router.get('/:id_set', checkSetAccess(), getSet)
router.put('/:id_set', checkSetAccess(true), editSetName)
router.delete('/:id_set', checkSetAccess(true), deleteSet)

// categories create, list
router.post('/:id_set/categories', checkSetAccess(true), createCategory);
router.get('/:id_set/categories', checkSetAccess(), getAllCategoriesFromSet)

// providers create, list
router.post('/:id_set/providers', checkSetAccess(true), createProvider);
router.get('/:id_set/providers', checkSetAccess(), getProviders)

// expenses create, list
router.post('/:id_set/expenses', checkSetAccess(), createExpense);
router.get('/:id_set/expenses', checkSetAccess(), getExpenses);
 
export default router;