/** Detail page URL for a newspaper advertisement. */
export function adDetailHref(adSlug: string): string {
	return `/ad/${encodeURIComponent(adSlug)}`;
}
