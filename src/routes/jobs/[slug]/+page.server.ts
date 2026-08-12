import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getJobById, getJobBySlug } from '$lib/server/jobs';
import { jobDetailHref } from '$lib/jobs-utils';

export const load: PageServerLoad = async ({ params }) => {
	const slug = params.slug?.trim();
	if (!slug) {
		error(404, 'Job not found');
	}

	const job = await getJobBySlug(slug);
	if (job) {
		return { job };
	}

	const id = Number(slug);
	if (Number.isInteger(id) && id >= 1) {
		const byId = await getJobById(id);
		if (byId?.slug) {
			redirect(301, jobDetailHref(byId.slug));
		}
	}

	error(404, 'Job not found');
};
