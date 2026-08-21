/** Boolean-ish domicile flags on JobPostings (stored as 0/1 integers). */
export const DOMICILE_REGIONS = [
	{ key: 'any', column: 'domicile_any', label: 'Any' },
	{ key: 'punjab', column: 'domicile_punjab', label: 'Punjab' },
	{ key: 'sindh', column: 'domicile_sindh', label: 'Sindh' },
	{ key: 'sindh_urban', column: 'domicile_sindh_urban', label: 'Sindh Urban' },
	{ key: 'sindh_rural', column: 'domicile_sindh_rural', label: 'Sindh Rural' },
	{ key: 'kpk', column: 'domicile_kpk', label: 'KPK' },
	{ key: 'balochistan', column: 'domicile_balochistan', label: 'Balochistan' },
	{ key: 'ict', column: 'domicile_ict', label: 'ICT' },
	{ key: 'ajk', column: 'domicile_ajk', label: 'AJK' },
	{ key: 'gb', column: 'domicile_gb', label: 'GB' },
	{ key: 'fata', column: 'domicile_fata', label: 'FATA' }
] as const;

export type DomicileRegionKey = (typeof DOMICILE_REGIONS)[number]['key'];
export type DomicileRegionColumn = (typeof DOMICILE_REGIONS)[number]['column'];
export type DomicileRegionDef = (typeof DOMICILE_REGIONS)[number];

const regionByKey = new Map<string, DomicileRegionDef>(
	DOMICILE_REGIONS.map((region) => [region.key, region])
);

export function getDomicileRegion(key: string): DomicileRegionDef | undefined {
	return regionByKey.get(key.trim().toLowerCase());
}

export function getDomicileRegionLabel(key: string): string {
	return getDomicileRegion(key)?.label ?? key;
}

/** Normalize domicile region keys from URL / filter state. */
export function selectedDomicileRegions(filters: {
	domicile_region?: string | string[] | null;
}): DomicileRegionKey[] {
	const raw = filters.domicile_region;
	const parts = Array.isArray(raw) ? raw : raw ? [raw] : [];
	const seen = new Set<DomicileRegionKey>();
	const result: DomicileRegionKey[] = [];
	for (const part of parts) {
		const region = getDomicileRegion(part);
		if (!region || seen.has(region.key)) continue;
		seen.add(region.key);
		result.push(region.key);
	}
	return result;
}
