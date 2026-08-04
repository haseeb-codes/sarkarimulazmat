import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getJobById } from '$lib/server/jobs';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id) || id < 1) {
		error(404, 'Job not found');
	}

	const job = await getJobById(id);
	if (!job) {
		error(404, 'Job not found');
	}

	return { job };
};
