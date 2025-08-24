import { eq, and, count, sql, gte, lt } from "drizzle-orm";
import { db } from "../../database"
import { usersEvents, votes } from "../../drizzle/schema"
import HTTPError from "../../utils/HTTPError";
import { Vote } from "./router";

export const vote = async (uid: number, eventid: number, voteList: Vote[]) => {
    for (let v of voteList) {
        if (!["P", "I"].includes(v.type))
            throw new HTTPError(400, "Bad request");

        // 한국 표준시 기준 0시에 맞춤
        v.time = v.time / 1800 * 1800; // 30분
    }

    await db.transaction(async tx => {
        let res = await tx.select({
            count: count()
        }).from(usersEvents).where(and(eq(usersEvents.uid, uid), eq(usersEvents.eventid, eventid)))

        if (res[0].count == 0)
            throw new HTTPError(403, "Forbidden");

        await tx.insert(votes).values(voteList.map(v => ({
            eventid: eventid,
            uid: uid,
            date: new Date(v.time * 1000),
            type: v.type,
            isDate: false
        })))
        .onDuplicateKeyUpdate({
            set: {
                date: sql`VALUES(date)`
            }
        });
    })
}

export const voteDay = async (uid: number, eventid: number, voteList: Vote[]) => {
    const KST_OFFSET = 9 * 3600;
    for (let v of voteList) {
        if (!["P", "N", "I"].includes(v.type))
            throw new HTTPError(400, "Bad request");

        // 한국 표준시 기준 0시에 맞춤
        v.time = ((v.time + KST_OFFSET) / 86400) * 86400 - KST_OFFSET;
    }

    await db.transaction(async tx => {
        let res = await tx.select({
            count: count()
        }).from(usersEvents).where(and(eq(usersEvents.uid, uid), eq(usersEvents.eventid, eventid)))

        if (res[0].count == 0)
            throw new HTTPError(403, "Forbidden");

        await tx.insert(votes).values(voteList.map(v => ({
            eventid: eventid,
            uid: uid,
            date: new Date(v.time * 1000),
            type: v.type,
            isDate: true
        })))
        .onDuplicateKeyUpdate({
            set: {
                date: sql`VALUES(date)`
            }
        });
    })
}

export const getTimeVote = async (uid: number, eventid: number, day: number) => {
    let result = await db.select({
        date: votes.date,
        type: votes.type
    }).from(votes)
    .where(and(
        gte(votes.date, new Date(day * 1000)), 
        lt(votes.date, new Date((day + 86400) * 1000)),
        eq(votes.eventid, eventid),
        eq(votes.isDate, false)
    ));
    return result.map(row => ({
        date: row.date.getTime() / 1000,
        type: row.type,
    }))
}