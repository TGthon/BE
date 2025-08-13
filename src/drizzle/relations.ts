import { relations } from "drizzle-orm/relations";
import { groups, events, schedules, users, usersEvents, usersGroups, votes } from "./schema";

export const eventsRelations = relations(events, ({one, many}) => ({
	group: one(groups, {
		fields: [events.gid],
		references: [groups.gid]
	}),
	usersEvents: many(usersEvents),
	votes: many(votes),
}));

export const groupsRelations = relations(groups, ({many}) => ({
	events: many(events),
	schedules: many(schedules),
	usersGroups: many(usersGroups),
}));

export const schedulesRelations = relations(schedules, ({one}) => ({
	group: one(groups, {
		fields: [schedules.gid],
		references: [groups.gid]
	}),
	user: one(users, {
		fields: [schedules.uid],
		references: [users.uid]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	schedules: many(schedules),
	usersEvents: many(usersEvents),
	usersGroups: many(usersGroups),
	votes: many(votes),
}));

export const usersEventsRelations = relations(usersEvents, ({one}) => ({
	event: one(events, {
		fields: [usersEvents.eventid],
		references: [events.eventid]
	}),
	user: one(users, {
		fields: [usersEvents.uid],
		references: [users.uid]
	}),
}));

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

export const votesRelations = relations(votes, ({one}) => ({
	event: one(events, {
		fields: [votes.eventid],
		references: [events.eventid]
	}),
	user: one(users, {
		fields: [votes.uid],
		references: [users.uid]
	}),
}));