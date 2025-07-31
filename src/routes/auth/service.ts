import crypto from 'crypto';
// import { db } from "../database";
// import { sessions, users } from "../../drizzle/schema";
// import { eq } from 'drizzle-orm';
// import hash from '../../utils/hash';
import { createJwtToken } from '../../utils/jwt';
import querystring from 'querystring';
import getGoogleUserinfo from '../../utils/getGoogleUserinfo';
import HTTPError from '../../utils/HTTPError';
import { OAuth2Client } from 'google-auth-library';
const oauthClient = new OAuth2Client();

type LoginResult = {
    email: string,
    uid: number,
    accessToken: string,
    refreshToken: string,
}

// DB에 토큰 저장
const registerRefreshToken = async (uid: number, token: string, lifetime: number = 31556926 /* 기본값 1년 */) => {
    // let hashed = hash(token);
    // let issuedAt = new Date();
    // let expiresAt = new Date(issuedAt.getTime() + lifetime * 1000);
    // await db.insert(sessions).values({
    //     uid,
    //     token: hashed,
    //     issuedAt,
    //     expiresAt,
    // });
}

// 비보안 로그인, email만 주면 토큰 발행해줌
// export const noSecurityLogin = async (email: string) => {
//     let dbResult = await db.select({uid: users.uid}).from(users).where(eq(users.email, email));
//     if(dbResult.length == 0)
//         throw Error("No such user");

//     let { uid } = dbResult[0];

//     let refreshToken = crypto.randomBytes(32).toString('base64url');
//     let accessToken = createJwtToken(uid);

//     await registerRefreshToken(uid, refreshToken);
//     return { uid, accessToken, refreshToken };
// }

export const googleLogin = async (code: string, clientSecret: string, clientId: string): Promise<LoginResult> => {
    let authResult = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: querystring.stringify({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: "http://localhost:3000/login", 
            grant_type: "authorization_code",
        })
    });

    if (authResult.status != 200) {
        console.error(`status: ${authResult.status}`);
        const errorJson = await authResult.json();
        console.log(errorJson);
        if (errorJson.error === "invalid_grant")
            throw new HTTPError(400, "Invalid authentication code");
        else 
            throw new HTTPError(500, "Authorization failed");
    }

    let resultJson = await authResult.json();
    let googleAccessToken = resultJson.access_token as string;
    if (!googleAccessToken) {
        console.error("accessToken is not true");
        throw new HTTPError(500, "Authorization failed");
    }

    console.log(googleAccessToken);

    let userinfo = await getGoogleUserinfo(googleAccessToken);
    console.log(`email: ${userinfo.email}, profile: ${userinfo.profile}`);

    return { email: userinfo.email, uid: 0, accessToken: "", refreshToken: "" };
}

export const googleAppLogin = async (code: string, clientId: string): Promise<LoginResult> => {
    try {
        const ticket = await oauthClient.verifyIdToken({
            idToken: code,
            audience: clientId
        });
        const payload = ticket.getPayload();
        if (payload === undefined) 
            throw new HTTPError(400, "Invalid token");
        if (!payload.email_verified)
            throw new HTTPError(400, "Invalid account");
        if (!payload.email)
            throw new HTTPError(400, "Invalid token");

        const email = payload.email;

        return { email, uid: 0, accessToken: "", refreshToken: "" };
    }
    catch(e) {
        console.error(e);
        throw new HTTPError(400, "Login failed");
    }
}