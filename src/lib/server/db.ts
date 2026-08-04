import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '$lib/server/generated/prisma/client';
import { DATABASE_URL } from '$env/static/private';
import pg from 'pg';

const globalForDb = globalThis as unknown as {
	prisma?: PrismaClient;
	pgPool?: pg.Pool;
};

function createPrismaClient() {
	const pool =
		globalForDb.pgPool ??
		new pg.Pool({
			connectionString: DATABASE_URL,
			// Keep pool small — Supabase pooler has connection limits and
			// serverless/dev HMR can multiply instances.
			max: 5
		});

	if (process.env.NODE_ENV !== 'production') {
		globalForDb.pgPool = pool;
	}

	const adapter = new PrismaPg(pool);
	return new PrismaClient({ adapter });
}

const db = globalForDb.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
	globalForDb.prisma = db;
}

export default db;
