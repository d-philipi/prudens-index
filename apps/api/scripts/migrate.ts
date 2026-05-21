import '../src/lib/load-env.js';

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, '../drizzle/migrations/0000_init.sql');
const sqlText = readFileSync(sqlPath, 'utf8');

const db = postgres(
  process.env.DATABASE_URL ?? 'postgresql://prudens:prudens@localhost:5432/prudens_index',
);

await db.unsafe(sqlText);
console.log('Migration applied');
await db.end();
