import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.ts';

// PostgreSQL connection URI loaded dynamically from environment with generic local fallback
const databaseUrl = Deno.env.get("DATABASE_URL") || "postgres://postgres:postgres@localhost:5432/qrispaymti";

const queryClient = postgres(databaseUrl);
export const db = drizzle(queryClient, { schema });
