import express, { Router } from 'express';
import validatorErrorChecker from '../../middlewares/validatorErrorChecker';
import { body, param } from 'express-validator';
import HTTPError from '../../utils/HTTPError';
import jwtVerifier from '../../middlewares/jwtVerifier';
import { vote, voteDay } from './service';

const router = Router();
router.use(express.urlencoded({ extended: false }));
router.use(express.json());

export type Vote = {
    time: number,
    type: string
};

router.post('/:eventid', 
    jwtVerifier,
    param('eventid').isNumeric().notEmpty(),
    body('*.time').toInt().notEmpty(),
    body('*.type').isString().notEmpty(),
    validatorErrorChecker,
    async (req, res, next) => {
        try {
            const uid = req.uid!;
            const eventid = parseInt(req.params.eventid);
            const votes: Vote[] = req.body;
            
            await vote(uid, eventid, votes);
            res.status(200).json({ ok: true });
        }
        catch(e) {
            next(e);
        }
    }
)

router.post("/:eventid/day", 
    jwtVerifier,
    param('eventid').isNumeric().notEmpty(), 
    body("*.time").toInt().notEmpty(),
    body("*.type").isString().notEmpty(),
    validatorErrorChecker,
    async (req, res, next) => {
        try {
            const uid = req.uid!;
            const eventid = parseInt(req.params.eventid);
            const votes: Vote[] = req.body;

            await voteDay(uid, eventid, votes);
            res.status(200).json({ ok: true });
        }
        catch(e) {
            next(e);
        }
    }
)

export default router;