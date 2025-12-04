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

// =================== AUTHENTICATION ===================

export const users = sqliteTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`).notNull(),
});

export const userCredentials = sqliteTable("user_credentials", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  credentialType: text("credential_type", {
    enum: ["github_token", "vercel_token", "vercel_org_id", "vercel_project_id"],
  }).notNull(),
  encryptedValue: text("encrypted_value").notNull(),
  iv: text("iv").notNull(),
  createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`).notNull(),
});

// =================== BOLT PROJECTS ===================

export const boltProjects = sqliteTable("bolt_projects", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  template: text("template"),
  framework: text("framework"),
  repositoryUrl: text("repository_url"),
  deploymentUrl: text("deployment_url"),
  vercelProjectId: text("vercel_project_id"),
  devServerPort: integer("dev_server_port"),
  devServerPid: integer("dev_server_pid"),
  isRunning: integer("is_running", { mode: "boolean" }).default(false),
  createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`).notNull(),
});

export const boltFiles = sqliteTable("bolt_files", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  projectId: text("project_id")
    .notNull()
    .references(() => boltProjects.id, { onDelete: "cascade" }),
  path: text("path").notNull(),
  content: text("content").notNull(),
  type: text("type").default("file").notNull(),
  createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`).notNull(),
});

// =================== DEPLOYMENTS & ANALYTICS ===================

export const deployments = sqliteTable("deployments", {
  id: text("id").primaryKey().notNull(),
  projectId: text("project_id")
    .notNull()
    .references(() => boltProjects.id, { onDelete: "cascade" }),
  platform: text("platform", {
    enum: ["vercel", "netlify", "cloudflare", "railway", "github-pages"],
  }).notNull(),
  status: text("status", {
    enum: ["pending", "building", "success", "failed", "cancelled"],
  })
    .notNull()
    .default("pending"),
  environment: text("environment", {
    enum: ["production", "preview", "development"],
  })
    .notNull()
    .default("production"),
  deploymentUrl: text("deployment_url"),
  buildTime: integer("build_time"), // in seconds
  bundleSize: integer("bundle_size"), // in bytes
  errorMessage: text("error_message"),
  metadata: text("metadata"), // JSON string for platform-specific data
  createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
  completedAt: integer("completed_at"),
});

export const analytics = sqliteTable("analytics", {
  id: text("id").primaryKey().notNull(),
  projectId: text("project_id")
    .notNull()
    .references(() => boltProjects.id, { onDelete: "cascade" }),
  deploymentId: text("deployment_id").references(() => deployments.id, {
    onDelete: "cascade",
  }),
  metricType: text("metric_type", {
    enum: ["lighthouse", "error", "performance", "usage", "cost"],
  }).notNull(),
  metricName: text("metric_name").notNull(),
  metricValue: text("metric_value").notNull(), // stored as text, parse as needed
  metadata: text("metadata"), // JSON string for additional data
  recordedAt: integer("recorded_at").default(sql`(unixepoch())`).notNull(),
});

