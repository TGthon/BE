import { eq } from "drizzle-orm";
import { db } from "../../database";
import { users } from "../../drizzle/schema";

type Profile = {
    name: string,
    picture?: string,
}

export const getProfile = async (uid: number): Promise<Profile> => {
    let dbResult = await db.select({
        name: users.name,
        picture: users.profilePicture
    }).from(users).where(eq(users.uid, uid));
    
    return {
        name: dbResult[0].name,
        picture: dbResult[0].picture || undefined
    }
}

export const updateProfileName = async (uid: number, name: string) => {
    await db.update(users).set({
        name
    }).where(eq(users.uid, uid));
}

export const updateProfilePicture = async (uid: number, picture: string) => {
    await db.update(users).set({
        profilePicture: picture,
    }).where(eq(users.uid, uid));
}