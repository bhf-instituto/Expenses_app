import { Router } from 'express';
import { requireUser } from '../middlewares/requireUser.middleware.js';
import { attachExpenseContext } from '../middlewares/attachExpenseContext.middleware.js';
import { checkSetAccess } from '../middlewares/checkSetAccess.middleware.js';
import { checkExpenseAccess } from '../middlewares/checkExpenseAccess.middleware.js'
import { updateExpense, deleteExpense } from '../controllers/expenses.controller.js';

const router = Router();

router.use(requireUser);

// categories edit, delete
router.put('/:id_expense',
    attachExpenseContext,
    checkSetAccess(false, true),
    checkExpenseAccess({ allowOwner: true }),
    updateExpense
);

router.delete(
    '/:id_expense',
    attachExpenseContext,
    checkSetAccess(true, true),
    checkExpenseAccess({ allowOwner: true }),
    deleteExpense
);

export default router;