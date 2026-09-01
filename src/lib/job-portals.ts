/** Official job portal metadata — labels must match `PORTAL_OPTIONS` / Job Portal filter. */
export type JobPortal = {
	label: string;
	/** Short display name for compact UI (e.g. NTS, FPSC). */
	shortLabel: string;
	slug: string;
	/** Public homepage used to source the portal logo. */
	website: string;
	/** Static asset path (served from /portals/*). */
	logoSrc: string;
};

export const JOB_PORTALS: JobPortal[] = [
	{
		label: 'Career Testing Services Pakistan (CTSP)',
		shortLabel: 'CTSP',
		slug: 'ctsp',
		website: 'https://www.ctsp.com.pk',
		logoSrc: '/portals/ctsp.png'
	},
	{
		label: 'DGPR Balochistan',
		shortLabel: 'DGPR',
		slug: 'dgpr-balochistan',
		website: 'https://dpr.gob.pk',
		logoSrc: '/portals/dgpr-balochistan.png'
	},
	{
		label: 'Educational Testing & Evaluation Agency (ETEA)',
		shortLabel: 'ETEA',
		slug: 'etea',
		website: 'https://www.etea.edu.pk',
		logoSrc: '/portals/etea.svg'
	},
	{
		label: 'Federal Public Service Commission (FPSC)',
		shortLabel: 'FPSC',
		slug: 'fpsc',
		website: 'https://www.fpsc.gov.pk',
		logoSrc: '/portals/fpsc.png'
	},
	{
		label: 'IWork4Sindh (IW4S)',
		shortLabel: 'IW4S',
		slug: 'iwork4sindh',
		website: 'https://www.iwork4sindh.com.pk',
		logoSrc: '/portals/iwork4sindh.png'
	},
	{
		label: 'National Jobs Portal (NJP)',
		shortLabel: 'NJP',
		slug: 'njp',
		website: 'https://www.njp.gov.pk',
		logoSrc: '/portals/njp.svg'
	},
	{
		label: 'National Testing Service (NTS)',
		shortLabel: 'NTS',
		slug: 'nts',
		website: 'https://www.nts.org.pk',
		logoSrc: '/portals/nts.png'
	},
	{
		label: 'Open Testing Service (OTS)',
		shortLabel: 'OTS',
		slug: 'ots',
		website: 'https://www.ots.org.pk',
		logoSrc: '/portals/ots.png'
	},
	{
		label: 'Pakistan Testing Service (PTS)',
		shortLabel: 'PTS',
		slug: 'pts',
		website: 'https://www.pts.org.pk',
		logoSrc: '/portals/pts.jpg'
	},
	{
		label: 'Punjab Jobs Portal',
		shortLabel: 'PJP',
		slug: 'punjab-jobs-portal',
		website: 'https://jobs.punjab.gov.pk',
		logoSrc: '/portals/punjab-jobs-portal.png'
	},
	{
		label: 'Punjab Public Service Commission (PPSC)',
		shortLabel: 'PPSC',
		slug: 'ppsc',
		website: 'https://ppsc.gop.pk',
		logoSrc: '/portals/ppsc.png'
	},
	{
		label: 'SIBA Testing Services (STS)',
		shortLabel: 'STS',
		slug: 'sts',
		website: 'https://www.sts.net.pk',
		logoSrc: '/portals/sts.png'
	}
];

export const HOME_PAGE_PORTALS = JOB_PORTALS.filter((portal) => portal.slug !== 'dgpr-balochistan');

export const JOB_PORTAL_BY_LABEL = new Map(JOB_PORTALS.map((portal) => [portal.label, portal]));

export function portalLogoFrameClass(slug: string): string {
	const base = 'flex size-4 shrink-0 items-center justify-center rounded-sm';
	if (slug === 'iwork4sindh') return `${base} bg-blue-600 p-0.5`;
	return base;
}

function hostnameFromApplyAddress(address: string | null | undefined): string | null {
	const online = address?.trim();
	if (!online || /^(javascript|data|vbscript):/i.test(online)) return null;

	try {
		const href = /^https?:\/\//i.test(online) ? online : `https://${online}`;
		return new URL(href).hostname.replace(/^www\./i, '').toLowerCase();
	} catch {
		return null;
	}
}

function portalHostname(portal: JobPortal): string {
	return new URL(portal.website).hostname.replace(/^www\./i, '').toLowerCase();
}

/** Match a testing-agency / job-portal logo from an online apply URL. */
export function resolveJobPortalFromApplyAddress(
	applicationOnlineAddress: string | null | undefined
): JobPortal | undefined {
	const hostname = hostnameFromApplyAddress(applicationOnlineAddress);
	if (!hostname) return undefined;

	let best: { portal: JobPortal; score: number } | undefined;

	for (const portal of JOB_PORTALS) {
		const portalHost = portalHostname(portal);
		if (hostname === portalHost || hostname.endsWith(`.${portalHost}`)) {
			const score = portalHost.length;
			if (!best || score > best.score) best = { portal, score };
		}
	}

	if (best) return best.portal;

	const raw = applicationOnlineAddress?.toLowerCase() ?? '';
	for (const portal of JOB_PORTALS) {
		const portalHost = portalHostname(portal);
		if (raw.includes(portalHost)) return portal;
	}

	return undefined;
}

/** Prefer apply URL; fall back to `url_web_title` when the link is on a known portal. */
export function resolveJobPortal(
	applicationOnlineAddress: string | null | undefined,
	urlWebTitle?: string | null
): JobPortal | undefined {
	const fromApply = resolveJobPortalFromApplyAddress(applicationOnlineAddress);
	if (fromApply) return fromApply;

	const title = urlWebTitle?.trim().toLowerCase();
	if (!title) return undefined;

	for (const portal of JOB_PORTALS) {
		if (
			title.includes(portal.shortLabel.toLowerCase()) ||
			title.includes(portal.label.toLowerCase())
		) {
			return portal;
		}
	}

	return undefined;
}
