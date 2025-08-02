-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `groups` (
	`gid` bigint AUTO_INCREMENT NOT NULL,
	`group_name` varchar(50) NOT NULL,
	CONSTRAINT `groups_gid` PRIMARY KEY(`gid`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`uid` bigint NOT NULL,
	`token` char(43) NOT NULL,
	`issued_at` timestamp NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	`expires_at` timestamp NOT NULL,
	CONSTRAINT `sessions_uid_token` PRIMARY KEY(`uid`,`token`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`uid` bigint AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`email` varchar(255) NOT NULL,
	`profile_picture` varchar(36),
	CONSTRAINT `users_uid` PRIMARY KEY(`uid`)
);
--> statement-breakpoint
CREATE TABLE `users_groups` (
	`uid` bigint NOT NULL,
	`gid` bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE `users_groups` ADD CONSTRAINT `users_groups_gid` FOREIGN KEY (`gid`) REFERENCES `groups`(`gid`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users_groups` ADD CONSTRAINT `users_groups_uid` FOREIGN KEY (`uid`) REFERENCES `users`(`uid`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `group_name` ON `groups` (`group_name`);--> statement-breakpoint
CREATE INDEX `email` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `name` ON `users` (`name`);--> statement-breakpoint
CREATE INDEX `users_groups_gid_idx` ON `users_groups` (`gid`);--> statement-breakpoint
CREATE INDEX `users_groups_uid_idx` ON `users_groups` (`uid`);
*/