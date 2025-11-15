import type { Config } from "drizzle-kit";
import path from "path";
import { getUserDataPath } from "./src/paths/paths";

// Path to SQLite DB file
const dbPath = path.join(getUserDataPath(), "sqlite.db");

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: dbPath,
  },
} satisfies Config;
