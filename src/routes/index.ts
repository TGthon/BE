import { Express, Router } from "express";
import authRouter from './auth/router';
import calendarRouter from './calendar/router';
import eventRouter from './event/router';
import friendsRouter from './friends/router';
import profileRouter from './profile/router';
import voteRouter from './vote/router';
import groupRouter from './group/router';

const router = Router();

// router.use('~~~~', ~~~~);
router.use('/auth', authRouter);
router.use('/calendar', calendarRouter);
router.use('/event', eventRouter);
router.use('/friends', friendsRouter);
router.use('/profile', profileRouter);
router.use('/vote', voteRouter);
router.use('/group', groupRouter);

export default router;