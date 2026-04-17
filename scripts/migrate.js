#!/usr/bin/env node

import { Pool } from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
function loadEnvFile() {
  const envPath = path.join(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    envContent.split("\n").forEach((line) => {
      // Skip comments and empty lines
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith("#")) {
        return;
      }

      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length > 0) {
        let value = valueParts.join("=").trim();
        // Remove surrounding quotes if present
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = value;
        }
      }
    });
  }
}

// Load environment variables
loadEnvFile();

async function runMigrations() {
  const DATABASE_URL = process.env.DATABASE_URL;

  console.log(
    "🔍 Debug: DATABASE_URL =",
    DATABASE_URL ? "***configured***" : "NOT SET"
  );

  if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is required");
    console.log(
      "💡 Create a .env file with: DATABASE_URL=postgres://username:password@localhost:5432/database_name"
    );
    process.exit(1);
  }

  // Determine if this is a local connection (no SSL needed)
  const isLocalConnection =
    DATABASE_URL.includes("localhost") ||
    DATABASE_URL.includes("127.0.0.1") ||
    process.env.PGSSLMODE === "disable";

  const pool = new Pool({
    connectionString: DATABASE_URL,
    // Disable SSL for local connections, enable for remote (Supabase, etc.)
    ssl: isLocalConnection
      ? false
      : process.env.PGSSLMODE === "disable"
      ? false
      : { rejectUnauthorized: false },
  });

  try {
    console.log("🔗 Connecting to database...");

    // Run migrations
    // Check root migrations first, then app/migrations as fallback
    let actualMigrationsDir = path.join(__dirname, "..", "migrations");
    if (!fs.existsSync(actualMigrationsDir)) {
      actualMigrationsDir = path.join(__dirname, "..", "app", "migrations");
    }

    if (!fs.existsSync(actualMigrationsDir)) {
      console.error(`❌ Migrations directory not found. Checked:`);
      console.error(`   - ${path.join(__dirname, "..", "migrations")}`);
      console.error(`   - ${path.join(__dirname, "..", "app", "migrations")}`);
      process.exit(1);
    }

    const migrationFiles = fs
      .readdirSync(actualMigrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort(); // Run in alphabetical order

    console.log(
      `📁 Found ${migrationFiles.length} migration files in ${actualMigrationsDir}`
    );

    for (const file of migrationFiles) {
      console.log(`⚡ Running migration: ${file}`);

      const migrationPath = path.join(actualMigrationsDir, file);
      const sql = fs.readFileSync(migrationPath, "utf8");

      try {
        await pool.query(sql);
        console.log(`✅ Completed migration: ${file}`);
      } catch (error) {
        console.error(`❌ Failed to run migration ${file}:`, error.message);
        // Continue with other migrations instead of failing completely
      }
    }

    console.log("🎉 Migration process completed!");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
