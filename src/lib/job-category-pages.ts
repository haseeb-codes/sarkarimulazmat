/** Job flag columns on JobPostings — each powers a shareable /{slug} landing page. */
export const JOB_CATEGORY_COLUMNS = [
	'is_army_officer_required',
	'is_women_only_job',
	'is_law_enforcement_job',
	'is_management_job',
	'is_driver_job',
	'is_nursing_job',
	'is_allied_health_job',
	'is_bds_job',
	'is_dpt_job',
	'is_naib_qasid_job',
	'is_cooking_job',
	'is_computer_science_job',
	'is_information_technology_job',
	'is_llb_job',
	'is_mbbs_job',
	'is_pharmacist_job',
	'is_teaching_job',
	'is_education_degree_job',
	'is_civil_engineer_job',
	'is_mechanical_engineer_job',
	'is_electrical_engineer_job',
	'is_chemical_metallurgy_engineer_job',
	'is_mechatronics_engineer_job',
	'is_aviation_aeronautics_job',
	'is_dae_job',
	'is_mba_job',
	'is_mcom_job',
	'is_bcom_job',
	'is_commerce_job',
	'is_accounting_finance_job',
	'is_acca_job',
	'is_acma_job',
	'is_statistician_job',
	'is_data_science_job',
	'is_agriculture_job',
	'is_environmental_sciences_job',
	'is_social_science_job',
	'is_psychology_job',
	'is_islamic_studies_job',
	'is_communication_studies_job',
	'is_economist_job'
] as const;

export type JobCategoryColumn = (typeof JOB_CATEGORY_COLUMNS)[number];

export type JobCategoryPageDef = {
	slug: string;
	/** When set, jobs match if `degree_area` contains any term (instead of the flag column). */
	degree_area_terms?: string[];
	/** When set, jobs match if `title` contains any term (instead of the flag column). */
	title_terms?: string[];
	/** When set, jobs match if `education_level` contains any term (instead of the flag column). */
	education_level_terms?: string[];
	/** Active jobs posted or updated on today, or the most recent posting day. */
	latest_posted_day?: true;
	/** Active jobs whose apply-by date falls within the next N days (inclusive of today). */
	closing_soon_within_days?: number;
	/** Jobs where transgender candidates can apply (`gender` contains “Transgender”). */
	transgender_applicable?: true;
	column?: JobCategoryColumn;
	title: string;
	h1: string;
	metaDescription: string;
	emptyMessage: string;
};

export const LATEST_POSTED_JOBS_SLUG = 'latest-jobs';
export const CLOSING_SOON_JOBS_SLUG = 'closing-soon-jobs';
/** Deadline window for the Closing Soon tag (today through +N days). */
export const CLOSING_SOON_WITHIN_DAYS = 3;

