import { writable } from 'svelte/store';

export type BrowseViewMode = 'masonry' | 'list';

	const VIEW_STORAGE_KEY = 'jobs-view-mode';

function readStoredView(): BrowseViewMode {
	if (typeof localStorage === 'undefined') return 'masonry';
	try {
		const stored = localStorage.getItem(VIEW_STORAGE_KEY);
		if (stored === 'list' || stored === 'masonry') return stored;
	} catch {
		/* ignore */
	}
	return 'masonry';
}

/** Shared so sticky toolbar and job cards stay in sync without portal hacks. */
export const browseViewMode = writable<BrowseViewMode>(readStoredView());

/** Infinite-scroll “shown” count for the sticky results toolbar. */
export const browseShownCount = writable(0);

export function setBrowseViewMode(next: BrowseViewMode) {
	browseViewMode.set(next);
	try {
		localStorage.setItem(VIEW_STORAGE_KEY, next);
	} catch {
		/* ignore */
	}
}

/** Default to list layout on small screens when the user has no saved preference. */
export function initBrowseViewModeForViewport(): void {
	if (typeof localStorage === 'undefined') return;
	try {
		if (localStorage.getItem(VIEW_STORAGE_KEY)) return;
	} catch {
		return;
	}
	if (window.matchMedia('(max-width: 639px)').matches) {
		setBrowseViewMode('list');
	}
}
