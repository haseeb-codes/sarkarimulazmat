import { DEGREE_SPECIALIZATIONS } from '$lib/degree-specializations';
import { JOB_PORTALS } from '$lib/job-portals';

/** Static portal labels for the filter select (not loaded from the database). */
export const PORTAL_OPTIONS = JOB_PORTALS.map((portal) => portal.label);

/** Options for the jobs filter drawer — fully static, safe for immediate client render. */
export type DrawerFilterOptions = {
	portals: string[];
	specializations: string[];
};

export const STATIC_DRAWER_FILTER_OPTIONS: DrawerFilterOptions = {
	portals: [...PORTAL_OPTIONS],
	specializations: DEGREE_SPECIALIZATIONS
};
