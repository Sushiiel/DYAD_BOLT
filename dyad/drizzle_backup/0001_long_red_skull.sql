PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_bolt_files` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`path` text NOT NULL,
	`content` text NOT NULL,
	`type` text DEFAULT 'file' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `bolt_projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_bolt_files`("id", "project_id", "path", "content", "type", "created_at", "updated_at") SELECT "id", "project_id", "path", "content", "type", "created_at", "updated_at" FROM `bolt_files`;--> statement-breakpoint
DROP TABLE `bolt_files`;--> statement-breakpoint
ALTER TABLE `__new_bolt_files` RENAME TO `bolt_files`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_bolt_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`template` text,
	`framework` text,
	`dev_server_port` integer,
	`dev_server_pid` integer,
	`is_running` integer DEFAULT false,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_bolt_projects`("id", "name", "description", "template", "framework", "dev_server_port", "dev_server_pid", "is_running", "created_at", "updated_at") SELECT "id", "name", "description", "template", "framework", "dev_server_port", "dev_server_pid", "is_running", "created_at", "updated_at" FROM `bolt_projects`;--> statement-breakpoint
DROP TABLE `bolt_projects`;--> statement-breakpoint
ALTER TABLE `__new_bolt_projects` RENAME TO `bolt_projects`;