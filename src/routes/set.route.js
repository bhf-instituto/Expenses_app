import { Router } from 'express';
import { createSet, getAllSets } from '../controllers/set.controller.js';
import { requireUser } from '../middlewares/requireUser.middleware.js';

const router = Router();

router.use(requireUser)

router.post('/create', createSet);
router.get('/all', getAllSets)

export default router;