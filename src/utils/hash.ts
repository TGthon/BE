import crypto from 'crypto';
import 'dotenv';

const hash = (str: string): string => {
    if (process.env.HMAC_KEY === undefined) {
        throw Error("HMAC key is required");
    }

    let hashed = crypto.createHmac('SHA256', process.env.HMAC_KEY!.trim()).update(str).digest('base64url');
    return hashed;
}

export default hash;