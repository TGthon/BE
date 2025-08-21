import querystring from 'querystring';
import HTTPError from './HTTPError';

type Userinfo = {
    email: string,
    name: string,
    picture: string;
}

export default async function getGoogleUserinfo(accessToken: string): Promise<Userinfo> {
    let result = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?${querystring.stringify({
        access_token: accessToken
    })}`);
    if (result.status != 200) {
        console.error(`status: ${result.status}`);
        console.error(await result.text());
        throw new HTTPError(500, "Failed to get user info from Google");
    }
    let resultJson = await result.json();

    if (!resultJson.email || !resultJson.picture) {
        console.error(resultJson);
        throw new HTTPError(500, "Failed to get user info from Google");
    }

    return {
        email: resultJson.email.toString(),
        name: resultJson.name?.toString() ?? '이름 없음',
        picture: resultJson.picture.toString()
    }
}