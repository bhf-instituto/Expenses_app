import { Router } from 'express';
import { createSet } from '../controllers/set.controller.js'
import checkToken from '../middlewares/checkToken.middleware.js';

const router = Router();

router.post('/create', createSet);

export default router;