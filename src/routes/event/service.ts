import { and, count, eq, sql } from "drizzle-orm";
import { db } from "../../database"
import { events, users, usersEvents, votes } from "../../drizzle/schema";
import HTTPError from "../../utils/HTTPError";

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

export const createEvent = async (uid: number, data: {
    start: number,
    end: number,
    users: number[],
    groups: number[],
    duration: number,
    name: string
}) => {
    const result = await db.insert(events).values({
        name: data.name,
        peopleCnt: 0
    }).$returningId();

    const eventid = result[0].eventid;
    await joinEvent(uid, eventid);
    return eventid;
}

export const joinEvent = async (uid: number, eventid: number, inviter?: number) => {
    await db.transaction(async tx => {
        // 초대자가 그룹에 속해있는지 검사
        if (inviter) {
            let result = await tx.select({count: count()}).from(usersEvents).where(and(
                eq(usersEvents.uid, inviter),
                eq(usersEvents.eventid, eventid)
            ));
            if(result[0].count == 0) {
                throw new HTTPError(400, "Inviter does not belong to group");
            }
        }
        
        // 초대받는 사람이 이미 그룹에 속해있는지 검사
        let result = await tx.select({count: count()}).from(usersEvents).where(and(
            eq(usersEvents.uid, uid),
            eq(usersEvents.eventid, eventid)
        ));
        if(result[0].count >= 1) {
            throw new HTTPError(400, "User already belongs to group");
        }

        await tx.insert(usersEvents).values({
            uid, 
            eventid
        });
        await tx.update(events).set({
            peopleCnt: sql`${events.peopleCnt}+1`
        }).where(eq(events.eventid, eventid));
    });
}

// 나에게 보여지는 이름만 수정한다!
export const changeEventname = async (uid: number, eventid: number, name: string) => {
    let dbResult = await db.update(usersEvents).set({
        name
    })
    .where(and(
        eq(usersEvents.uid, uid),
        eq(usersEvents.eventid, eventid)
    ));
    // 유저가 그 이벤트에 속해있지 않음
    if (dbResult[0].affectedRows == 0) {
        throw new HTTPError(400, "Bad request");
    }
}