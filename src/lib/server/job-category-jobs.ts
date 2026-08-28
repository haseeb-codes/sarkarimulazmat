import type { Prisma } from '$lib/server/generated/prisma/client';
import db from '$lib/server/db';
import type { JobCategoryColumn } from '$lib/job-category-pages';
import { toListJobs } from '$lib/server/job-list-dto';

function startOfTodayUtc(): Date {
	const today = new Date();
	today.setUTCHours(0, 0, 0, 0);
	return today;
}

function activeJobsWhere(column: JobCategoryColumn): Prisma.JobPostingsWhereInput {
	const startOfToday = startOfTodayUtc();

	return {
		[column]: 1,
		AND: [
			{ is_active: 1 },
			{ row_id: { not: null } },
			{
				OR: [{ last_date_to_apply: null }, { last_date_to_apply: { gte: startOfToday } }]
			}
		]
	};
}

export async function loadJobCategoryJobs(column: JobCategoryColumn) {
	const rawJobs = await db.jobPostings.findMany({
		where: activeJobsWhere(column),
		orderBy: [
			{ ad_date: { sort: 'desc', nulls: 'last' } },
			{ file_creation_date: { sort: 'desc', nulls: 'last' } },
			{ row_id: 'desc' }
		]
	});

	const jobs = rawJobs.filter(
		(job): job is (typeof rawJobs)[number] & { row_id: number } => job.row_id != null
	);

	return {
		jobs: toListJobs(jobs),
		updatedAt: new Date().toISOString()
	};
}

export async function countJobCategoryJobs(column: JobCategoryColumn) {
	// Count uses the same "active + not expired" filter as `loadJobCategoryJobs`,
	// but avoids fetching full rows.
	return db.jobPostings.count({
		where: activeJobsWhere(column)
	});
}
