import express, { Router } from 'express';
import validatorErrorChecker from '../../middlewares/validatorErrorChecker';
import { body, param, query } from 'express-validator';
import { googleAppLogin, noSecurityLogin, refresh, /* googleLogin */ } from './service';
import 'dotenv';
import HTTPError from '../../utils/HTTPError';

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

            if (type == "web") {
                // let loginResult = await googleLogin(
                //     code,
                //     process.env.CLIENT_SECRET_GOOGLE_WEB!.trim(),
                //     process.env.CLIENT_ID_GOOGLE_WEB!.trim()
                // );
                let loginResult = await googleAppLogin(
                    code,
                    process.env.CLIENT_ID_GOOGLE_WEB!.trim()
                );

                res.status(200).json(loginResult);
            }
            else if (type == "android") {
                let loginResult = await googleAppLogin(
                    code,
                    process.env.CLIENT_ID_GOOGLE_ANDROID!.trim()
                );

                res.status(200).json(loginResult);
            }
            else if(type == "none") {
                let loginResult = await noSecurityLogin(
                    code
                );

                res.status(200).json(loginResult);
            }
            else {
                throw new HTTPError(400, "Invalid type");
            }
        }
        catch(e) {
            next(e);
        }
    }
)

router.post("/refresh", 
    body("uid").isNumeric().notEmpty(),
    body("refreshToken").isString().notEmpty(),
    validatorErrorChecker,
    async (req, res, next) => {
        try {
            const uid = parseInt(req.body.uid);
            const refreshToken = req.body.refreshToken as string;
            let accessToken = await refresh(uid, refreshToken);

            res.status(200).json({
                accessToken
            });
        }
        catch(e) {
            next(e);
        }
    }
)

router.get("/googleCallback",
    query("code").isString().notEmpty(),
    query("state").isString().notEmpty(),
    validatorErrorChecker,
    async (req, res, next) => {
        try {
            const token = req.query.code as string;
            const state = req.query.state as string;
            res.redirect(`daypick://?code=${encodeURIComponent(token)}&state=${encodeURIComponent(state)}`)
        }
        catch(e) {
            next(e);
        }
    }
)

export default router;