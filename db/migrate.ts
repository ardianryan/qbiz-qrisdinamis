import { drizzle } from 'npm:drizzle-orm/postgres-js';
import { migrate } from 'npm:drizzle-orm/postgres-js/migrator';
import postgres from 'npm:postgres';

const databaseUrl = Deno.env.get('DATABASE_URL');
if (!databaseUrl) {
  console.error('DATABASE_URL is not set!');
  Deno.exit(1);
}

const migrationClient = postgres(databaseUrl, { max: 1 });
const db = drizzle(migrationClient);

console.log('[DB] Running Drizzle migrations...');
try {
  await migrate(db, { migrationsFolder: './db/migrations' });
  console.log('[DB] Migrations completed successfully!');
} catch (err) {
  console.error('[DB] Migration failed:', err);
  Deno.exit(1);
} finally {
  await migrationClient.end();
}
