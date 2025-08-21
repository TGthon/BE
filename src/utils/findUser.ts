import { db } from "../database";
import { users } from "../drizzle/schema";
import { eq } from 'drizzle-orm';

type AdditionalInfo = {
    userName: string,
    profilePicture?: string,
}

type UserInfo = {
    uid: number,
    name: string,
    picture?: string,
}

export default async function findUser(
    email: string, 
    createUserIfEmpty: boolean = false,
    additionalInfo: AdditionalInfo = { userName: "" }
): Promise<UserInfo> {
    let dbResult = await db.select({
        uid: users.uid,
        name: users.name,
        profile: users.profilePicture
    }).from(users).where(eq(users.email, email));
    if(createUserIfEmpty && dbResult.length == 0) {
        return await createUser(email, additionalInfo);
    }

    const uid = dbResult[0].uid;
    const name = dbResult[0].name;
    const picture = dbResult[0].profile || undefined;
    return { uid, name, picture };
}

async function createUser(email: string, additionalInfo: AdditionalInfo): Promise<UserInfo> {
    const result = await db.insert(users).values({
        name: additionalInfo.userName,
        email,
        profilePicture: additionalInfo.profilePicture,
    }).$returningId();
    return {
        uid: result[0].uid,
        name: additionalInfo.userName,
        picture: additionalInfo.profilePicture
    };
}