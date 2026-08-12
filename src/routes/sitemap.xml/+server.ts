import db from '$lib/server/db';
import { jobDetailHref } from '$lib/jobs-utils';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const base = url.origin;
	const startOfToday = new Date();
	startOfToday.setUTCHours(0, 0, 0, 0);

	const [activeJobs, categories] = await Promise.all([
		db.jobPostings.findMany({
			where: {
				AND: [
					{ OR: [{ active: true }, { active: null }] },
					{
						OR: [{ last_date_to_apply: null }, { last_date_to_apply: { gte: startOfToday } }]
					}
				]
			},
			select: { slug: true, file_creation_date: true },
			orderBy: { row_id: 'desc' },
			take: 5000
		}),
		db.categoryPage
			.findMany({
				where: { is_indexed: true },
				select: { slug: true, updated_at: true }
			})
			.catch(() => [] as { slug: string; updated_at: Date }[])
	]);

	const urls = [
		{ loc: `${base}/`, priority: '1.0', lastmod: undefined as string | undefined },
		...categories.map((c) => ({
			loc: `${base}/${c.slug}`,
			lastmod: c.updated_at.toISOString().slice(0, 10),
			priority: '0.9'
		})),
		...activeJobs.map((j) => ({
			loc: `${base}${jobDetailHref(j.slug)}`,
			lastmod: j.file_creation_date
				? new Date(j.file_creation_date).toISOString().slice(0, 10)
				: undefined,
			priority: '0.8'
		}))
	];

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
	.map(
		(u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <priority>${u.priority}</priority>
  </url>`
	)
	.join('\n')}
</urlset>`;

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
