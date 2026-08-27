import { goto } from '$app/navigation';

/**
 * Same-tab app navigations that update browse filters/search.
 * Prevents SvelteKit's default scroll-to-top; the browse shell scrolls
 * only the results region under sticky chrome.
 */
export function navigateFilter(href: string): void {
	const url = new URL(href, location.origin);
	void goto(`${url.pathname}${url.search}${url.hash}`, {
		keepFocus: true,
		noScroll: true
	});
}

/** Click handler for filter/search `<a>` / badge links. */
export function onFilterLinkClick(event: MouseEvent): void {
	if (event.defaultPrevented) return;
	if (event.button !== 0) return;
	if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

	const anchor = event.currentTarget;
	if (!(anchor instanceof HTMLAnchorElement)) return;
	const href = anchor.getAttribute('href');
	if (!href || href.startsWith('#')) return;

	const url = new URL(href, location.origin);
	if (url.origin !== location.origin) return;

	event.preventDefault();
	navigateFilter(`${url.pathname}${url.search}${url.hash}`);
}
