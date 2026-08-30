/** Fixed canvases for Instagram feed and Story / WhatsApp status. */
export type SocialImageFormat = 'feed' | 'story';

export const SOCIAL_IMAGE_FORMATS = {
	feed: { width: 1080, height: 1350, jobsPerPage: 6, label: 'Instagram feed / WhatsApp' },
	story: { width: 1080, height: 1920, jobsPerPage: 8, label: 'Instagram Story / WhatsApp status' }
} as const satisfies Record<
	SocialImageFormat,
	{ width: number; height: number; jobsPerPage: number; label: string }
>;

export function parseSocialImageFormat(value: string | null | undefined): SocialImageFormat {
	return value === 'story' ? 'story' : 'feed';
}

export function parseSocialImagePage(value: string | null | undefined): number {
	const parsed = Number.parseInt(value ?? '1', 10);
	return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
}