export const JOB_CATEGORY_PAGES: JobCategoryPageDef[] = [
	{
		slug: LATEST_POSTED_JOBS_SLUG,
		latest_posted_day: true,
		title: 'Latest Government Jobs Posted Today in Pakistan — Sarkari Mulazmat',
		h1: 'Latest posted government jobs in Pakistan',
		metaDescription:
			'Government jobs posted today in Pakistan — or from the most recent day new listings were added.',
		emptyMessage: 'No new government job postings right now'
	},
	{
		slug: CLOSING_SOON_JOBS_SLUG,
		closing_soon_within_days: CLOSING_SOON_WITHIN_DAYS,
		title: 'Government Jobs Closing Soon in Pakistan — Sarkari Mulazmat',
		h1: 'Government jobs closing soon in Pakistan',
		metaDescription:
			'Government job openings in Pakistan with application deadlines in the next 3 days.',
		emptyMessage: 'No government jobs closing in the next 3 days'
	},
	{
		slug: 'army-officer-jobs',
		column: 'is_army_officer_required',
		title: 'Army Officer Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Army officer government jobs in Pakistan',
		metaDescription:
			'Current government job openings in Pakistan requiring army officer qualifications or military service background.',
		emptyMessage: 'No active army officer job openings right now'
	},
	{
		slug: 'women-only-jobs',
		column: 'is_women_only_job',
		title: 'Women-Only Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Women-only government jobs in Pakistan',
		metaDescription:
			'Government job openings in Pakistan reserved for female candidates only.',
		emptyMessage: 'No active women-only job openings right now'
	},
	{
		slug: 'transgender-applicable-jobs',
		transgender_applicable: true,
		title: 'Transgender Applicable Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Transgender applicable government jobs in Pakistan',
		metaDescription:
			'Government job openings in Pakistan where transgender candidates can also apply.',
		emptyMessage: 'No active transgender-applicable job openings right now'
	},
	{
		slug: 'law-enforcement-jobs',
		column: 'is_law_enforcement_job',
		title: 'Law Enforcement Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Law enforcement government jobs in Pakistan',
		metaDescription:
			'Police, levies, and other law enforcement government jobs in Pakistan.',
		emptyMessage: 'No active law enforcement job openings right now'
	},
	{
		slug: 'management-jobs',
		column: 'is_management_job',
		title: 'Management Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Management government jobs in Pakistan',
		metaDescription:
			'Government management and administrative job openings in Pakistan.',
		emptyMessage: 'No active management job openings right now'
	},
	{
		slug: 'driver-jobs',
		column: 'is_driver_job',
		title_terms: ['Driver'],
		title: 'Driver Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Driver government jobs in Pakistan',
		metaDescription: 'Government driver and transport job openings in Pakistan.',
		emptyMessage: 'No active driver job openings right now'
	},
	{
		slug: 'nursing-jobs',
		column: 'is_nursing_job',
		title: 'Nursing Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Nursing government jobs in Pakistan',
		metaDescription:
			'Government nursing job openings in Pakistan for qualified nursing staff.',
		emptyMessage: 'No active nursing job openings right now'
	},
	{
		slug: 'allied-health-jobs',
		column: 'is_allied_health_job',
		title: 'Allied Health Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Allied health government jobs in Pakistan',
		metaDescription:
			'Government allied health sciences job openings in Pakistan.',
		emptyMessage: 'No active allied health job openings right now'
	},
	{
		slug: 'bds-jobs',
		column: 'is_bds_job',
		title: 'BDS & Dentistry Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'BDS & dentistry government jobs in Pakistan',
		metaDescription:
			'Government dental and BDS job openings in Pakistan.',
		emptyMessage: 'No active BDS job openings right now'
	},
	{
		slug: 'dpt-jobs',
		column: 'is_dpt_job',
		title: 'DPT & Physiotherapy Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'DPT & physiotherapy government jobs in Pakistan',
		metaDescription:
			'Government physiotherapy and DPT job openings in Pakistan.',
		emptyMessage: 'No active DPT job openings right now'
	},
	{
		slug: 'naib-qasid-jobs',
		column: 'is_naib_qasid_job',
		title_terms: ['Naib Qasid'],
		title: 'Naib Qasid Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Naib qasid government jobs in Pakistan',
		metaDescription:
			'Government naib qasid and office support job openings in Pakistan.',
		emptyMessage: 'No active naib qasid job openings right now'
	},
	{
		slug: 'cooking-jobs',
		column: 'is_cooking_job',
		title: 'Cook & Kitchen Staff Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Cook & kitchen staff government jobs in Pakistan',
		metaDescription:
			'Government cook and kitchen staff job openings in Pakistan.',
		emptyMessage: 'No active cooking job openings right now'
	},
	{
		slug: 'computer-science-jobs',
		column: 'is_computer_science_job',
		degree_area_terms: [
			'Computer Science',
			'Computer Engineer',
			'Information Technology',
			'Computing'
		],
		title: 'Computer Science Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Computer science government jobs in Pakistan',
		metaDescription:
			'Government computer science job openings in Pakistan for BCS and related graduates.',
		emptyMessage: 'No active computer science job openings right now'
	},
	{
		slug: 'computer-operator-jobs',
		title_terms: ['Computer Operator', 'Data Entry'],
		title: 'Computer Operator Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Computer operator government jobs in Pakistan',
		metaDescription:
			'Government computer operator job openings in Pakistan.',
		emptyMessage: 'No active computer operator job openings right now'
	},
	{
		slug: 'helper-jobs',
		title_terms: ['Helper'],
		title: 'Helper Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Helper government jobs in Pakistan',
		metaDescription:
			'Government helper job openings in Pakistan.',
		emptyMessage: 'No active helper job openings right now'
	},
	{
		slug: 'clerk-jobs',
		title_terms: ['Clerk'],
		title: 'Clerk Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Clerk government jobs in Pakistan',
		metaDescription:
			'Government clerk job openings in Pakistan.',
		emptyMessage: 'No active clerk job openings right now'
	},
	{
		slug: 'sanitary-worker-jobs',
		title_terms: ['Aya', 'Cleaner', 'Sanitary', 'Sweeper'],
		title: 'Sanitary Worker Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Sanitary worker government jobs in Pakistan',
		metaDescription:
			'Government sanitary worker, sweeper, cleaner, and aya job openings in Pakistan.',
		emptyMessage: 'No active sanitary worker job openings right now'
	},
	{
		slug: 'admin-jobs',
		title_terms: ['Admin'],
		title: 'Admin Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Admin government jobs in Pakistan',
		metaDescription:
			'Government admin and administration job openings in Pakistan.',
		emptyMessage: 'No active admin job openings right now'
	},
	{
		slug: 'information-technology-jobs',
		column: 'is_information_technology_job',
		title: 'Information Technology Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Information technology government jobs in Pakistan',
		metaDescription:
			'Government IT job openings in Pakistan for BIT, BCS, and related qualifications.',
		emptyMessage: 'No active information technology job openings right now'
	},
	{
		slug: 'llb-jobs',
		column: 'is_llb_job',
		title: 'LLB & Law Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'LLB & law government jobs in Pakistan',
		metaDescription:
			'Government legal and LLB job openings in Pakistan.',
		emptyMessage: 'No active LLB job openings right now'
	},
	{
		slug: 'mbbs-jobs',
		column: 'is_mbbs_job',
		title: 'MBBS & Medical Doctor Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'MBBS & medical doctor government jobs in Pakistan',
		metaDescription:
			'Government MBBS and medical doctor job openings in Pakistan.',
		emptyMessage: 'No active MBBS job openings right now'
	},
	{
		slug: 'pharmacist-jobs',
		column: 'is_pharmacist_job',
		title: 'Pharmacist Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Pharmacist government jobs in Pakistan',
		metaDescription:
			'Government pharmacist and pharmacy job openings in Pakistan.',
		emptyMessage: 'No active pharmacist job openings right now'
	},
	{
		slug: 'teaching-jobs',
		column: 'is_teaching_job',
		title: 'Teaching Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Teaching government jobs in Pakistan',
		metaDescription:
			'Government teaching job openings in Pakistan for educators and lecturers.',
		emptyMessage: 'No active teaching job openings right now'
	},
	{
		slug: 'education-degree-jobs',
		column: 'is_education_degree_job',
		title: 'Education Degree Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Education degree government jobs in Pakistan',
		metaDescription:
			'Government jobs in Pakistan requiring education degrees such as B.Ed or M.Ed.',
		emptyMessage: 'No active education degree job openings right now'
	},
	{
		slug: 'civil-engineer-jobs',
		column: 'is_civil_engineer_job',
		degree_area_terms: ['Civil'],
		title: 'Civil Engineer Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Civil engineer government jobs in Pakistan',
		metaDescription:
			'Government civil engineering job openings in Pakistan.',
		emptyMessage: 'No active civil engineer job openings right now'
	},
	{
		slug: 'mechanical-engineer-jobs',
		column: 'is_mechanical_engineer_job',
		degree_area_terms: ['mechanical'],
		title: 'Mechanical Engineer Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Mechanical engineer government jobs in Pakistan',
		metaDescription:
			'Government mechanical engineering job openings in Pakistan.',
		emptyMessage: 'No active mechanical engineer job openings right now'
	},
	{
		slug: 'electrical-engineer-jobs',
		column: 'is_electrical_engineer_job',
		title: 'Electrical Engineer Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Electrical engineer government jobs in Pakistan',
		metaDescription:
			'Government electrical engineering job openings in Pakistan.',
		emptyMessage: 'No active electrical engineer job openings right now'
	},
	{
		slug: 'chemical-metallurgy-engineer-jobs',
		column: 'is_chemical_metallurgy_engineer_job',
		title: 'Chemical & Metallurgy Engineer Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Chemical & metallurgy engineer government jobs in Pakistan',
		metaDescription:
			'Government chemical and metallurgy engineering job openings in Pakistan.',
		emptyMessage: 'No active chemical & metallurgy engineer job openings right now'
	},
	{
		slug: 'mechatronics-engineer-jobs',
		column: 'is_mechatronics_engineer_job',
		title: 'Mechatronics Engineer Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Mechatronics engineer government jobs in Pakistan',
		metaDescription:
			'Government mechatronics engineering job openings in Pakistan.',
		emptyMessage: 'No active mechatronics engineer job openings right now'
	},
	{
		slug: 'aviation-aeronautics-jobs',
		column: 'is_aviation_aeronautics_job',
		title: 'Aviation & Aeronautics Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Aviation & aeronautics government jobs in Pakistan',
		metaDescription:
			'Government aviation and aeronautics job openings in Pakistan.',
		emptyMessage: 'No active aviation & aeronautics job openings right now'
	},
	{
		slug: 'dae-jobs',
		column: 'is_dae_job',
		education_level_terms: ['Diploma'],
		title: 'DAE Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'DAE government jobs in Pakistan',
		metaDescription:
			'Government job openings in Pakistan for DAE diploma holders.',
		emptyMessage: 'No active DAE job openings right now'
	},
	{
		slug: 'mba-jobs',
		column: 'is_mba_job',
		title: 'MBA Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'MBA government jobs in Pakistan',
		metaDescription:
			'Government job openings in Pakistan requiring MBA or business administration qualifications.',
		emptyMessage: 'No active MBA job openings right now'
	},
	{
		slug: 'mcom-jobs',
		column: 'is_mcom_job',
		title: 'M.Com Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'M.Com government jobs in Pakistan',
		metaDescription:
			'Government job openings in Pakistan for M.Com graduates.',
		emptyMessage: 'No active M.Com job openings right now'
	},
	{
		slug: 'bcom-jobs',
		column: 'is_bcom_job',
		title: 'B.Com Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'B.Com government jobs in Pakistan',
		metaDescription:
			'Government job openings in Pakistan for B.Com graduates.',
		emptyMessage: 'No active B.Com job openings right now'
	},
	{
		slug: 'commerce-jobs',
		column: 'is_commerce_job',
		title: 'Commerce Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Commerce government jobs in Pakistan',
		metaDescription:
			'Government commerce and business job openings in Pakistan.',
		emptyMessage: 'No active commerce job openings right now'
	},
	{
		slug: 'accounting-finance-jobs',
		column: 'is_accounting_finance_job',
		title: 'Accounting & Finance Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Accounting & finance government jobs in Pakistan',
		metaDescription:
			'Government accounting and finance job openings in Pakistan.',
		emptyMessage: 'No active accounting & finance job openings right now'
	},
	{
		slug: 'acca-jobs',
		column: 'is_acca_job',
		title: 'ACCA Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'ACCA government jobs in Pakistan',
		metaDescription:
			'Government job openings in Pakistan for ACCA qualified candidates.',
		emptyMessage: 'No active ACCA job openings right now'
	},
	{
		slug: 'acma-jobs',
		column: 'is_acma_job',
		title: 'ACMA Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'ACMA government jobs in Pakistan',
		metaDescription:
			'Government job openings in Pakistan for ACMA / CMA qualified candidates.',
		emptyMessage: 'No active ACMA job openings right now'
	},
	{
		slug: 'statistician-jobs',
		column: 'is_statistician_job',
		title: 'Statistician Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Statistician government jobs in Pakistan',
		metaDescription:
			'Government statistics and data analysis job openings in Pakistan.',
		emptyMessage: 'No active statistician job openings right now'
	},
	{
		slug: 'data-science-jobs',
		column: 'is_data_science_job',
		title: 'Data Science Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Data science government jobs in Pakistan',
		metaDescription:
			'Government data science and analytics job openings in Pakistan.',
		emptyMessage: 'No active data science job openings right now'
	},
	{
		slug: 'biology-jobs',
		degree_area_terms: ['biology', 'biologist'],
		title: 'Biology Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Biology government jobs in Pakistan',
		metaDescription:
			'Government biology and biologist job openings in Pakistan.',
		emptyMessage: 'No active biology job openings right now'
	},
	{
		slug: 'mathematics-jobs',
		degree_area_terms: ['maths', 'mathematics'],
		title: 'Mathematics Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Mathematics government jobs in Pakistan',
		metaDescription:
			'Government mathematics job openings in Pakistan.',
		emptyMessage: 'No active mathematics job openings right now'
	},
	{
		slug: 'physics-jobs',
		degree_area_terms: ['physics'],
		title: 'Physics Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Physics government jobs in Pakistan',
		metaDescription:
			'Government physics job openings in Pakistan.',
		emptyMessage: 'No active physics job openings right now'
	},
	{
		slug: 'chemistry-jobs',
		degree_area_terms: ['chemist'],
		title: 'Chemistry Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Chemistry government jobs in Pakistan',
		metaDescription:
			'Government chemistry and chemist job openings in Pakistan.',
		emptyMessage: 'No active chemistry job openings right now'
	},
	{
		slug: 'library-science-jobs',
		degree_area_terms: ['library'],
		title: 'Library Science Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Library science government jobs in Pakistan',
		metaDescription:
			'Government library science and librarian job openings in Pakistan.',
		emptyMessage: 'No active library science job openings right now'
	},
	{
		slug: 'agriculture-jobs',
		column: 'is_agriculture_job',
		title: 'Agriculture Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Agriculture government jobs in Pakistan',
		metaDescription:
			'Government agriculture and agronomy job openings in Pakistan.',
		emptyMessage: 'No active agriculture job openings right now'
	},
	{
		slug: 'environmental-sciences-jobs',
		column: 'is_environmental_sciences_job',
		title: 'Environmental Sciences Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Environmental sciences government jobs in Pakistan',
		metaDescription:
			'Government environmental sciences job openings in Pakistan.',
		emptyMessage: 'No active environmental sciences job openings right now'
	},
	{
		slug: 'social-science-jobs',
		column: 'is_social_science_job',
		title: 'Social Science Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Social science government jobs in Pakistan',
		metaDescription:
			'Government social science job openings in Pakistan.',
		emptyMessage: 'No active social science job openings right now'
	},
	{
		slug: 'psychology-jobs',
		column: 'is_psychology_job',
		title: 'Psychology Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Psychology government jobs in Pakistan',
		metaDescription:
			'Government psychology and mental health job openings in Pakistan.',
		emptyMessage: 'No active psychology job openings right now'
	},
	{
		slug: 'islamic-studies-jobs',
		column: 'is_islamic_studies_job',
		title: 'Islamic Studies Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Islamic studies government jobs in Pakistan',
		metaDescription:
			'Government Islamic studies job openings in Pakistan.',
		emptyMessage: 'No active Islamic studies job openings right now'
	},
	{
		slug: 'communication-studies-jobs',
		column: 'is_communication_studies_job',
		title: 'Communication Studies Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Communication studies government jobs in Pakistan',
		metaDescription:
			'Government communication and media studies job openings in Pakistan.',
		emptyMessage: 'No active communication studies job openings right now'
	},
	{
		slug: 'economist-jobs',
		column: 'is_economist_job',
		title: 'Economist Government Jobs in Pakistan — Sarkari Mulazmat',
		h1: 'Economist government jobs in Pakistan',
		metaDescription:
			'Government economics and economist job openings in Pakistan.',
		emptyMessage: 'No active economist job openings right now'
	}
];

