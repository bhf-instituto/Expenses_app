import { Router } from 'express';
import { createSet, getAllSets, editSetName, deleteSet, getSet } from '../controllers/set.controller.js';
import { createCategory, getAllCategoriesFromSet } from '../controllers/category.controller.js';
import { getProvidersBySet } from '../controllers/providers.controller.js';
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
router.post('/:id_set/providers', checkSetAccess(true), getProvidersBySet)
// router.get('/:id_set/providers')

export default router;