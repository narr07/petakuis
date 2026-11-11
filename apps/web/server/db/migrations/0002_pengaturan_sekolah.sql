CREATE TABLE `school_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`npsn` text DEFAULT '' NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`updated_at` text NOT NULL
);
