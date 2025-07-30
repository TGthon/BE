import express, { Router } from 'express';
import validatorErrorChecker from '../../middlewares/validatorErrorChecker';
import { body } from 'express-validator';
import { googleLogin } from './service';
import 'dotenv';

const router = Router();
router.use(express.urlencoded({ extended: false }));

router.post('/login', 
    body("type").isString().notEmpty(),
    body("code").isString().notEmpty(),
    validatorErrorChecker,
    async (req, res, next) => {
        try {
            const type = req.body.type as string;
            const code = req.body.code as string;

            if(type == "google-web") {
                let loginResult = await googleLogin(
                    code,
                    process.env.CLIENT_SECRET_GOOGLE_WEB!.trim(),
                    process.env.CLIENT_ID_GOOGLE_WEB!.trim()
                );

                res.status(200).json(loginResult);
            }
            else {
                res.status(400).json({
                    ok: false,
                    reason: "Invalid type"
                });
            }
        }
        catch(e) {
            next(e);
        }
    }
)

export default router;