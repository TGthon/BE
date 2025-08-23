import { eq } from 'drizzle-orm';
import { db } from '../../database';
import { calendar, schedules, usersSchedules, users } from '../../drizzle/schema';
import mysql from 'mysql2/promise';
const usersTable = users;

// type CalendarUser = {
//     name: string,
//     uid: number, 
//     picture: string
// }

type Calendar = {
    scheduleid: number,
    start: number,
    end: number, 
    name: string,
    groupName?: string,
    users: string,
    color: string,
}

export const getCalendar = async (uid: number, year: string | undefined, month: string | undefined): Promise<Calendar[]> => {
    let result = await db.select({
        scheduleid: schedules.scheduleid,
        name: schedules.name,
        start: schedules.start,
        end: schedules.end,
        color: schedules.color,
        users: schedules.usersString
    }).from(schedules);
    return result.map(row => ({
        scheduleid: row.scheduleid,
        start: row.start.getTime() / 1000,
        end: row.end.getTime() / 1000,
        color: row.color,
        name: row.name,
        users: row.users
    }))
    // return [
    //     {
    //         start: new Date(2025, 8-1, 13, 12, 0, 0).getTime() / 1000,
    //         end: new Date(2025, 8-1, 13, 14, 0).getTime() / 1000,
    //         name: "테스트 1",
    //         users: ["테스트", "테스트"],
    //         color: "#F59CA9"
    //     },
    //     {
    //         start: new Date(2025, 8-1, 14, 17, 0, 0).getTime() / 1000,
    //         end: new Date(2025, 8-1, 14, 18, 30).getTime() / 1000,
    //         name: "테스트 2",
    //         groupName: "테스트 그룹",
    //         users: [],
    //         color: "#8B5CF6"
    //     },
    // ]
}

// 여기에 그룹추가 하는 거는
// event에 있는 거 그대로 가져와야겠다
export async function createCalendar({
    uid,
    name,
    start,
    end,
    color,
    note,
    users,
}: {
    uid: number;
    name: string;
    start: number;
    end: number;
    color?: string;
    note?: string;
    users: number[];
}) {
    // DB에는 #떼고 저장
    if (color && color[0] == '#')
        color = color.substring(1);

    let result1 = await db.select({name: usersTable.name}).from(usersTable).where(eq(usersTable.uid, uid));
    const myName = result1[0].name;

    let result = await db.insert(schedules).values({
        // gid,
        name,
        start: new Date(start * 1000),
        end: new Date(end * 1000),
        color: color ?? '3B82F6',
        note: note ?? '',
        usersString: `${myName} 외 ${users.length}명`
    }).$returningId();
    const scheduleid = result[0].scheduleid;
    users.push(uid);
    
    await db.insert(usersSchedules).values(
        users.map(u => ({
            uid: u,
            scheduleid
        }))
    )

    return { scheduleid };
}