const slugMap = new Map(JOB_CATEGORY_PAGES.map((page) => [page.slug, page]));

export function getJobCategoryPage(slug: string): JobCategoryPageDef | undefined {
	return slugMap.get(slug);
}

export function isJobCategoryShareSlug(slug: string): boolean {
	return slugMap.has(slug);
}

export const JOB_CATEGORY_SLUGS = new Set(JOB_CATEGORY_PAGES.map((page) => page.slug));

/** Short labels for the /tags index and navigation. */
export const JOB_CATEGORY_LABELS: Record<string, string> = {
	[LATEST_POSTED_JOBS_SLUG]: 'Latest Posted',
	[CLOSING_SOON_JOBS_SLUG]: 'Closing Soon',
	'army-officer-jobs': 'Army Officer',
	'women-only-jobs': 'Women Only',
	'transgender-applicable-jobs': 'Transgender Applicable',
	'law-enforcement-jobs': 'Law Enforcement',
	'management-jobs': 'Management',
	'driver-jobs': 'Driver',
	'nursing-jobs': 'Nursing',
	'allied-health-jobs': 'Allied Health',
	'bds-jobs': 'BDS & Dentistry',
	'dpt-jobs': 'DPT & Physiotherapy',
	'naib-qasid-jobs': 'Naib Qasid',
	'cooking-jobs': 'Cook & Kitchen Staff',
	'computer-science-jobs': 'Computer Science',
	'computer-operator-jobs': 'Computer Operator',
	'helper-jobs': 'Helper',
	'clerk-jobs': 'Clerk',
	'sanitary-worker-jobs': 'Sanitary Workers',
	'admin-jobs': 'Admin',
	'information-technology-jobs': 'Information Technology',
	'llb-jobs': 'LLB & Law',
	'mbbs-jobs': 'MBBS & Medical',
	'pharmacist-jobs': 'Pharmacist',
	'teaching-jobs': 'Teaching',
	'education-degree-jobs': 'Education Degree (B.Ed / M.Ed)',
	'civil-engineer-jobs': 'Civil Engineer',
	'mechanical-engineer-jobs': 'Mechanical Engineer',
	'electrical-engineer-jobs': 'Electrical Engineer',
	'chemical-metallurgy-engineer-jobs': 'Chemical & Metallurgy Engineer',
	'mechatronics-engineer-jobs': 'Mechatronics Engineer',
	'aviation-aeronautics-jobs': 'Aviation & Aeronautics',
	'dae-jobs': 'DAE',
	'mba-jobs': 'MBA',
	'mcom-jobs': 'Commerce (M.COM/B.COM)',
	'bcom-jobs': 'B.Com',
	'commerce-jobs': 'Commerce',
	'accounting-finance-jobs': 'Accounting & Finance',
	'acca-jobs': 'ACCA',
	'acma-jobs': 'ACMA / CMA',
	'statistician-jobs': 'Statistician',
	'data-science-jobs': 'Data Science',
	'biology-jobs': 'Biology',
	'mathematics-jobs': 'Mathematics',
	'physics-jobs': 'Physics',
	'chemistry-jobs': 'Chemistry',
	'library-science-jobs': 'Library Science',
	'agriculture-jobs': 'Agriculture',
	'environmental-sciences-jobs': 'Environmental Sciences',
	'social-science-jobs': 'Social Science',
	'psychology-jobs': 'Psychology',
	'islamic-studies-jobs': 'Islamic Studies',
	'communication-studies-jobs': 'Communication Studies',
	'economist-jobs': 'Economist'
};

