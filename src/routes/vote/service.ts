import { eq, and, count } from "drizzle-orm";
import { db } from "../../database"
import { usersEvents, votes } from "../../drizzle/schema"
import HTTPError from "../../utils/HTTPError";

export const vote = async (uid: number, eventid: number, time: number, type: string) => {
    if (!["P", "N", "I"].includes(type))
        throw new HTTPError(400, "Bad request");

    time = time / 1800 * 1800; // 30분

    await db.transaction(async tx => {
        let res = await tx.select({
            count: count()
        }).from(usersEvents).where(and(eq(usersEvents.uid, uid), eq(usersEvents.eventid, eventid)))

        if (res[0].count == 0)
            throw new HTTPError(403, "Forbidden");

        await tx.insert(votes).values({
            eventid: eventid,
            uid: uid,
            date: new Date(time * 1000),
            type: type
        })
        .onDuplicateKeyUpdate({
            set: {
                type: type
            }
        });
    })
}