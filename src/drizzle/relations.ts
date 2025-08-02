import { relations } from "drizzle-orm/relations";
import { groups, usersGroups, users } from "./schema";

export const usersGroupsRelations = relations(usersGroups, ({one}) => ({
	group: one(groups, {
		fields: [usersGroups.gid],
		references: [groups.gid]
	}),
	user: one(users, {
		fields: [usersGroups.uid],
		references: [users.uid]
	}),
}));

export const groupsRelations = relations(groups, ({many}) => ({
	usersGroups: many(usersGroups),
}));

export const usersRelations = relations(users, ({many}) => ({
	usersGroups: many(usersGroups),
}));