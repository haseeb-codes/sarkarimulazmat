import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { isAdminJob } from '../src/lib/admin-job-classifier.ts';
import { PrismaClient } from '../src/lib/server/generated/prisma/client.ts';

const pool = new pg.Pool({
	connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
	max: 2
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const BATCH = 500;
let updated = 0;
let flagged = 0;
let cursor: string | undefined;

for (;;) {
	const jobs = await prisma.jobPostings.findMany({
		take: BATCH,
		...(cursor ? { skip: 1, cursor: { slug: cursor } } : {}),
		orderBy: { slug: 'asc' },
		select: {
			slug: true,
			title: true,
			degree_area: true,
			degrees: true,
			is_admin_job: true
		}
	});

	if (!jobs.length) break;

	for (const job of jobs) {
		const next = isAdminJob(job) ? 1 : 0;
		if (next) flagged += 1;
		if (job.is_admin_job !== next) {
			await prisma.jobPostings.update({
				where: { slug: job.slug },
				data: { is_admin_job: next }
			});
			updated += 1;
		}
	}

	cursor = jobs[jobs.length - 1]!.slug;
	if (jobs.length < BATCH) break;
}

console.log(JSON.stringify({ updated, flagged }, null, 2));

await prisma.$disconnect();
await pool.end();
