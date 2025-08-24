import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import validatorErrorChecker from '../../middlewares/validatorErrorChecker';
import { db } from '../../database';
import { users, userFriends, usersGroups, groups } from '../../drizzle/schema';
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
                    picture: friend[0].profilePicture
                },
            });
        } catch (err) {
            next(err);
        }
    }
);

router.get('/list', async (req: Request, res: Response, next: NextFunction) => {
    const userUid = req.uid!;

    try {
        const friends = await db.select({uid: users.uid, name: users.name, email: users.email, picture: users.profilePicture}).from(users)
        .innerJoin(userFriends, eq(users.uid, userFriends.uid1))
        .where(eq(userFriends.uid2, userUid))
        .union(db.select({uid: users.uid, name: users.name, email: users.email, picture: users.profilePicture}).from(users)
        .innerJoin(userFriends, eq(users.uid, userFriends.uid2))
        .where(eq(userFriends.uid1, userUid)));

        res.json({ friends });
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    const friendUid = req.params.id;
    const uid = req.uid!;

    try {
        // 현재 로그인한 유저 정보 가져오기
        const user = await db.select().from(users).where(eq(users.uid, uid));
        if (!user.length) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        // 친구 관계 삭제
        const targetUid = Number(friendUid);
        await db
            .delete(userFriends)
            .where(
                or(
                    and(
                        eq(userFriends.uid1, uid),
                        eq(userFriends.uid2, targetUid)
                    ),
                    and(
                        eq(userFriends.uid1, targetUid),
                        eq(userFriends.uid2, uid)
                    )
                )

            );

        return res.status(200).json({ message: '친구가 성공적으로 삭제되었습니다.' });
    } catch (err) {
        next(err);
    }
});

export default router;