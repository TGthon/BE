import express, { Router } from 'express';
import validatorErrorChecker from '../../middlewares/validatorErrorChecker';
import { body, query } from 'express-validator';
import HTTPError from '../../utils/HTTPError';
import jwtVerifier from '../../middlewares/jwtVerifier';
import { getCalendar } from './service';

const router = Router();
router.use(express.urlencoded({ extended: false }));

router.get('/',
    //jwtVerifier,
    query("month").isNumeric(),
    validatorErrorChecker,
    async (req, res, next) => {
        try {
            const uid = req.uid!;
            const month = req.query.month as string;
            res.status(200).json(await getCalendar(uid, month));
        }
        catch(e) {
            next(e);
        }
    }
)

export default router;