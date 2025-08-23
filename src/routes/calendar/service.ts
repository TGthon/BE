import { db } from '../../database';
import { calendar } from '../../drizzle/schema';
import mysql from 'mysql2/promise';

type Calendar = {
    start: number,
    end: number, 
    name: string,
    groupName?: string,
    users: string[],
    color: string,
}

export const getCalendar = async (uid: number, year: string | undefined, month: string | undefined): Promise<Calendar[]> => {
    return [
        {
            start: new Date(2025, 8-1, 13, 12, 0, 0).getTime() / 1000,
            end: new Date(2025, 8-1, 13, 14, 0).getTime() / 1000,
            name: "테스트 1",
            users: ["테스트", "테스트"],
            color: "#F59CA9"
        },
        {
            start: new Date(2025, 8-1, 14, 17, 0, 0).getTime() / 1000,
            end: new Date(2025, 8-1, 14, 18, 30).getTime() / 1000,
            name: "테스트 2",
            groupName: "테스트 그룹",
            users: [],
            color: "#8B5CF6"
        },
    ]
}

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
    users?: string[];
}) {
    let result = await db.insert(calendar).values({
        userId: uid,
        name: name,
        start: start,
        end: end,
        color: color ?? '#3B82F6',
        note: note,
        users: JSON.stringify(users ?? [uid])
    }).$returningId();

    const insertId = result[0].id;
    return { id: insertId, name, start, end, color, note, users };
}