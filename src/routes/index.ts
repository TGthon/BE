import { Express, Router } from "express";
import authRouter from './auth/router';

const router = Router();

// router.use('~~~~', ~~~~);
router.use('/auth', authRouter);

export default router;