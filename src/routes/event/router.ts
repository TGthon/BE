import express, { Router } from 'express';
import validatorErrorChecker from '../../middlewares/validatorErrorChecker';
import { body, param } from 'express-validator';
import HTTPError from '../../utils/HTTPError';
import jwtVerifier from '../../middlewares/jwtVerifier';
import { changeEventname, createEvent, exitEvent, getEventInfo, getEventlist, joinEvent } from './service';

const router = Router();
router.use(express.json());
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

router.post('/', 
    jwtVerifier,
    body("start").toInt().notEmpty(),
    body("end").toInt().notEmpty(),
    body("users").isArray().notEmpty(),
    body("users.*").toInt(),
    body("groups").isArray().notEmpty(),
    body("groups.*").toInt(),
    body("duration").toInt().notEmpty(),
    body("name").isString().notEmpty(),
    validatorErrorChecker,
    async (req, res, next) => {
        try {
            let start = req.body.start as number;
            let end = req.body.end as number;
            let users = req.body.users as number[];
            let groups = req.body.groups as number[];
            let duration = req.body.duration as number;
            let name = req.body.name as string;

            let eventid = await createEvent(req.uid!, {
                start,
                end,
                users,
                groups,
                duration,
                name,
            });
            res.status(200).json({ eventid });
        }
        catch(e) {
            next(e);
        }
    }
)

router.get("/:eventid", 
    jwtVerifier,
    param("eventid").isNumeric().notEmpty(),
    validatorErrorChecker,
    async (req, res, next) => {
        try {
            const uid = req.uid!;
            const eventid = parseInt(req.params.eventid);

            let result = await getEventInfo(uid, eventid);
            res.status(200).json(result);
        }
        catch(e) {
            next(e);
        }
    }
)

router.post("/:eventid/user", 
    jwtVerifier,
    param("eventid").isNumeric().notEmpty(),
    body("user").toInt().notEmpty(),
    validatorErrorChecker,
    async (req, res, next) => {
        try {
            let eventid = parseInt(req.params.eventid);
            let user = req.body.user as number;

            await joinEvent(user, eventid, req.uid!);
            res.status(200).send({ok: true});
        }
        catch(e) {
            next(e);
        }
    }
)

router.put("/:eventid/name",
    jwtVerifier,
    param("eventid").isNumeric().notEmpty(),
    body("name").isString().notEmpty(),
    validatorErrorChecker,
    async (req, res, next) => {
        try {
            let eventid = parseInt(req.params.eventid);
            let name = req.body.name as string;

            await changeEventname(req.uid!, eventid, name);
            res.status(200).json({ name });
        }
        catch(e) {
            next(e);
        }
    }
)

// 이벤트에서 탈퇴한다!
router.delete("/:eventid/user/me",
    jwtVerifier,
    param("eventid").isNumeric().notEmpty(),
    validatorErrorChecker,
    async (req, res, next) => {
        try {
            let eventid = parseInt(req.params.eventid);

            await exitEvent(req.uid!, eventid);
            res.status(200).json({ ok: true });
        }
        catch(e) {
            next(e);
        }
    }
)

export default router;