import { and, count, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../database"
import { events, users, usersEvents, usersGroups, votes } from "../../drizzle/schema";
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
    //await joinEvent(uid, eventid);
    return await db.transaction(async tx => {
        try {
            let groupUidList = await tx.select({
                uid: usersGroups.uid
            }).from(usersGroups).where(inArray(usersGroups.gid, data.groups));

            let uidList = [uid, ...data.users, ...groupUidList.map(g => g.uid)];
            uidList = [...new Set(uidList)]; // 중복 제거
            // 어차피 정렬하고 for문돌아도 이거랑 시간 복잡도가 같다!!

            const result = await tx.insert(events).values({
                name: data.name,
                peopleCnt: uidList.length,
                start: new Date(data.start * 1000),
                end: new Date(data.end * 1000),
                duration: data.duration
            }).$returningId();

            const eventid = result[0].eventid;

            await tx.insert(usersEvents).values(uidList.map(u => ({
                uid: u,
                eventid
            })));
            // 이런 쿼리로 잘 차력쇼 해서 간지나는 insert를 하고 싶엇지만
            // 이거 너무 어려운걸
            // await tx.insert(usersEvents).select(
            //     tx.select({
            //         uid: usersGroups.uid, 
            //         eventid: sql`${eventid}`.as('eventid'),
            //         name: sql`null`.as('name')
            //     }).from(usersGroups).where(inArray(usersGroups.gid, data.groups))
            // )

            return eventid;
        }
        catch(e) {
            console.error(e);
            throw e;
        }
    });
}

// 유저가 속해있지 않은 이벤트면 403 반환!!
// 이 데이터가 트랜젝션을 할정도로 중요하진 않은거 같으니
// 트랜젝션은 안 하고 그냥 주겟습니다.
export const getEventInfo = async (uid: number, eventid: number) => {
    let result = await db.select({count: count()}).from(usersEvents).where(and(
        eq(usersEvents.uid, uid),
        eq(usersEvents.eventid, eventid)
    ));
    if (result[0].count == 0) {
        throw new HTTPError(403, "Forbidden");
    }

    let result2 = await db.select({
        eventDefaultName: events.name,
        eventCustomName: usersEvents.name,
        // date
    }).from(events)
    .innerJoin(usersEvents, eq(events.eventid, usersEvents.eventid))
    .where(and(eq(events.eventid, eventid), eq(usersEvents.uid, uid)));

    if(result2.length == 0) {
        throw new HTTPError(400, "Bad request");
    }

    let result3 = await db.select({
        date: votes.date,
        uid: votes.uid,
        type: votes.type,
        profilePicture: users.profilePicture
    }).from(votes)
    .innerJoin(users, eq(votes.uid, users.uid))
    .where(eq(votes.eventid, eventid));

    let result4 = await db.select({
        uid: usersEvents.uid,
        picture: users.profilePicture
    }).from(usersEvents)
    .innerJoin(users, eq(usersEvents.uid, users.uid))
    .where(eq(usersEvents.eventid, eventid));

    return {
        eventid,
        title: result2[0].eventCustomName || result2[0].eventDefaultName,
        // date
        votes: result3.map(row => ({
            uid: row.uid,
            picture: row.profilePicture,
            type: row.type,
            date: row.date.getTime() / 1000
        })),
        users: result4
    }
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

// 이벤트에서 나가기
export const exitEvent = async (uid: number, eventid: number) => {
    let result = await db.transaction(async tx => {
        let dbResult = await tx.update(events).set({
            peopleCnt: sql`${events.peopleCnt}-1`
        }).where(eq(events.eventid, eventid));

        if (dbResult[0].affectedRows == 0) {
            throw new HTTPError(400, "Event does not exist");
        }

        let dbResult2 = await tx.delete(usersEvents).where(
            and(
                eq(usersEvents.uid, uid),
                eq(usersEvents.eventid, eventid)
            )
        );

        // 유저가 이벤트에 속해있지 않은데 탈퇴요청을 하면 그냥 바로 롤백하기
        if (dbResult2[0].affectedRows == 0) {
            throw new HTTPError(400, "User does not belong to event");
        }
    });
}

// 추천하는 시간을 반환한다!
// 반환값은 Unixtime이고, ~~년 ~~월 ~~일 ~~시 까지만 쓰고 뒤에 분과 초는 0으로 채워서 준다!
export const getRecommendedTime = async (uid: number, eventid: number): Promise<[number, number]> => {
    // todo
    const now = Math.floor(new Date().getTime() / 1000);
    return [now, now + 3600];
}