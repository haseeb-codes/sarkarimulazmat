/**
 * Client-side batcher for job-card category tag counts.
 * Multiple cards queue slugs in the same tick → one /api/tags/counts request.
 */

type Listener = () => void;

/** Cached count, or -1 if the fetch failed (hide count in UI). */
const cache = new Map<string, number>();
const listeners = new Set<Listener>();
const queued = new Set<string>();
const inflight = new Set<string>();

let flushTimer: ReturnType<typeof setTimeout> | null = null;

const FETCH_FAILED = -1;

export function getCachedTagCount(slug: string): number | undefined {
	const value = cache.get(slug);
	if (value === undefined) return undefined;
	if (value === FETCH_FAILED) return undefined;
	return value;
}

/** True once a fetch finished for this slug (success or failure). */
export function isTagCountSettled(slug: string): boolean {
	return cache.has(slug);
}

/** Subscribe to cache updates (e.g. after a batch fetch completes). */
export function subscribeTagCounts(listener: Listener): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

function notify() {
	for (const listener of listeners) listener();
}

/** Queue slugs for a batched fetch. No-op for already-cached or in-flight slugs. */
export function ensureTagCounts(slugs: readonly string[]) {
	let added = false;
	for (const raw of slugs) {
		const slug = raw.trim().toLowerCase();
		if (!slug || cache.has(slug) || inflight.has(slug) || queued.has(slug)) continue;
		queued.add(slug);
		added = true;
	}
	if (added) scheduleFlush();
}

function scheduleFlush() {
	if (flushTimer != null) return;
	flushTimer = setTimeout(() => {
		flushTimer = null;
		void flush();
	}, 0);
}

async function flush() {
	const batch = [...queued];
	queued.clear();
	if (!batch.length) return;

	for (const slug of batch) inflight.add(slug);

	try {
		const params = new URLSearchParams({ slugs: batch.join(',') });
		const res = await fetch(`/api/tags/counts?${params}`);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);

		const data = (await res.json()) as { counts: Record<string, number> };
		for (const slug of batch) {
			cache.set(slug, data.counts[slug] ?? 0);
		}
		notify();
	} catch (err) {
		console.error('Failed to load tag job counts', err);
		for (const slug of batch) {
			if (!cache.has(slug)) cache.set(slug, FETCH_FAILED);
		}
		notify();
	} finally {
		for (const slug of batch) inflight.delete(slug);
		if (queued.size) scheduleFlush();
	}
}
