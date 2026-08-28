import type { Ads } from '$lib/server/generated/prisma/client';

/** Public ad shape for browse lists and SvelteKit hydration. */
export type ListAd = {
	ad_slug: string;
	ad_code: string | null;
	ad_headline: string | null;
	vacancies: number | null;
	posted_by: string | null;
	last_date_to_apply: string | null;
	file_creation_date: string | null;
};

/** Ad detail page — includes scan URL and summary fields. */
export type AdDetail = ListAd & {
	ad_content: string | null;
	ad_full_text_summary: string | null;
	supabase_file_path: string | null;
};

type ListAdSource = Pick<
	Ads,
	| 'ad_slug'
	| 'ad_code'
	| 'ad_headline'
	| 'vacancies'
	| 'posted_by'
	| 'last_date_to_apply'
	| 'file_creation_date'
>;

function toDateKey(value: Date | null | undefined): string | null {
	return value ? value.toISOString().slice(0, 10) : null;
}

export function toListAd(ad: ListAdSource): ListAd {
	return {
		ad_slug: ad.ad_slug,
		ad_code: ad.ad_code,
		ad_headline: ad.ad_headline,
		vacancies: ad.vacancies,
		posted_by: ad.posted_by,
		last_date_to_apply: toDateKey(ad.last_date_to_apply),
		file_creation_date: toDateKey(ad.file_creation_date)
	};
}

export function toListAds(ads: ListAdSource[]): ListAd[] {
	return ads.map(toListAd);
}

export function toAdDetail(
	ad: Pick<
		Ads,
		| 'ad_slug'
		| 'ad_code'
		| 'ad_headline'
		| 'vacancies'
		| 'posted_by'
		| 'last_date_to_apply'
		| 'file_creation_date'
		| 'ad_content'
		| 'ad_full_text_summary'
		| 'supabase_file_path'
	>
): AdDetail {
	return {
		...toListAd(ad),
		ad_content: ad.ad_content,
		ad_full_text_summary: ad.ad_full_text_summary,
		supabase_file_path: ad.supabase_file_path
	};
}
