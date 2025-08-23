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
import { users, userFriends } from '../../drizzle/schema';
import { and, eq, or, inArray } from 'drizzle-orm';
import jwtVerifier from '../../middlewares/jwtVerifier';

const router = Router();
router.use(jwtVerifier);

router.post(
    '/add',
    [
        body('friendEmail').isEmail().withMessage('친구 이메일 형식이 올바르지 않습니다'),
        validatorErrorChecker,
    ],
    async (req: Request, res: Response, next: NextFunction) => {
    console.log('req.uid:', req.uid);

        const { friendEmail } = req.body;
        const userUid = Number(req.uid);

        try {
            const user = await db.select().from(users).where(eq(users.uid, userUid));
            const friend = await db.select().from(users).where(eq(users.email, friendEmail));

            if (!user.length || !friend.length) {
                return res.status(404).json({ message: '사용자 또는 친구를 찾을 수 없습니다' });
            }

            const existing = await db
                .select()
                .from(userFriends)
                .where(
                    or(
                        and(
                            eq(userFriends.uid1, user[0].uid),
                            eq(userFriends.uid2, friend[0].uid)
                        ),
                        and(
                            eq(userFriends.uid1, friend[0].uid),
                            eq(userFriends.uid2, user[0].uid)
                        )
                    )
                );

            if (existing.length) {
                return res.status(400).json({ message: '이미 친구로 추가되어 있습니다' });
            }

            // 친구 관계 저장
            await db.insert(userFriends).values({
                uid1: user[0].uid,
                uid2: friend[0].uid,
            });


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

router.get('/list', async (req: Request, res: Response, next: NextFunction) => {
  const userUid = Number(req.uid);

  try {
    // 현재 사용자가 uid1인 친구 관계 조회
    const relations = await db
      .select()
      .from(userFriends)
      .where(eq(userFriends.uid1, userUid));

    const friendUids = relations.map(rel => rel.uid2);

    if (friendUids.length === 0) {
      return res.json({ friends: [] });
    }

    // 친구 UID 목록으로 사용자 정보 조회
    const friends = await db
      .select({
        uid: users.uid,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(inArray(users.uid, friendUids));

    res.json({ friends });
  } catch (err) {
    next(err);
  }
});


export default router;