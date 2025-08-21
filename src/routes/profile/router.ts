import express, { Router } from 'express';
import validatorErrorChecker from '../../middlewares/validatorErrorChecker';
import { body } from 'express-validator';
import HTTPError from '../../utils/HTTPError';
import jwtVerifier from '../../middlewares/jwtVerifier';
import { getProfile, updateProfilePicture } from './service';
import Busboy from 'busboy';
import sharp from 'sharp';
import { pipeline } from 'stream/promises';
import fs from 'fs';
import { v4 } from 'uuid';

import 'dotenv';

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

            let processed = false;
            let promises: Promise<any>[] = []; // 어차피 하나밖에 없긴 하지만 없을때 처리가 이게 더 편해서 일케 함!
            const fileID = v4();

            const mimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/svg"]);
            busboy.on('file', (fieldname, file, fileinfo) => {
                if (fieldname != 'picture' || mimeTypes.has(fileinfo.mimeType)) {
                    file.resume();
                    return;
                }
                if (processed) {
                    file.resume();
                    return;
                }

                promises.push(pipeline(
                    file,
                    sharp().resize(500, 500)
                    .toFormat('jpeg', { quality: 70 }),
                    fs.createWriteStream(`${process.env.IMAGE_FOLDER_PATH}/${fileID}.jpg`)
                ));

                processed = true;
            });
            busboy.on('close', async () => {
                try {
                    await Promise.all(promises);
                    if (processed) {
                        const picture = `https://api.ldh.monster/images/${fileID}.jpg`;
                        await updateProfilePicture(req.uid!, picture);
                        res.status(200).json({ picture });
                    }
                    else {
                        next(new HTTPError(400, "Bad request"));
                    }
                }
                catch(e) {
                    next(e);
                }
            });
            req.pipe(busboy);
        }
        catch(e) {
            next(e);
        }
    }
)

export default router;