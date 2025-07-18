import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export default function validatorErrorChecker(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        res.status(400).json({
            ok: false,
            errors: errors.array() 
        });
        return;
    }
    next();
}