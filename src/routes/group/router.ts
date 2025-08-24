import express, { Router, Request, Response, NextFunction } from 'express';
import validatorErrorChecker from '../../middlewares/validatorErrorChecker';
import { body } from 'express-validator';
import HTTPError from '../../utils/HTTPError';
import { db } from '../../database';
import { users, userFriends, usersGroups, groups } from '../../drizzle/schema';
import { and, eq, or, inArray } from 'drizzle-orm';
import jwtVerifier from '../../middlewares/jwtVerifier';

const router = Router();
router.use(express.urlencoded({ extended: false }));
router.use(express.json());
router.use(jwtVerifier);

router.post('/groupadd', async (req, res) => {
    const { name, memberIds } = req.body;

    if (!name || !Array.isArray(memberIds)) {
        return res.status(400).json({ error: "그룹명과 멤버 목록이 필요합니다." });
    }

    try {
        // 1. 그룹 생성
        const [newGroup] = await db.insert(groups).values({
            groupName: name
        });
        const gid = newGroup.insertId;

        // 2. 멤버 연결
        await db.insert(usersGroups).values(
            memberIds.map(uid => ({
                uid,
                gid
            }))
        );


        res.json({ success: true, groupId: gid });
    } catch (err) {
        console.error("그룹 저장 실패:", err);
        res.status(500).json({ error: "서버 오류" });
    }
});

router.get('/grouplist', async (req: Request, res: Response, next: NextFunction) => {
  const userUid = Number(req.uid); // 인증된 사용자 UID

  try {
    // 현재 사용자가 속한 그룹 관계 조회
    const relations = await db
      .select()
      .from(usersGroups)
      .where(eq(usersGroups.uid, userUid));

    const groupIds = relations.map(rel => rel.gid);

    if (groupIds.length === 0) {
      return res.json({ groups: [] });
    }

    // 그룹 ID 목록으로 그룹 정보 조회
    const grouplist = await db
      .select({
        id: groups.gid,
        name: groups.groupName,
      })
      .from(groups)
      .where(inArray(groups.gid, groupIds));

    res.json({ grouplist });
  } catch (err) {
    next(err);
  }
});

export default router;

