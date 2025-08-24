import { and, count, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../database"
import { events, schedules, users, usersEvents, usersGroups, usersSchedules, votes } from "../../drizzle/schema";
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
    name: string,
    persistent: boolean
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
                duration: data.duration,
                persistent: data.persistent,
            }).$returningId();

            const eventid = result[0].eventid;

            await tx.insert(usersEvents).values(uidList.map(u => ({
                uid: u,
                eventid
            })));

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
        profilePicture: users.profilePicture,
    }).from(votes)
    .innerJoin(users, eq(votes.uid, users.uid))
    .where(and(eq(votes.eventid, eventid), eq(votes.isDate, true)));

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

// 일단 일회성 이벤트 컨펌 먼저 만드고
// 나중에 다회성을 만들겠습니다.
export const confirmEvent = async (uid: number, eventid: number, start: number, name: string, color: string) => {
    if (color[0] == '#')
        color = color.substring(1);

    await db.transaction(async tx => {
        let result1 = await tx.select({name: users.name}).from(users).where(eq(users.uid, uid));
        const myName = result1[0].name;

        let userData = await tx.select().from(usersEvents).where(and(
            eq(usersEvents.uid, uid),
            eq(usersEvents.eventid, eventid)
        ));
        if (userData.length == 0)
            throw new HTTPError(403, "Forbidden");

        let eventInfo = await tx.select({
            name: events.name,
            persistent: events.persistent,
            duration: events.duration
        }).from(events).where(eq(events.eventid, eventid));

        let userList = (await tx.select({
            uid: usersEvents.uid
        }).from(usersEvents).where(eq(usersEvents.eventid, eventid)))
        .map(row => row.uid);

        if (eventInfo.length == 0)
            throw new HTTPError(400, "Bad request");

        let insertResult = await tx.insert(schedules).values({
            name: name,
            color: color,
            start: new Date(start * 1000),
            end: new Date((start + eventInfo[0].duration) * 1000),
            note: '',
            usersString: `${myName} 외 ${userList.length-1}명`
        }).$returningId();

        // 아 헷갈려
        await tx.insert(usersSchedules).values(userList.map(uid => ({
            uid,
            scheduleid: insertResult[0].scheduleid,
            name: ''
        })));
        
        // todo: 이벤트 삭제 (또는 삭제로 마킹)
    });
}

type RecommendResult = {
    start: number,
    end: number,
    impossibleCount: number,
    preferredCount: number,
    nonPreferredCount: number,
}

// 추천하는 시간을 반환한다!
// 반환값은 Unixtime이고, ~~년 ~~월 ~~일 ~~시 까지만 쓰고 뒤에 분과 초는 0으로 채워서 준다!
// 날짜 우선, 이벤트 소요시간 바탕으로 진행할 시간 고르기
export const getRecommendedTime = async (uid: number, eventid: number): Promise<[number, number]> => {
    let eventInfo = await db.select().from(events).where(eq(events.eventid, eventid));
    if (eventInfo.length == 0)
        throw new HTTPError(400, "Bad request");

    let userData = await db.select().from(usersEvents).where(and(
        eq(usersEvents.uid, uid),
        eq(usersEvents.eventid, eventid)
    ));
    if (userData.length == 0)
        throw new HTTPError(403, "Forbidden");
    
    let voteData = (await db.select({
        uid: votes.uid,
        date: votes.date,
        type: votes.type
    }).from(votes).where(eq(votes.eventid, eventid))
    .orderBy(votes.date))
    .map(v => ({
        uid: v.uid,
        date: v.date.getTime() / 1000,
        type: v.type
    }));

    let map_preferred = new Map<number, number>();
    let map_nonpreferred = new Map<number, number>();
    let map_impossible = new Map<number, number>();
    const mapAdd = (m: Map<number, number>, k: number, v: number) => {
        let now = m.get(k) ?? 0;
        m.set(k, now + v);
        if (now + v == 0)
            m.delete(k);
    }
    
    // Date 다루면 헷갈리니 전부 다 unixtime 기준(초단위) 로 구현
    let start = eventInfo[0].start.getTime() / 1000;
    let end = eventInfo[0].end.getTime() / 1000;
    let duration = eventInfo[0].duration;
    let unit = 1800; // 30분

    let now_s = start, now_e = start + duration;
    let s_idx = 0;
    let e_idx = 0;

    let result: RecommendResult[] = [];

    // 스위핑 알고리즘을 사용해 최적의 시간을 구한다.
    while (now_e <= end) {
        while (e_idx < voteData.length && voteData[e_idx].date < now_e) {
            switch (voteData[e_idx].type) {
                case 'P': 
                    mapAdd(map_preferred, voteData[e_idx].uid, 1);
                    break;
                case 'N':
                    mapAdd(map_nonpreferred, voteData[e_idx].uid, 1);
                    break;
                case 'I':
                    mapAdd(map_impossible, voteData[e_idx].uid, 1);
                    break;
            }
            e_idx++;
        }
        while (s_idx < voteData.length && voteData[s_idx].date < now_s) {
            switch (voteData[s_idx].type) {
                case 'P': 
                    mapAdd(map_preferred, voteData[s_idx].uid, -1);
                    break;
                case 'N':
                    mapAdd(map_nonpreferred, voteData[s_idx].uid, -1);
                    break;
                case 'I':
                    mapAdd(map_impossible, voteData[s_idx].uid, -1);
                    break;
            }
            s_idx++;
        }

        result.push({
            start: now_s,
            end: now_e,
            impossibleCount: map_impossible.size,
            preferredCount: map_preferred.size,
            nonPreferredCount: map_nonpreferred.size
        });

        now_s += unit;
        now_e += unit;
    }

    result.sort((a, b): number => {
        if (a.impossibleCount != b.impossibleCount)
            return a.impossibleCount < b.impossibleCount ? -1 : 1;
        if (a.preferredCount != b.preferredCount)
            return a.preferredCount > b.preferredCount ? -1 : 1;
        if (a.nonPreferredCount != b.nonPreferredCount)
            return a.nonPreferredCount < b.nonPreferredCount ? -1 : 1;
        return 0;
    });

    // console.log(result);

    if(result.length > 0)
        return [result[0].start, result[0].end];

    const now = Math.floor(new Date().getTime() / 1000) / unit * unit;
    return [now, now + duration];
}