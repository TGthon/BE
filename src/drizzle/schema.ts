import { mysqlTable, mysqlSchema, AnyMySqlColumn, index, primaryKey, bigint, varchar, char, timestamp, foreignKey } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const groups = mysqlTable("groups", {
	gid: bigint({ mode: "number" }).autoincrement().notNull(),
	groupName: varchar("group_name", { length: 50 }).notNull(),
},
(table) => [
	index("group_name").on(table.groupName),
	primaryKey({ columns: [table.gid], name: "groups_gid"}),
]);

export const sessions = mysqlTable("sessions", {
	uid: bigint({ mode: "number" }).notNull(),
	token: char({ length: 43 }).notNull(),
	issuedAt: timestamp("issued_at").defaultNow().notNull(),
	expiresAt: timestamp("expires_at").notNull(),
},
(table) => [
	primaryKey({ columns: [table.uid, table.token], name: "sessions_uid_token"}),
]);

export const users = mysqlTable("users", {
	uid: bigint({ mode: "number" }).primaryKey().autoincrement().notNull(),
	name: varchar({ length: 50 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	profilePicture: varchar("profile_picture", { length: 36 }),
},
(table) => [
	index("email").on(table.email),
	index("name").on(table.name),
	primaryKey({ columns: [table.uid], name: "users_uid"}),
]);

export const usersGroups = mysqlTable("users_groups", {
	uid: bigint({ mode: "number" }).notNull().references(() => users.uid, { onDelete: "cascade" } ),
	gid: bigint({ mode: "number" }).notNull().references(() => groups.gid),
},
(table) => [
	index("users_groups_gid_idx").on(table.gid),
	index("users_groups_uid_idx").on(table.uid),
]);