/** Curated tags shown on the home page, in display order. */
export const HOME_PAGE_TAG_SLUGS = [
	'llb-jobs',
	'computer-science-jobs',
	'teaching-jobs',
	'mbbs-jobs',
	'mba-jobs',
	'accounting-finance-jobs',
	'economist-jobs',
	'civil-engineer-jobs',
	'dae-jobs'
] as const;

/** Optional home page display labels (defaults to `JOB_CATEGORY_LABELS`). */
export const HOME_PAGE_TAG_LABELS: Partial<Record<(typeof HOME_PAGE_TAG_SLUGS)[number], string>> = {
	'accounting-finance-jobs': 'Finance/M.COM/ACCA/CA/ACMA/B.COM',
	'mbbs-jobs': 'MBBS Doctors',
	'economist-jobs': 'Economics'
};

export type JobCategoryTag = JobCategoryPageDef & { label: string };

export function getJobCategoryTags(): JobCategoryTag[] {
	const tags = JOB_CATEGORY_PAGES.map((page) => ({
		...page,
		label:
			JOB_CATEGORY_LABELS[page.slug] ??
			page.h1.replace(/\s+government jobs in Pakistan$/i, '')
	})).sort((a, b) => a.label.localeCompare(b.label, 'en', { sensitivity: 'base' }));

	const pinnedSlugs = [LATEST_POSTED_JOBS_SLUG, CLOSING_SOON_JOBS_SLUG];
	const pinned = pinnedSlugs
		.map((slug) => tags.find((tag) => tag.slug === slug))
		.filter((tag): tag is JobCategoryTag => Boolean(tag));
	const pinnedSet = new Set(pinned.map((tag) => tag.slug));
	return [...pinned, ...tags.filter((tag) => !pinnedSet.has(tag.slug))];
}

