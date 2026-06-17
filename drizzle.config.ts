import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables from the .env file
dotenv.config({ path: ".env" });

export default defineConfig({
  schema: "./src/db/schema/",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
