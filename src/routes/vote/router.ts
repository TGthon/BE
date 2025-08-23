import express, { Router } from 'express';
import validatorErrorChecker from '../../middlewares/validatorErrorChecker';
import { body, param } from 'express-validator';
import HTTPError from '../../utils/HTTPError';
import jwtVerifier from '../../middlewares/jwtVerifier';
import { vote } from './service';

const router = Router();
router.use(express.urlencoded({ extended: false }));
router.use(express.json());

router.post('/:eventid', 
    jwtVerifier,
    param('eventid').isNumeric().notEmpty(),
    body('time').toInt().notEmpty(),
    body('type').isString().notEmpty(),
    validatorErrorChecker,
    async (req, res, next) => {
        try {
            const uid = req.uid!;
            const eventid = parseInt(req.params.eventid);
            const time = req.body.time as number;
            const type = req.body.type as string;
            
            await vote(uid, eventid, time, type);
            res.status(200).json({ ok: true });
        }
        catch(e) {
            next(e);
        }
    }
)

export default router;