import { Router } from 'express';
import { checkGroupAccess } from '../middlewares/checkGroupAccess.middleware.js';
import { createCategory, getAllCategoriesFromSet } from '../controllers/category.controller.js';
import { requireUser } from '../middlewares/requireUser.middleware.js';

const router = Router();

router.use(requireUser)

router.post('/create/:id_set', checkGroupAccess,  createCategory);
router.get('/all/:id_set', checkGroupAccess, getAllCategoriesFromSet)

export default router;