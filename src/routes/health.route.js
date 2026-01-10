import { Router } from 'express';
import { healthDb, healthUser } from '../controllers/health.controller.js'
import checkToken from '../middlewares/checkToken.middleware.js';
import { requireUser } from '../middlewares/requireUser.middleware.js'

const router = Router();

router.get('/me', checkToken, requireUser, healthUser)
router.get('/db', healthDb)

export default router;