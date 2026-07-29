import { defineConfig } from 'prisma/config';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function getDbUrl(): string {
  try {
    const env = readFileSync(resolve(__dirname, '.env'), 'utf8');
    const m = env.match(/^DATABASE_URL=["']?([^"'\r\n]+)["']?/m);
    if (m?.[1]) return m[1];
  } catch {}
  return process.env.DATABASE_URL ?? '';
}

export default defineConfig({
  datasource: {
    url: getDbUrl(),
  },
});
