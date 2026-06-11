import { neon } from "@neondatabase/serverless";

type SqlClient = ReturnType<typeof neon>;

let client: SqlClient | null = null;

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (process.env.DATABASE_URL.startsWith("psql ")) {
    throw new Error("DATABASE_URL must be the postgres URL only, without the psql command.");
  }

  if (
    process.env.DATABASE_URL.startsWith("\"") ||
    process.env.DATABASE_URL.startsWith("'")
  ) {
    throw new Error("DATABASE_URL must not include wrapping quotes.");
  }

  if (!client) {
    client = neon(process.env.DATABASE_URL);
  }

  return client;
}

export function makeId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}`;
}
