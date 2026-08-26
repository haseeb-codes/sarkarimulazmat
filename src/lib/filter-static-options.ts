import { DEGREE_SPECIALIZATIONS } from '$lib/degree-specializations';

/** Static portal labels for the filter select (not loaded from the database). */
export const PORTAL_OPTIONS = [
	'Career Testing Services Pakistan (CTSP)',
	'DGPR Balochistan',
	'Educational Testing & Evaluation Agency (ETEA)',
	'Federal Public Service Commission (FPSC)',
	'HR1384',
	'IWork4Sindh (IW4S)',
	'National Jobs Portal (NJP)',
	'National Testing Service (NTS)',
	'Open Testing Service (OTS)',
	'Pakistan Testing Service (PTS)',
	'Punjab Jobs Portal',
	'Punjab Public Service Commission (PPSC)',
	'SIBA Testing Services (STS)'
] as const;

/** Options for the jobs filter drawer — fully static, safe for immediate client render. */
export type DrawerFilterOptions = {
	portals: string[];
	specializations: string[];
};

export const STATIC_DRAWER_FILTER_OPTIONS: DrawerFilterOptions = {
	portals: [...PORTAL_OPTIONS],
	specializations: DEGREE_SPECIALIZATIONS
};
