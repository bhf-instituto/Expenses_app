import { Router } from 'express';
import { createInvite, acceptInvite } from '../controllers/invite.controller.js'
import { requireUser } from '../middlewares/requireUser.middleware.js';
import { checkSetAccess } from '../middlewares/checkSetAccess.middleware.js';

const router = Router();

router.get('/:id_set', requireUser, checkSetAccess(true), createInvite);
router.post('/', requireUser, acceptInvite);

export default router;