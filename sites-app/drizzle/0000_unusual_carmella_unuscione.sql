CREATE TABLE `daily_ranks` (
	`date` text NOT NULL,
	`player_id` text NOT NULL,
	`theme` text NOT NULL,
	`moves` integer NOT NULL,
	`score` integer NOT NULL,
	`stars` integer NOT NULL,
	`hints` integer NOT NULL,
	`undos` integer NOT NULL,
	`achieved_at` text NOT NULL,
	PRIMARY KEY(`date`, `player_id`),
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `daily_order` ON `daily_ranks` (`date`,`moves`,`hints`,`undos`,`score`);--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL
);
