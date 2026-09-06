import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { JOB_CATEGORY_SLUGS } from '$lib/job-category-pages';
import { getTagCountsBySlugs } from '$lib/server/job-category-jobs';

const MAX_SLUGS = 40;

export const GET: RequestHandler = async ({ url }) => {
	try {
		const raw = url.searchParams.get('slugs') ?? '';
		const slugs = [
			...new Set(
				raw
					.split(',')
					.map((s) => s.trim().toLowerCase())
					.filter((s) => s.length > 0 && JOB_CATEGORY_SLUGS.has(s))
			)
		].slice(0, MAX_SLUGS);

		if (!slugs.length) {
			return json({ counts: {} as Record<string, number> });
		}

		const counts = await getTagCountsBySlugs(slugs);
		return json({ counts });
	} catch (err) {
		console.error('GET /api/tags/counts failed', err);
		error(500, 'Could not load tag counts');
	}
};
