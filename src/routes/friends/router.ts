/*
import express, { Router } from 'express';
import validatorErrorChecker from '../../middlewares/validatorErrorChecker';
import { body } from 'express-validator';
import HTTPError from '../../utils/HTTPError';

const router = Router();
router.use(express.urlencoded({ extended: false }));



export default router;
*/

import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import validatorErrorChecker from '../../middlewares/validatorErrorChecker';
import { db } from '../../database';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

const router = Router();

router.post(
  '/add',
  [
    body('userEmail').isEmail().withMessage('유저 이메일 형식이 올바르지 않습니다'),
    body('friendEmail').isEmail().withMessage('친구 이메일 형식이 올바르지 않습니다'),
    validatorErrorChecker,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    const { userEmail, friendEmail } = req.body;

    try {
      const user = await db.select().from(users).where(eq(users.email, userEmail));
      const friend = await db.select().from(users).where(eq(users.email, friendEmail));

      if (!user.length || !friend.length) {
        return res.status(404).json({ message: '사용자 또는 친구를 찾을 수 없습니다' });
      }

      // 친구 관계 저장 로직 추가 필요 (예: usersFriends 테이블이 있다면 거기에 insert)

      res.json({
        friend: {
          uid: friend[0].uid,
          name: friend[0].name,
          email: friend[0].email,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;