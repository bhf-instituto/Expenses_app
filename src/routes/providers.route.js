import { Router } from 'express';
import { requireUser } from '../middlewares/requireUser.middleware.js';
import { checkSetAccess } from '../middlewares/checkSetAccess.middleware.js';
import { attachProviderContext } from '../middlewares/attachProviderContext.middleware.js';
import { deleteProvider, editProvider } from '../controllers/providers.controller.js'

const router = Router();
router.use(requireUser)

router.delete('/:id_provider',
    attachProviderContext,
    checkSetAccess(true, true),
    deleteProvider
);
router.put(
    '/:id_provider',
    attachProviderContext,
    checkSetAccess(true, true), 
    editProvider
);

export default router;