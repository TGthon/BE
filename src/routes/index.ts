import { Express, Router } from "express";
import authRouter from './auth/router';
import calendarRouter from './calendar/router';
import eventRouter from './event/router';
import friendsRouter from './friends/router';
import voteRouter from './vote/router';

const router = Router();

// router.use('~~~~', ~~~~);
router.use('/auth', authRouter);
router.use('/calendar', calendarRouter);
router.use('/event', eventRouter);
router.use('/friends', friendsRouter);
router.use('/vote', voteRouter);

export default router;