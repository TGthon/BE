import express, { Router } from 'express';
import validatorErrorChecker from '../../middlewares/validatorErrorChecker';
import { body } from 'express-validator';
import HTTPError from '../../utils/HTTPError';
import jwtVerifier from '../../middlewares/jwtVerifier';

const router = Router();
router.use(express.urlencoded({ extended: false }));

router.get('/me', 
    jwtVerifier,
    async (req, res, next) => {
        try {

        }
        catch(e) {
            next(e);
        }
    }
)

export default router;