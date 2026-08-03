import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.ts';

// PostgreSQL connection URI loaded dynamically from environment
const databaseUrl = Deno.env.get("DATABASE_URL");
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not defined in .env file");
}

const queryClient = postgres(databaseUrl);
export const db = drizzle(queryClient, { schema });
