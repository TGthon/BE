import { Request, Response, NextFunction } from 'express';
import { verifyJwtToken } from '../utils/jwt';

export default function jwtVerifier(req: Request, res: Response, next: NextFunction) {
    const authorization = req.headers.authorization;

    if (authorization === undefined) {
        return next(new Error("Unauthorized"));
    }
    
    let token = authorization.split(' ')[1];

    let verifyResult = verifyJwtToken(token);
    if (!verifyResult) {
        return next(new Error("Unauthorized"));
    }

    const uid = verifyResult;
    req.uid = uid;
    next();
}