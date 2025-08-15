import express, { Router } from 'express';
import validatorErrorChecker from '../../middlewares/validatorErrorChecker';
import { body } from 'express-validator';
import HTTPError from '../../utils/HTTPError';
import jwtVerifier from '../../middlewares/jwtVerifier';
import { getEventlist } from './service';

const router = Router();
router.use(express.urlencoded({ extended: false }));

router.get('/', 
    jwtVerifier,
    async (req, res, next) => {
        try {
            const uid = req.uid!;
            res.status(200).json({
                events: await getEventlist(uid)
            });
        }
        catch(e) {
            next(e);
        }
    }
)

export default router;