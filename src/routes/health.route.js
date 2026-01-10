import { Router } from 'express';
import { healthDb, healthUser } from '../controllers/health.controller.js'
import checkToken from '../middlewares/checkToken.middleware.js';

const router = Router();

router.get('/me', checkToken, healthUser)
router.get('/db', healthDb)

export default router;