import { Router } from 'express';
import { requireUser } from '../middlewares/requireUser.middleware.js';
import { attachExpenseContext } from '../middlewares/attachExpenseContext.middleware.js';
import { checkSetAccess } from '../middlewares/checkSetAccess.middleware.js';
import { editExpenses } from '../controllers/expenses.controller.js';

const router = Router();

router.use(requireUser);

// categories edit, delete
router.put('/:id_expense',
    attachExpenseContext,
    checkSetAccess(true, true),
    editExpenses
);

// router.delete('/:id_expense',
//     // attachCategoryContext,
//     checkSetAccess(true, true),
//     deleteCategory
// );

export default router;