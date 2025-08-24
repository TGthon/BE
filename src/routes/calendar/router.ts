import express, { Router } from 'express';
import validatorErrorChecker from '../../middlewares/validatorErrorChecker';
import { body, param, query } from 'express-validator';
import HTTPError from '../../utils/HTTPError';
import jwtVerifier from '../../middlewares/jwtVerifier';
import { createCalendar, deleteSchedule, getCalendar, getCalendarDetail, patchSchedule } from './service';

const router = Router();
router.use(express.urlencoded({ extended: false }));
router.use(express.json());

// year, month는 없을 수도 있다
// 그래도 조건에 맞는 모든 값을 쿼리해 온다!
router.get('/',
    jwtVerifier,
    query("year").optional().isNumeric(),
    query("month").optional().isNumeric(),
    validatorErrorChecker,
    async (req, res, next) => {
        try {
            const uid = req.uid!;
            const year = req.query.year as string | undefined;
            const month = req.query.month as string | undefined;
            res.status(200).json(await getCalendar(uid, year, month));
        }
        catch(e) {
            next(e);
        }
    }
)

router.get('/:scheduleid',
    jwtVerifier,
    param("scheduleid").isNumeric().notEmpty(),
    validatorErrorChecker,
    async (req, res, next) => {
        try {
            const uid = req.uid!;
            const scheduleid = parseInt(req.params.scheduleid);
            res.status(200).json(await getCalendarDetail(uid, scheduleid));
        }
        catch(e) {
            next(e);
        }
    }
)

router.post('/',
  jwtVerifier,
  body('name').isString().notEmpty(),
  body('start').isNumeric().notEmpty(),
  body('end').isNumeric().notEmpty(),
  body('color').optional().isString(),
  body('note').optional().isString(),
  body('users').notEmpty().isArray(),
  body('users.*').toInt(),
  validatorErrorChecker,
  async (req, res, next) => {
    try {
      const uid = req.uid!;
      const { name, start, end, color, note, users } = req.body;

      const newEvent = await createCalendar({
        uid,
        name,
        start,
        end,
        color,
        note,
        users,
      });

      res.status(201).json({ success: true, event: newEvent });
    } catch (e) {
      next(e);
    }
  }
);

router.delete('/:scheduleid', 
  jwtVerifier,
  param("scheduleid").isNumeric().notEmpty(),
  validatorErrorChecker,
  async (req, res, next) => {
    try {
      const uid = req.uid!;
      const scheduleid = parseInt(req.params.scheduleid);

      await deleteSchedule(uid, scheduleid);
      res.status(200).json({ ok: true });
    }
    catch(e) {
      next(e);
    }
  }
)

// PATCH 쓰려고 했는데 프론트쪽에 PATCH호출하는 코드가없다
// 그냥 PUT써야지
router.put('/:scheduleid',
  jwtVerifier,
  param("scheduleid").isNumeric().notEmpty(),
  body("color").optional().isString(),
  body("memo").optional().isString(),
  body("users").optional(),
  body("users.*").toInt(),
  body("start").optional().toInt(),
  body("end").optional().toInt(),
  validatorErrorChecker,
  async (req, res, next) => {
    try {
      const uid = req.uid!;
      const scheduleid = parseInt(req.params.scheduleid);
      const color: string | undefined = req.body.color;
      const memo: string | undefined = req.body.memo;
      const userList: number[] | undefined = req.body.users;
      const start: number | undefined = req.body.start;
      const end: number | undefined = req.body.end;

      await patchSchedule(uid, scheduleid, color, memo, userList, start, end);
      res.status(200).json({ ok: true });
    }
    catch(e) {
      next(e);
    }
  }
)

export default router;