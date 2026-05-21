import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString =
  process.env.DATABASE_URL ?? 'postgresql://prudens:prudens@localhost:5432/prudens_index';

const client = postgres(connectionString);
export const db = drizzle(client);
