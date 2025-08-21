
type Calendar = {
    start: number,
    end: number, 
    name: string,
    groupName?: string,
    users: string[],
}

export const getCalendar = async (uid: number, year: string | undefined, month: string | undefined): Promise<Calendar[]> => {
    return [
        {
            start: new Date(2025, 8-1, 13, 12, 0, 0).getTime() / 1000,
            end: new Date(2025, 8-1, 13, 14, 0).getTime() / 1000,
            name: "테스트 1",
            users: ["테스트", "테스트"]
        },
        {
            start: new Date(2025, 8-1, 14, 17, 0, 0).getTime() / 1000,
            end: new Date(2025, 8-1, 14, 18, 30).getTime() / 1000,
            name: "테스트 2",
            groupName: "테스트 그룹",
            users: []
        },
    ]
}