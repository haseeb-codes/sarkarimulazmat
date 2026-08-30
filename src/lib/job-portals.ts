/** Official job portal metadata — labels must match `PORTAL_OPTIONS` / Job Portal filter. */
export type JobPortal = {
	label: string;
	slug: string;
	/** Public homepage used to source the portal logo. */
	website: string;
	/** Static asset path (served from /portals/*). */
	logoSrc: string;
};

export const JOB_PORTALS: JobPortal[] = [
	{
		label: 'Career Testing Services Pakistan (CTSP)',
		slug: 'ctsp',
		website: 'https://www.ctsp.com.pk',
		logoSrc: '/portals/ctsp.png'
	},
	{
		label: 'DGPR Balochistan',
		slug: 'dgpr-balochistan',
		website: 'https://dpr.gob.pk',
		logoSrc: '/portals/dgpr-balochistan.png'
	},
	{
		label: 'Educational Testing & Evaluation Agency (ETEA)',
		slug: 'etea',
		website: 'https://www.etea.edu.pk',
		logoSrc: '/portals/etea.svg'
	},
	{
		label: 'Federal Public Service Commission (FPSC)',
		slug: 'fpsc',
		website: 'https://www.fpsc.gov.pk',
		logoSrc: '/portals/fpsc.png'
	},
	{
		label: 'IWork4Sindh (IW4S)',
		slug: 'iwork4sindh',
		website: 'https://www.iwork4sindh.com.pk',
		logoSrc: '/portals/iwork4sindh.png'
	},
	{
		label: 'National Jobs Portal (NJP)',
		slug: 'njp',
		website: 'https://www.njp.gov.pk',
		logoSrc: '/portals/njp.svg'
	},
	{
		label: 'National Testing Service (NTS)',
		slug: 'nts',
		website: 'https://www.nts.org.pk',
		logoSrc: '/portals/nts.png'
	},
	{
		label: 'Open Testing Service (OTS)',
		slug: 'ots',
		website: 'https://www.ots.org.pk',
		logoSrc: '/portals/ots.png'
	},
	{
		label: 'Pakistan Testing Service (PTS)',
		slug: 'pts',
		website: 'https://www.pts.org.pk',
		logoSrc: '/portals/pts.jpg'
	},
	{
		label: 'Punjab Jobs Portal',
		slug: 'punjab-jobs-portal',
		website: 'https://jobs.punjab.gov.pk',
		logoSrc: '/portals/punjab-jobs-portal.png'
	},
	{
		label: 'Punjab Public Service Commission (PPSC)',
		slug: 'ppsc',
		website: 'https://ppsc.gop.pk',
		logoSrc: '/portals/ppsc.png'
	},
	{
		label: 'SIBA Testing Services (STS)',
		slug: 'sts',
		website: 'https://www.sts.net.pk',
		logoSrc: '/portals/sts.png'
	}
];

export const JOB_PORTAL_BY_LABEL = new Map(JOB_PORTALS.map((portal) => [portal.label, portal]));
