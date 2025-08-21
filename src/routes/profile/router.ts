import express, { Router } from 'express';
import validatorErrorChecker from '../../middlewares/validatorErrorChecker';
import { body } from 'express-validator';
import HTTPError from '../../utils/HTTPError';
import jwtVerifier from '../../middlewares/jwtVerifier';
import { getProfile } from './service';
import Busboy from 'busboy';

const router = Router();
router.use(express.urlencoded({ extended: false }));

router.get('/me', 
    jwtVerifier,
    async (req, res, next) => {
        try {
            let profile = await getProfile(req.uid!);
            res.status(200).json(profile);
        }
        catch(e) {
            next(e);
        }
    }
)

router.put('/me/picture', 
    jwtVerifier,
    async (req, res, next) => {
        try {
            const contentLength = req.headers['content-length'];
            if (!contentLength || parseInt(contentLength) > 1024*1024 + 1000) {
                throw new HTTPError(413, "Content too large");
            }

            const busboy = Busboy({ headers: req.headers });

            let isFirst = true;

            busboy.on('file', (fieldname, file, fileinfo) => {
                if (fileinfo.filename != 'image.jpg' || fileinfo.mimeType != 'image/jpeg')
                    return;
                if (!isFirst)
                    return;

                isFirst = false;

                // todo
            });
            busboy.on('close', () => {

            });
        }
        catch(e) {
            next(e);
        }
    }
)

export default router;