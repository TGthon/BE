import { and, count, eq } from "drizzle-orm";
import { db } from "../../database"
import { events, users, usersEvents, votes } from "../../drizzle/schema";

type EventItem = {
    id: number;
    title: string;
    people: number;
    status: boolean;
    date?: string;
}

export const getEventlist = async (uid: number): Promise<EventItem[]> => {
    let dbResult = await db.select({
        eventid: events.eventid,
        eventDefaultName: events.name,
        eventCustomName: usersEvents.name,
        count: count(votes.uid),
        people: events.peopleCnt,
    }).from(users)
    .innerJoin(usersEvents, eq(users.uid, usersEvents.uid))
    .innerJoin(events, eq(events.eventid, usersEvents.eventid))
    .leftJoin(votes, and(eq(users.uid, votes.uid), eq(events.eventid, votes.eventid)))
    .where(eq(users.uid, uid))
    .groupBy(events.eventid);

    return dbResult.map(row => ({
        id: row.eventid,
        title: row.eventCustomName || row.eventDefaultName,
        people: row.people,
        status: row.count > 0,
        // todo: date
    }))
}