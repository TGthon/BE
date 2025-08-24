import { mysqlTable, mysqlSchema, AnyMySqlColumn, primaryKey, int, varchar, text, json, timestamp, index, foreignKey, bigint, char, boolean } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const calendar = mysqlTable("calendar", {
	id: int().autoincrement().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	start: int().notNull(),
	end: int().notNull(),
	color: varchar({ length: 20 }),
	note: text(),
	users: json(),
	createdAt: timestamp("created_at").defaultNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "calendar_id"}),
]);

export const events = mysqlTable("events", {
	eventid: bigint({ mode: "number" }).primaryKey().autoincrement().notNull(),
	gid: bigint({ mode: "number" }).references(() => groups.gid),
	name: varchar({ length: 50 }).notNull(),
	peopleCnt: int("people_cnt").default(0).notNull(),
	start: timestamp().notNull(),
	end: timestamp().notNull(),
	duration: int().notNull(),
	persistent: boolean().default(false).notNull(),
},
(table) => [
	index("gid_idx").on(table.gid),
	primaryKey({ columns: [table.eventid], name: "events_eventid"}),
]);

export const groups = mysqlTable("groups", {
	gid: bigint({ mode: "number" }).primaryKey().autoincrement().notNull(),
	groupName: varchar("group_name", { length: 50 }).notNull(),
},
(table) => [
	index("group_name").on(table.groupName),
	primaryKey({ columns: [table.gid], name: "groups_gid"}),
]);

export const schedules = mysqlTable("schedules", {
	scheduleid: bigint({ mode: "number" }).primaryKey().autoincrement().notNull(),
	gid: bigint({ mode: "number" }).references(() => groups.gid),
	name: varchar({ length: 50 }).notNull(),
	start: timestamp().notNull(),
	end: timestamp().notNull(),
	color: char({ length: 6 }).default('3B82F6').notNull(),
	note: text().notNull(),
	usersString: varchar("users_string", { length: 50 }).notNull().default(''),
},
(table) => [
	index("name").on(table.name),
	index("schedules_gid_idx").on(table.gid),
	primaryKey({ columns: [table.scheduleid], name: "schedules_scheduleid"}),
]);

export const sessions = mysqlTable("sessions", {
	uid: bigint({ mode: "number" }).primaryKey().notNull(),
	token: char({ length: 43 }).primaryKey().notNull(),
	issuedAt: timestamp("issued_at").defaultNow().notNull(),
	expiresAt: timestamp("expires_at").notNull(),
},
(table) => [
	primaryKey({ columns: [table.uid, table.token], name: "sessions_uid_token"}),
]);

export const userFriends = mysqlTable("user_friends", {
	uid1: bigint({ mode: "number" }).primaryKey().notNull().references(() => users.uid),
	uid2: bigint({ mode: "number" }).primaryKey().notNull().references(() => users.uid),
	createdAt: timestamp("created_at").defaultNow().notNull(),
},
(table) => [
	primaryKey({ columns: [table.uid1, table.uid2], name: "user_friends_uid1_uid2"}),
]);

export const users = mysqlTable("users", {
	uid: bigint({ mode: "number" }).primaryKey().autoincrement().notNull(),
	name: varchar({ length: 50 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	profilePicture: varchar("profile_picture", { length: 255 }),
},
(table) => [
	index("name").on(table.name),
	index("email").on(table.email),
	primaryKey({ columns: [table.uid], name: "users_uid"}),
]);

export const usersEvents = mysqlTable("users_events", {
	uid: bigint({ mode: "number" }).primaryKey().notNull().references(() => users.uid),
	eventid: bigint({ mode: "number" }).primaryKey().notNull().references(() => events.eventid),
	name: varchar({ length: 50 }),
},
(table) => [
	index("users_events_uid_idx").on(table.uid),
	index("users_events_eventid_idx").on(table.eventid),
	primaryKey({ columns: [table.uid, table.eventid], name: "users_events_uid_eventid"}),
]);

export const usersGroups = mysqlTable("users_groups", {
	uid: bigint({ mode: "number" }).notNull().references(() => users.uid, { onDelete: "cascade" } ),
	gid: bigint({ mode: "number" }).notNull().references(() => groups.gid),
},
(table) => [
	index("users_groups_uid_idx").on(table.uid),
	index("users_groups_gid_idx").on(table.gid),
]);

export const usersSchedules = mysqlTable("users_schedules", {
	uid: bigint({ mode: "number" }).notNull().references(() => users.uid),
	scheduleid: bigint({ mode: "number" }).notNull().references(() => schedules.scheduleid, { onDelete: "cascade", onUpdate: "cascade" }),
	name: varchar({ length: 50 }),
},
(table) => [
	index("users_schedules_uid_idx").on(table.uid),
	index("users_schedules_scheduleid_idx").on(table.scheduleid),
]);

export const votes = mysqlTable("votes", {
	eventid: bigint({ mode: "number" }).primaryKey().notNull().references(() => events.eventid),
	uid: bigint({ mode: "number" }).primaryKey().notNull().references(() => users.uid),
	date: timestamp().notNull().primaryKey(),
	type: char({ length: 1 }).notNull(),
	isDate: boolean("is_date").primaryKey().default(false).notNull()
},
(table) => [
	index("votes_uid_idx").on(table.uid),
	primaryKey({ columns: [table.eventid, table.uid, table.date, table.isDate], name: "votes_eventid_uid_date"}),
]);
