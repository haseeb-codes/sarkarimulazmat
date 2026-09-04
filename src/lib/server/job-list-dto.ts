import {
	getJobCategoryTagsForJob,
	type JobCategoryColumn,
	type JobCategoryTagRef
} from '$lib/job-category-pages';
import type { JobPostings } from '$lib/server/generated/prisma/client';

/** Public job shape for browse lists, API, and SvelteKit hydration — no internal DB fields. */
export type ListJob = {
	row_id: number;
	slug: string;
	title: string | null;
	department: string | null;
	education_level: string | null;
	project_program_name: string | null;
	degree_area: string | null;
	degrees: string | null;
	grade: string | null;
	place_of_posting: string | null;
	domicile: string | null;
	gender: string | null;
	disability_quota: boolean | null;
	collar: string | null;
	donor_name: string | null;
	salary: number | null;
	min_age: number | null;
	max_age: number | null;
	ad_date: string | null;
	last_date_to_apply: string | null;
	supabase_file_path: string | null;
	application_online_address: string | null;
	email: string | null;
	url_web_title: string | null;
	/** Curated category tags shown on the job card (allowlisted). */
	tags: JobCategoryTagRef[];
};

type ListJobSource = Pick<
	JobPostings,
	| 'row_id'
	| 'slug'
	| 'title'
	| 'department'
	| 'education_level'
	| 'project_program_name'
	| 'degree_area'
	| 'degrees'
	| 'grade'
	| 'place_of_posting'
	| 'domicile'
	| 'gender'
	| 'disability_quota'
	| 'collar'
	| 'donor_name'
	| 'salary'
	| 'min_age'
	| 'max_age'
	| 'ad_date'
	| 'last_date_to_apply'
	| 'supabase_file_path'
	| 'application_online_address'
	| 'email'
	| 'url_web_title'
> &
	Partial<Record<JobCategoryColumn, number | null>> & { row_id: number };

export function toListJob(job: ListJobSource): ListJob {
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
		email: job.email,
		url_web_title: job.url_web_title,
		tags: getJobCategoryTagsForJob(job)
	};
}

export function toListJobs(jobs: ListJobSource[]): ListJob[] {
	return jobs.map(toListJob);
}
