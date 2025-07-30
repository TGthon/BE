import jwt from 'jsonwebtoken';
import 'dotenv';

type PayloadData = {
    uid?: number;
};

export const createJwtToken = (uid: number, lifetime: number = 300) => {
    let token = jwt.sign(
        { uid }, 
        process.env.JWT_KEY!,
        { expiresIn: lifetime }
    )

    return token;
}

export const verifyJwtToken = (token: string) => {
    try {
        const payload = jwt.verify(
            token,
            process.env.JWT_KEY!
        );

        console.log(payload);
        const uid = (payload as PayloadData).uid;
        if (uid === undefined) 
            return false;

        return uid;
    }
    catch(e) {
        console.error(`JWT verify error: ${e}`);
        return false;
    }
}