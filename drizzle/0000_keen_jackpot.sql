CREATE TABLE `apps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`path` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`github_org` text,
	`github_repo` text,
	`github_branch` text,
	`supabase_project_id` text,
	`neon_project_id` text,
	`neon_development_branch_id` text,
	`neon_preview_branch_id` text,
	`vercel_project_id` text,
	`vercel_project_name` text,
	`vercel_team_id` text,
	`vercel_deployment_url` text,
	`chat_context` text
);
--> statement-breakpoint
CREATE TABLE `bolt_files` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`path` text NOT NULL,
	`content` text NOT NULL,
	`type` text DEFAULT 'file' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `bolt_projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `bolt_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`template` text,
	`framework` text,
	`dev_server_port` integer,
	`dev_server_pid` integer,
	`is_running` integer DEFAULT false,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `chats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`app_id` integer NOT NULL,
	`title` text,
	`initial_commit_hash` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `language_model_providers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`api_base_url` text NOT NULL,
	`env_var_name` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `language_models` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`display_name` text NOT NULL,
	`api_name` text NOT NULL,
	`builtin_provider_id` text,
	`custom_provider_id` text,
	`description` text,
	`max_output_tokens` integer,
	`context_window` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`custom_provider_id`) REFERENCES `language_model_providers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`chat_id` integer NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`approval_state` text,
	`commit_hash` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `versions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`app_id` integer NOT NULL,
	`commit_hash` text NOT NULL,
	`neon_db_timestamp` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `versions_app_commit_unique` ON `versions` (`app_id`,`commit_hash`);