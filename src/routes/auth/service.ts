import crypto from 'crypto';
import { db } from "../../database";
import { sessions, users } from "../../drizzle/schema";
import { eq, and } from 'drizzle-orm';
import hash from '../../utils/hash';
import { createJwtToken } from '../../utils/jwt';
import querystring from 'querystring';
import getGoogleUserinfo from '../../utils/getGoogleUserinfo';
import HTTPError from '../../utils/HTTPError';
import { OAuth2Client } from 'google-auth-library';
import findUser from '../../utils/findUser';
const oauthClient = new OAuth2Client();

type LoginResult = {
    email: string,
    uid: number,
    accessToken: string,
    refreshToken: string,
    name?: string,
    picture?: string,
}

// DB에 토큰 저장
const registerRefreshToken = async (uid: number, token: string, lifetime: number = 31556926 /* 기본값 1년 */) => {
    let hashed = hash(token);
    let issuedAt = new Date();
    let expiresAt = new Date(issuedAt.getTime() + lifetime * 1000);
    await db.insert(sessions).values({
        uid,
        token: hashed,
        issuedAt,
        expiresAt,
    });
}

// 비보안 로그인, email만 주면 토큰 발행해줌
export const noSecurityLogin = async (email: string) => {

    if (email.indexOf('@') == -1)
        throw new HTTPError(400, "Invalid code");

    let uid = await findUser(email, true, {
        userName: "사용자",
        profilePicture: "https://via.placeholder.com/80"
    });

    let refreshToken = crypto.randomBytes(32).toString('base64url');
    let accessToken = createJwtToken(uid);

    await registerRefreshToken(uid, refreshToken);

    return { email, uid, accessToken, refreshToken, name: "사용자", picture: "https://via.placeholder.com/80" };
}

export const googleCodeLogin = async (code: string, clientSecret: string, clientId: string): Promise<LoginResult> => {
    let authResult = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: querystring.stringify({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: "https://api.ldh.monster/api/auth/googleCallback", 
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
    console.log(`email: ${userinfo.email}, name: ${userinfo.name}, picture: ${userinfo.picture}`);

    const email = userinfo.email;
    const name = userinfo.name;
    const picture = userinfo.picture;


    let uid = await findUser(email, true, {
        userName: name || "사용자",
        profilePicture: picture || undefined
    });

    let refreshToken = crypto.randomBytes(32).toString('base64url');
    let accessToken = createJwtToken(uid);

    await registerRefreshToken(uid, refreshToken);

    return { email, uid, accessToken, refreshToken, name: userinfo.name, picture: userinfo.picture };
}

export const googleIdTokenLogin = async (code: string, clientId: string): Promise<LoginResult> => {
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

        let uid = await findUser(email, true, {
            userName: payload.name || "사용자",
            profilePicture: payload.picture || "https://via.placeholder.com/80"
        });

        let refreshToken = crypto.randomBytes(32).toString('base64url');
        let accessToken = createJwtToken(uid);

        await registerRefreshToken(uid, refreshToken);

        return { email, uid, accessToken, refreshToken, name: payload.name, picture: payload.picture };
    }
    catch(e) {
        console.error(e);
        throw new HTTPError(400, "Login failed");
    }
}

export const refresh = async (uid: number, refreshToken: string): Promise<string> => {
    let hashed = hash(refreshToken);
    let dbResult = await db.query.sessions.findFirst({
        where: and(eq(sessions.uid, uid), eq(sessions.token, hashed))
    });
    if(dbResult === undefined)
        throw new HTTPError(401, "Unauthorized");
    if(dbResult.expiresAt < new Date()) {
        throw new HTTPError(401, "Unauthorized");
    }

    let accessToken = await createJwtToken(uid);
    return accessToken;
}