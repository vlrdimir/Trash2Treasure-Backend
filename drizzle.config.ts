import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./src/db/migrate",
  schema: "./src/db/schema",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
