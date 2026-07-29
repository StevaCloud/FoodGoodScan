import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../.env') });

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL non défini');

const adapter = new PrismaPg(connectionString);
export const prisma = new PrismaClient({ adapter });
