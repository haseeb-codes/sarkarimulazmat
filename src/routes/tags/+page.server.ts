import type { PageServerLoad } from './$types';
import { getJobCategoryTags } from '$lib/job-category-pages';
import { countJobCategoryJobs } from '$lib/server/job-category-jobs';

export const load: PageServerLoad = async () => {
	const tags = getJobCategoryTags();

	const counts = await Promise.all(
		tags.map(async (tag) => ({
			slug: tag.slug,
			count: await countJobCategoryJobs(tag.column)
		}))
	);

	const countsBySlug = new Map(counts.map((c) => [c.slug, c.count]));

	return {
		tags: tags.map((tag) => ({
			...tag,
			count: countsBySlug.get(tag.slug) ?? 0
		}))
	};
};

