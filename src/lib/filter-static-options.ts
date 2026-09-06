import { DEGREE_SPECIALIZATIONS } from '$lib/degree-specializations';
import { getJobCategoryTags } from '$lib/job-category-pages';
import { JOB_PORTALS } from '$lib/job-portals';

/** Static portal labels for the filter select (not loaded from the database). */
export const PORTAL_OPTIONS = JOB_PORTALS.map((portal) => portal.label);

/** Curated category tags for the Tags filter (slug + label only — no DB counts). */
export const TAG_FILTER_OPTIONS = getJobCategoryTags().map((tag) => ({
	slug: tag.slug,
	label: tag.label
}));

/** Options for the jobs filter drawer — fully static, safe for immediate client render. */
export type DrawerFilterOptions = {
	portals: string[];
	specializations: string[];
	tags: { slug: string; label: string }[];
};

export const STATIC_DRAWER_FILTER_OPTIONS: DrawerFilterOptions = {
	portals: [...PORTAL_OPTIONS],
	specializations: DEGREE_SPECIALIZATIONS,
	tags: TAG_FILTER_OPTIONS
};
