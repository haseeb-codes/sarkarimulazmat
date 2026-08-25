import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listJobs, parseJobFilters } from '$lib/server/jobs';

/** Fields needed by JobCard / JobList — keep the infinite-scroll payload lean. */
function toListJob(job: Awaited<ReturnType<typeof listJobs>>['jobs'][number]) {
	return {
		row_id: job.row_id,
		slug: job.slug,
		title: job.title,
		department: job.department,
		education_level: job.education_level,
		project_program_name: job.project_program_name,
		degree_area: job.degree_area,
		degrees: job.degrees,
		grade: job.grade,
		place_of_posting: job.place_of_posting,
		domicile: job.domicile,
		gender: job.gender,
		disability_quota: job.disability_quota,
		collar: job.collar,
		donor_name: job.donor_name,
		salary: job.salary,
		min_age: job.min_age,
		max_age: job.max_age,
		ad_date: job.ad_date ? job.ad_date.toISOString().slice(0, 10) : null,
		last_date_to_apply: job.last_date_to_apply
			? job.last_date_to_apply.toISOString().slice(0, 10)
			: null,
		supabase_file_path: job.supabase_file_path,
		application_online_address: job.application_online_address,
		email: job.email
	};
}

export const GET: RequestHandler = async ({ url }) => {
	try {
		const filters = parseJobFilters(url);
		const result = await listJobs(filters);
		return json({
			jobs: result.jobs.map(toListJob),
			total: result.total,
			page: result.page,
			pageSize: result.pageSize,
			totalPages: result.totalPages
		});
	} catch (err) {
		console.error('GET /api/jobs failed', err);
		error(500, 'Could not load jobs');
	}
};