export function getJobCategoryTagLabel(slug: string): string {
	const page = getJobCategoryPage(slug);
	if (!page) return slug;
	return JOB_CATEGORY_LABELS[page.slug] ?? page.h1.replace(/\s+government jobs in Pakistan$/i, '');
}

/** Category links shown on job cards (home / browse) — only these slugs. */
export const JOB_CARD_CATEGORY_SLUGS = [
	'mbbs-jobs',
	'llb-jobs',
	'accounting-finance-jobs',
	'dae-jobs',
	'islamic-studies-jobs',
	'computer-science-jobs',
	'computer-operator-jobs',
	'helper-jobs',
	'clerk-jobs',
	'sanitary-worker-jobs',
	'admin-jobs',
	'naib-qasid-jobs',
	'driver-jobs',
	'mba-jobs',
	'mcom-jobs',
	'acca-jobs',
	'biology-jobs',
	'mathematics-jobs',
	'physics-jobs',
	'chemistry-jobs',
	'library-science-jobs',
	'statistician-jobs',
	'civil-engineer-jobs',
	'mechanical-engineer-jobs',
	'electrical-engineer-jobs',
	'army-officer-jobs',
	'economist-jobs'
] as const;

const JOB_CARD_CATEGORY_SLUG_SET = new Set<string>(JOB_CARD_CATEGORY_SLUGS);

