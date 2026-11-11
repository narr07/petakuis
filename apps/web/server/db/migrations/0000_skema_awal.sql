CREATE TABLE `game_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`quiz_id` text NOT NULL,
	`quiz_title` text NOT NULL,
	`owner_id` text,
	`map_id` text NOT NULL,
	`mode` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`ended_at` text,
	`total_players` integer DEFAULT 0 NOT NULL,
	`report` text
);
--> statement-breakpoint
CREATE INDEX `game_sessions_code_idx` ON `game_sessions` (`code`);--> statement-breakpoint
CREATE INDEX `game_sessions_owner_idx` ON `game_sessions` (`owner_id`);--> statement-breakpoint
CREATE TABLE `quizzes` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text,
	`owner_name` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`school_level` text NOT NULL,
	`grade_label` text NOT NULL,
	`subject` text NOT NULL,
	`visibility` text DEFAULT 'public' NOT NULL,
	`map_id` text NOT NULL,
	`mode` text DEFAULT 'free' NOT NULL,
	`settings` text NOT NULL,
	`questions` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `quizzes_visibility_idx` ON `quizzes` (`visibility`);--> statement-breakpoint
CREATE INDEX `quizzes_owner_idx` ON `quizzes` (`owner_id`);