export const platformConfigs = sqliteTable("platform_configs", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  platform: text("platform", {
    enum: ["vercel", "netlify", "cloudflare", "railway", "github"],
  }).notNull(),
  apiKey: text("api_key"), // encrypted
  teamId: text("team_id"),
  accountId: text("account_id"),
  config: text("config"), // JSON string for platform-specific config
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`).notNull(),
});

export const projectStats = sqliteTable("project_stats", {
  id: text("id").primaryKey().notNull(),
  projectId: text("project_id")
    .notNull()
    .references(() => boltProjects.id, { onDelete: "cascade" })
    .unique(),
  totalDeployments: integer("total_deployments").default(0).notNull(),
  successfulDeployments: integer("successful_deployments").default(0).notNull(),
  failedDeployments: integer("failed_deployments").default(0).notNull(),
  avgBuildTime: integer("avg_build_time").default(0), // in seconds
  totalBuildTime: integer("total_build_time").default(0), // in seconds
  lastDeploymentAt: integer("last_deployment_at"),
  lastSuccessfulDeploymentAt: integer("last_successful_deployment_at"),
  updatedAt: integer("updated_at").default(sql`(unixepoch())`).notNull(),
});

// =================== ALIASES ===================

export { boltProjects as projects, boltFiles as files };











// import { sqliteTable, integer, text, uniqueIndex } from "drizzle-orm/sqlite-core";
// import { sql } from "drizzle-orm";

// // =================== CORE TABLES ===================

// export const apps = sqliteTable("apps", {
//   id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
//   name: text("name").notNull(),
//   path: text("path").notNull(),
//   createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
//   updatedAt: integer("updated_at").default(sql`(unixepoch())`).notNull(),
//   githubOrg: text("github_org"),
//   githubRepo: text("github_repo"),
//   githubBranch: text("github_branch"),
//   supabaseProjectId: text("supabase_project_id"),
//   neonProjectId: text("neon_project_id"),
//   neonDevelopmentBranchId: text("neon_development_branch_id"),
//   neonPreviewBranchId: text("neon_preview_branch_id"),
//   vercelProjectId: text("vercel_project_id"),
//   vercelProjectName: text("vercel_project_name"),
//   vercelTeamId: text("vercel_team_id"),
//   vercelDeploymentUrl: text("vercel_deployment_url"),
//   chatContext: text("chat_context"),
// });

// export const chats = sqliteTable("chats", {
//   id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
//   appId: integer("app_id")
//     .notNull()
//     .references(() => apps.id, { onDelete: "cascade" }),
//   title: text("title"),
//   initialCommitHash: text("initial_commit_hash"),
//   createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
// });

// export const messages = sqliteTable("messages", {
//   id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
//   chatId: integer("chat_id")
//     .notNull()
//     .references(() => chats.id, { onDelete: "cascade" }),
//   role: text("role", { enum: ["user", "assistant"] }).notNull(),
//   content: text("content").notNull(),
//   approvalState: text("approval_state", { enum: ["approved", "rejected"] }),
//   commitHash: text("commit_hash"),
//   createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
// });

// export const versions = sqliteTable(
//   "versions",
//   {
//     id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
//     appId: integer("app_id")
//       .notNull()
//       .references(() => apps.id, { onDelete: "cascade" }),
//     commitHash: text("commit_hash").notNull(),
//     neonDbTimestamp: text("neon_db_timestamp"),
//     createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
//     updatedAt: integer("updated_at").default(sql`(unixepoch())`).notNull(),
//   },
//   (table) => [
//     uniqueIndex("versions_app_commit_unique").on(table.appId, table.commitHash),
//   ],
// );

// // =================== BOLT PROJECTS (MULTI-USER ENABLED) ===================

// export const boltProjects = sqliteTable("bolt_projects", {
//   id: text("id").primaryKey().notNull(),
//   userId: text("user_id").notNull(),          // ⚡ Added
//   name: text("name").notNull(),
//   description: text("description"),
//   template: text("template"),
//   framework: text("framework"),
//   devServerPort: integer("dev_server_port"),
//   devServerPid: integer("dev_server_pid"),
//   isRunning: integer("is_running", { mode: "boolean" }).default(false),
//   createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
//   updatedAt: integer("updated_at").default(sql`(unixepoch())`).notNull(),
// });

// // =================== BOLT FILES (MULTI-USER ENABLED) ===================

// export const boltFiles = sqliteTable("bolt_files", {
//   id: text("id").primaryKey().notNull(),
//   userId: text("user_id").notNull(),          // ⚡ Added
//   projectId: text("project_id")
//     .notNull()
//     .references(() => boltProjects.id, { onDelete: "cascade" }),
//   path: text("path").notNull(),
//   content: text("content").notNull(),
//   type: text("type").default("file").notNull(),
//   createdAt: integer("created_at").default(sql`(unixepoch())`).notNull(),
//   updatedAt: integer("updated_at").default(sql`(unixepoch())`).notNull(),
// });

// // =================== ALIASES ===================

// export { boltProjects as projects, boltFiles as files };
