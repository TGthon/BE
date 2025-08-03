import { db } from "../database";
import { users } from "../drizzle/schema";
import { eq } from 'drizzle-orm';

type AdditionalInfo = {
    userName: string,
    profilePicture?: string,
}

export default async function findUser(
    email: string, 
    createUserIfEmpty: boolean = false,
    additionalInfo: AdditionalInfo = { userName: "" }
): Promise<number> {
    let dbResult = await db.select({uid: users.uid}).from(users).where(eq(users.email, email));
    if(createUserIfEmpty && dbResult.length == 0) {
        return await createUser(email, additionalInfo);
    }

    let { uid } = dbResult[0];
    return uid;
}

async function createUser(email: string, additionalInfo: AdditionalInfo): Promise<number> {
    const result = await db.insert(users).values({
        name: additionalInfo.userName,
        email,
        profilePicture: additionalInfo.profilePicture,
    }).$returningId();
    return result[0].uid;
}