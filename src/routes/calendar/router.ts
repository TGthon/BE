import express, { Router } from 'express';
import validatorErrorChecker from '../../middlewares/validatorErrorChecker';
import { body, query } from 'express-validator';
import HTTPError from '../../utils/HTTPError';
import jwtVerifier from '../../middlewares/jwtVerifier';
import { createCalendar, getCalendar } from './service';

const router = Router();
router.use(express.urlencoded({ extended: false }));
router.use(express.json());

// year, month는 없을 수도 있다
// 그래도 조건에 맞는 모든 값을 쿼리해 온다!
router.get('/',
    jwtVerifier,
    query("year").isNumeric(),
    query("month").isNumeric(),
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

export default router;