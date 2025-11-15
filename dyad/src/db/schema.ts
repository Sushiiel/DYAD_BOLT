import { sqliteTable, integer, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// =================== CORE TABLES ===================

export const apps = sqliteTable("apps", {
  id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
  name: text("name").notNull(),
  path: text("path").notNull(),
  createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`).notNull(),
  githubOrg: text("github_org"),
  githubRepo: text("github_repo"),
  githubBranch: text("github_branch"),
  supabaseProjectId: text("supabase_project_id"),
  neonProjectId: text("neon_project_id"),
  neonDevelopmentBranchId: text("neon_development_branch_id"),
  neonPreviewBranchId: text("neon_preview_branch_id"),
  vercelProjectId: text("vercel_project_id"),
  vercelProjectName: text("vercel_project_name"),
  vercelTeamId: text("vercel_team_id"),
  vercelDeploymentUrl: text("vercel_deployment_url"),
  chatContext: text("chat_context"),
});

export const chats = sqliteTable("chats", {
  id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
  appId: integer("app_id")
    .notNull()
    .references(() => apps.id, { onDelete: "cascade" }),
  title: text("title"),
  initialCommitHash: text("initial_commit_hash"),
  createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
});

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
  chatId: integer("chat_id")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  approvalState: text("approval_state", { enum: ["approved", "rejected"] }),
  commitHash: text("commit_hash"),
  createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
});

export const versions = sqliteTable(
  "versions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
    appId: integer("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    commitHash: text("commit_hash").notNull(),
    neonDbTimestamp: text("neon_db_timestamp"),
    createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
    updatedAt: integer("updated_at").default(sql`(unixepoch())`).notNull(),
  },
  (table) => [
    uniqueIndex("versions_app_commit_unique").on(table.appId, table.commitHash),
  ],
);

// =================== LANGUAGE MODELS ===================

export const languageModelProviders = sqliteTable("language_model_providers", {
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull(),
  apiBaseUrl: text("api_base_url").notNull(),
  envVarName: text("env_var_name"),
  createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`).notNull(),
});

export const languageModels = sqliteTable("language_models", {
  id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
  displayName: text("display_name").notNull(),
  apiName: text("api_name").notNull(),
  builtinProviderId: text("builtin_provider_id"),
  customProviderId: text("custom_provider_id").references(
    () => languageModelProviders.id,
    { onDelete: "cascade" },
  ),
  description: text("description"),
  maxOutputTokens: integer("max_output_tokens"),
  contextWindow: integer("context_window"),
  createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`).notNull(),
});

// =================== BOLT PROJECTS ===================

export const boltProjects = sqliteTable("bolt_projects", {
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  template: text("template"),
  framework: text("framework"),
  devServerPort: integer("dev_server_port"),
  devServerPid: integer("dev_server_pid"),
  isRunning: integer("is_running", { mode: "boolean" }).default(false),
  createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`).notNull(),
});

export const boltFiles = sqliteTable("bolt_files", {
  id: text("id").primaryKey().notNull(),
  projectId: text("project_id")
    .notNull()
    .references(() => boltProjects.id, { onDelete: "cascade" }),
  path: text("path").notNull(),
  content: text("content").notNull(),
  type: text("type").default("file").notNull(),
  createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`).notNull(),
});

// =================== ALIASES ===================

export { boltProjects as projects, boltFiles as files };
