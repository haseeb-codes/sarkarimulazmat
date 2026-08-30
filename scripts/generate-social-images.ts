/**
 * Capture social job images from /social/[slug] pages.
 *
 * Usage:
 *   npm run dev
 *   npm run social:images -- --slug mbbs-jobs
 *   npm run social:images -- --all
 *   npm run social:images -- --slug mbbs-jobs --format story --all-pages
 *
 * Env:
 *   BASE_URL — app origin (default http://localhost:5173)
 *   SOCIAL_IMAGES_DIR — output folder (default output/social-images)
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { JOB_CATEGORY_PAGES } from '../src/lib/job-category-pages.ts';
import {
	SOCIAL_IMAGE_FORMATS,
	type SocialImageFormat
} from '../src/lib/social-job-images.ts';

const BASE_URL = (process.env.BASE_URL ?? 'http://localhost:5173').replace(/\/$/, '');
const OUTPUT_DIR = path.resolve(process.env.SOCIAL_IMAGES_DIR ?? 'output/social-images');

type CliOptions = {
	slugs: string[];
	formats: SocialImageFormat[];
	allPages: boolean;
	allCategories: boolean;
};

function parseArgs(argv: string[]): CliOptions {
	const slugs: string[] = [];
	const formats = new Set<SocialImageFormat>();
	let allPages = false;
	let allCategories = false;

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === '--all') {
			allCategories = true;
			continue;
		}
		if (arg === '--all-pages') {
			allPages = true;
			continue;
		}
		if (arg === '--slug' && argv[i + 1]) {
			slugs.push(argv[++i]);
			continue;
		}
		if (arg.startsWith('--slug=')) {
			slugs.push(arg.slice('--slug='.length));
			continue;
		}
		if (arg === '--format' && argv[i + 1]) {
			const value = argv[++i];
			if (value === 'feed' || value === 'story' || value === 'all') {
				if (value === 'all') {
					formats.add('feed');
					formats.add('story');
				} else {
					formats.add(value);
				}
			}
			continue;
		}
		if (arg.startsWith('--format=')) {
			const value = arg.slice('--format='.length);
			if (value === 'feed' || value === 'story' || value === 'all') {
				if (value === 'all') {
					formats.add('feed');
					formats.add('story');
				} else {
					formats.add(value);
				}
			}
		}
	}

	return {
		slugs: allCategories ? JOB_CATEGORY_PAGES.map((page) => page.slug) : slugs,
		formats: formats.size ? [...formats] : ['feed'],
		allPages,
		allCategories
	};
}

function socialUrl(slug: string, format: SocialImageFormat, page: number): string {
	const url = new URL(`${BASE_URL}/social/${slug}`);
	url.searchParams.set('format', format);
	if (page > 1) url.searchParams.set('page', String(page));
	return url.toString();
}

function outputPath(slug: string, format: SocialImageFormat, page: number, totalPages: number): string {
	const suffix = totalPages > 1 ? `-p${page}` : '';
	return path.join(OUTPUT_DIR, `${slug}-${format}${suffix}.png`);
}

async function captureImage(
	page: import('playwright').Page,
	slug: string,
	format: SocialImageFormat,
	pageNumber: number
): Promise<{ totalPages: number; totalJobs: number; skipped: boolean }> {
	const url = socialUrl(slug, format, pageNumber);
	await page.goto(url, { waitUntil: 'networkidle' });

	const root = page.locator('.social-image-root');
	await root.waitFor({ state: 'visible', timeout: 30_000 });
	await page.waitForSelector('[data-social-image="ready"]', { timeout: 30_000 });

	const totalPages = Number(await root.getAttribute('data-total-pages')) || 1;
	const totalJobs = Number(await root.getAttribute('data-total-jobs')) || 0;

	if (totalJobs === 0) {
		return { totalPages, totalJobs, skipped: true };
	}

	const filePath = outputPath(slug, format, pageNumber, totalPages);
	await root.screenshot({ path: filePath, type: 'png' });
	console.log(`Saved ${filePath}`);
	return { totalPages, totalJobs, skipped: false };
}

async function main() {
	const options = parseArgs(process.argv.slice(2));

	if (!options.slugs.length) {
		console.error(
			'Provide --slug <name> (e.g. mbbs-jobs) or --all to render every category page.'
		);
		process.exit(1);
	}

	await mkdir(OUTPUT_DIR, { recursive: true });

	const browser = await chromium.launch({ headless: true });
	const page = await browser.newPage({
		viewport: { width: 1200, height: 2100 },
		deviceScaleFactor: 1
	});

	const manifest: Array<{
		slug: string;
		format: SocialImageFormat;
		page: number;
		file: string;
		totalJobs: number;
	}> = [];

	try {
		for (const slug of options.slugs) {
			for (const format of options.formats) {
				const first = await captureImage(page, slug, format, 1);
				if (first.skipped) {
					console.log(`Skipped ${slug} (${format}) — no active jobs`);
					continue;
				}

				const pagesToRender = options.allPages
					? Array.from({ length: first.totalPages }, (_, i) => i + 1)
					: [1];

				for (const pageNumber of pagesToRender) {
					if (pageNumber > 1) {
						await captureImage(page, slug, format, pageNumber);
					}

					manifest.push({
						slug,
						format,
						page: pageNumber,
						file: path.relative(process.cwd(), outputPath(slug, format, pageNumber, first.totalPages)),
						totalJobs: first.totalJobs
					});
				}
			}
		}
	} finally {
		await browser.close();
	}

	const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
	await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
	console.log(`Wrote ${manifestPath}`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
