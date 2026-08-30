/**
 * Download portal logos from official websites into static/portals/.
 *
 * Uses curl (reliable on Windows) and Google's favicon service as fallback.
 *
 * Usage: npx tsx scripts/fetch-portal-logos.ts
 */
import { execFile } from 'node:child_process';
import { mkdir, readFile, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { JOB_PORTALS } from '../src/lib/job-portals.ts';

const execFileAsync = promisify(execFile);
const OUTPUT_DIR = path.resolve('static/portals');
const MIN_BYTES = 80;
const CURL = process.platform === 'win32' ? 'curl.exe' : 'curl';

function gstaticFaviconUrl(website: string, size = 128): string {
	return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(
		website
	)}&size=${size}`;
}

async function curlDownload(url: string, outPath: string): Promise<boolean> {
	try {
		await execFileAsync(CURL, [
			'-sL',
			'--max-time',
			'25',
			'-A',
			'SarkariMulazmat/1.0',
			'-o',
			outPath,
			url
		]);
		const fileStat = await stat(outPath);
		if (fileStat.size < MIN_BYTES) {
			await unlink(outPath);
			return false;
		}
		return true;
	} catch {
		try {
			await unlink(outPath);
		} catch {
			// ignore
		}
		return false;
	}
}

async function downloadLogo(portal: { slug: string; website: string }): Promise<boolean> {
	const outPath = path.join(OUTPUT_DIR, `${portal.slug}.png`);
	const candidates = [
		gstaticFaviconUrl(portal.website, 128),
		gstaticFaviconUrl(portal.website, 64),
		`${portal.website.replace(/\/$/, '')}/favicon.ico`,
		`${portal.website.replace(/\/$/, '')}/apple-touch-icon.png`
	];

	for (const url of candidates) {
		if (await curlDownload(url, outPath)) {
			const bytes = (await readFile(outPath)).length;
			console.log(`✓ ${portal.slug} ← ${url} (${bytes} bytes)`);
			return true;
		}
	}

	console.warn(`✗ ${portal.slug} — no logo found (${portal.website})`);
	return false;
}

await mkdir(OUTPUT_DIR, { recursive: true });

let ok = 0;
for (const portal of JOB_PORTALS) {
	if (await downloadLogo(portal)) ok += 1;
}

console.log(`Done: ${ok}/${JOB_PORTALS.length} logos saved to ${OUTPUT_DIR}`);
