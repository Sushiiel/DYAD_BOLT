import { sqliteTable, AnySQLiteColumn, integer, text, foreignKey, uniqueIndex } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const apps = sqliteTable("apps", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	name: text().notNull(),
	path: text().notNull(),
	createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
	updatedAt: integer("updated_at").default(sql`(unixepoch())`).notNull(),
	githubOrg: text("github_org"),
	githubRepo: text("github_repo"),
	supabaseProjectId: text("supabase_project_id"),
	chatContext: text("chat_context"),
	githubBranch: text("github_branch"),
	vercelProjectId: text("vercel_project_id"),
	vercelProjectName: text("vercel_project_name"),
	vercelTeamId: text("vercel_team_id"),
	vercelDeploymentUrl: text("vercel_deployment_url"),
	neonProjectId: text("neon_project_id"),
	neonDevelopmentBranchId: text("neon_development_branch_id"),
	neonPreviewBranchId: text("neon_preview_branch_id"),
});

export const chats = sqliteTable("chats", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	appId: integer("app_id").notNull().references(() => apps.id, { onDelete: "cascade" } ),
	title: text(),
	createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
	initialCommitHash: text("initial_commit_hash"),
});

export const messages = sqliteTable("messages", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	chatId: integer("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" } ),
	role: text().notNull(),
	content: text().notNull(),
	createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
	approvalState: text("approval_state"),
	commitHash: text("commit_hash"),
});

export const languageModelProviders = sqliteTable("language_model_providers", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	apiBaseUrl: text("api_base_url").notNull(),
	envVarName: text("env_var_name"),
	createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
	updatedAt: integer("updated_at").default(sql`(unixepoch())`).notNull(),
});

export const languageModels = sqliteTable("language_models", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	displayName: text("display_name").notNull(),
	apiName: text("api_name").notNull(),
	builtinProviderId: text("builtin_provider_id"),
	customProviderId: text("custom_provider_id").references(() => languageModelProviders.id, { onDelete: "cascade" } ),
	description: text(),
	maxOutputTokens: integer("max_output_tokens"),
	contextWindow: integer("context_window"),
	createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
	updatedAt: integer("updated_at").default(sql`(unixepoch())`).notNull(),
});

export const versions = sqliteTable("versions", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	appId: integer("app_id").notNull().references(() => apps.id, { onDelete: "cascade" } ),
	commitHash: text("commit_hash").notNull(),
	neonDbTimestamp: text("neon_db_timestamp"),
	createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
	updatedAt: integer("updated_at").default(sql`(unixepoch())`).notNull(),
},
(table) => [
	uniqueIndex("versions_app_commit_unique").on(table.appId, table.commitHash),
]);

export const boltFiles = sqliteTable("bolt_files", {
	id: text().primaryKey().notNull(),
	projectId: text("project_id").notNull().references(() => boltProjects.id, { onDelete: "cascade" } ),
	path: text().notNull(),
	content: text().notNull(),
	type: text().default("file").notNull(),
	createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
	updatedAt: integer("updated_at").default(sql`(unixepoch())`).notNull(),
});

export const boltProjects = sqliteTable("bolt_projects", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	template: text(),
	framework: text(),
	devServerPort: integer("dev_server_port"),
	devServerPid: integer("dev_server_pid"),
	isRunning: integer("is_running").default(false),
	createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
	updatedAt: integer("updated_at").default(sql`(unixepoch())`).notNull(),
});

