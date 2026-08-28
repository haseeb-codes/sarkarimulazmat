import db from '$lib/server/db';
import { adDetailHref } from '$lib/ads-utils';
import { JOB_CATEGORY_PAGES, JOB_CATEGORY_SLUGS } from '$lib/job-category-pages';
import { jobDetailHref } from '$lib/jobs-utils';
import { IS_ACTIVE_AD } from '$lib/server/ads';
import { IS_ACTIVE_JOB } from '$lib/server/jobs';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const base = url.origin;
	const startOfToday = new Date();
	startOfToday.setUTCHours(0, 0, 0, 0);

	const [activeJobs, activeAds, categories] = await Promise.all([
		db.jobPostings.findMany({
			where: {
				AND: [
					IS_ACTIVE_JOB,
					{
						OR: [{ last_date_to_apply: null }, { last_date_to_apply: { gte: startOfToday } }]
					}
				]
			},
			select: { slug: true, file_creation_date: true },
			orderBy: { row_id: 'desc' },
			take: 5000
		}),
		db.ads.findMany({
			where: IS_ACTIVE_AD,
			select: { ad_slug: true, file_creation_date: true },
			orderBy: { file_creation_date: 'desc' },
			take: 5000
		}),
		db.categoryPage
			.findMany({
				where: { is_indexed: true },
				select: { slug: true, updated_at: true }
			})
			.catch(() => [] as { slug: string; updated_at: Date }[])
	]);

	const today = new Date().toISOString().slice(0, 10);

	const urls = [
		{ loc: `${base}/`, priority: '1.0', lastmod: undefined as string | undefined },
		{
			loc: `${base}/about`,
			lastmod: today,
			priority: '0.8'
		},
		{
			loc: `${base}/contact`,
			lastmod: today,
			priority: '0.8'
		},
		{
			loc: `${base}/tags`,
			lastmod: today,
			priority: '0.9'
		},
		{
			loc: `${base}/ads`,
			lastmod: today,
			priority: '0.9'
		},
		...JOB_CATEGORY_PAGES.map((c) => ({
			loc: `${base}/${c.slug}`,
			lastmod: today,
			priority: '0.9'
		})),
		...categories
			.filter((c) => !JOB_CATEGORY_SLUGS.has(c.slug))
			.map((c) => ({
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
		})),
		...activeAds.map((ad) => ({
			loc: `${base}${adDetailHref(ad.ad_slug)}`,
			lastmod: ad.file_creation_date
				? new Date(ad.file_creation_date).toISOString().slice(0, 10)
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