/** Fields needed to resolve which curated category tags apply to a job. */
export type JobCategoryMatchInput = {
	title?: string | null;
	degree_area?: string | null;
	degrees?: string | null;
	education_level?: string | null;
	gender?: string | null;
} & Partial<Record<JobCategoryColumn, number | null>>;

export type JobCategoryTagRef = { slug: string; label: string };

/** Allowlisted category tags for a job card (MBBS, LLB, Accounting & Finance, DAE, Islamic Studies, Computer Science, Computer Operator, Helper, Clerk, Sanitary Workers, Admin, Naib Qasid, Driver, MBA, Commerce M.COM/B.COM, ACCA, Biology, Mathematics, Physics, Chemistry, Library Science, Statistician, Civil Engineer, Mechanical Engineer, Electrical Engineer, Army Officer, Economist). */
export function getJobCategoryTagsForJob(job: JobCategoryMatchInput): JobCategoryTagRef[] {
	const tags: JobCategoryTagRef[] = [];

	for (const page of JOB_CATEGORY_PAGES) {
		if (!JOB_CARD_CATEGORY_SLUG_SET.has(page.slug)) continue;

		let matches = false;
		if (page.degree_area_terms?.length) {
			const area = job.degree_area?.toLowerCase() ?? '';
			const degreeMatch = page.degree_area_terms.some((term) =>
				area.includes(term.toLowerCase())
			);
			// When a flag column is also set, include either match (e.g. Civil flag OR "Civil" in degree_area).
			matches =
				degreeMatch || Boolean(page.column && job[page.column] === 1);
		} else if (page.title_terms?.length) {
			const title = job.title?.toLowerCase() ?? '';
			const titleMatch = page.title_terms.some((term) =>
				title.includes(term.toLowerCase())
			);
			matches =
				titleMatch || Boolean(page.column && job[page.column] === 1);
		} else if (page.education_level_terms?.length) {
			const level = job.education_level?.toLowerCase() ?? '';
			matches = page.education_level_terms.some((term) => level.includes(term.toLowerCase()));
		} else if (page.transgender_applicable) {
			matches = (job.gender ?? '').toLowerCase().includes('transgender');
		} else if (page.slug === 'mcom-jobs') {
			// Card label is "Commerce (M.COM/B.COM)" — show for either flag.
			matches = job.is_mcom_job === 1 || job.is_bcom_job === 1;
		} else if (page.slug === 'acca-jobs') {
			matches =
				job.is_acca_job === 1 ||
				(job.degrees ?? '').toLowerCase().includes('acca');
		} else if (page.column) {
			matches = job[page.column] === 1;
		}

		if (matches) {
			tags.push({ slug: page.slug, label: getJobCategoryTagLabel(page.slug) });
		}
	}

	return tags;
}

export const SITE_NAME = 'Sarkari Mulazmat';
export const SITE_URL = 'www.sarkarimulazmat.com';
export const SITE_HREF = 'https://www.sarkarimulazmat.com';
