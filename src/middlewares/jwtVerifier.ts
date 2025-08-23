import { Request, Response, NextFunction } from 'express';
import { verifyJwtToken } from '../utils/jwt';
import HTTPError from '../utils/HTTPError';

export default function jwtVerifier(req: Request, res: Response, next: NextFunction) {
    const authorization = req.headers.authorization;

    if (authorization === undefined) {
        return next(new HTTPError(401, "Unauthorized"));
    }
    
    let token = authorization.split(' ')[1];

    let verifyResult = verifyJwtToken(token);
    if (!verifyResult) {
        return next(new HTTPError(401, "Unauthorized"));
    }

    const uid = verifyResult;
    req.uid = Number(uid);
    next();
}