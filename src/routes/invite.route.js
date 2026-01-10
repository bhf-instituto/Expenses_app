import { Router } from 'express';
import { createInvite, acceptInvite } from '../controllers/invite.controller.js'
// import checkToken from '../middlewares/checkToken.middleware.js';
import { requireUser } from '../middlewares/requireUser.middleware.js';
import { checkGroupAccess } from '../middlewares/checkGroupAccess.middleware.js';

const router = Router();

router.post('/:id_group/create', requireUser, checkGroupAccess, createInvite);
router.post('/accept', acceptInvite);

export default router;