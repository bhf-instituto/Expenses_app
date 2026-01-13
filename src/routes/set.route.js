import { Router } from 'express';
import { createSet } from '../controllers/set.controller.js'
import checkToken from '../middlewares/checkToken.middleware.js';
import { requireUser } from '../middlewares/requireUser.middleware.js';

const router = Router();

router.use(requireUser)

router.post('/create', createSet);

export default router;