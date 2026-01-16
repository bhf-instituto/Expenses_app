import { Router } from 'express';
import { requireUser } from '../middlewares/requireUser.middleware.js';
import { attachCategoryContext } from '../middlewares/attachCategoryContext.middleware.js';
import { checkSetAccess } from '../middlewares/checkSetAccess.middleware.js';
import { editCategory, deleteCategory } from '../controllers/category.controller.js';

const router = Router();

router.use(requireUser);

// categories edit, delete
router.put('/:id_category',
    attachCategoryContext,
    checkSetAccess(true, true),
    editCategory
);

router.delete('/:id_category',
    attachCategoryContext,
    checkSetAccess(true, true),
    deleteCategory
);

export default router;