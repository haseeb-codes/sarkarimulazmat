import { writable } from 'svelte/store';

/**
 * YYYY-MM-DD of the most recent day that has active job postings.
 * Used so "New" badges mark that day only (today when jobs were added, else the prior posting day).
 */
export const latestPostedDay = writable<string | null>(null);

export function setLatestPostedDay(dates: string[] | null | undefined) {
	latestPostedDay.set(dates?.[0] ?? null);
}
