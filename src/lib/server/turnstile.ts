import { env } from '$env/dynamic/private';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

type SiteverifyResponse = {
	success: boolean;
	'error-codes'?: string[];
};

export async function verifyTurnstileToken(
	token: string,
	remoteip?: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
	const secret = env.TURNSTILE_SECRET_KEY?.trim();
	if (!secret) {
		console.error('TURNSTILE_SECRET_KEY is not configured');
		return { ok: false, reason: 'Captcha is not configured on the server.' };
	}

	if (!token || token.length > 2048) {
		return { ok: false, reason: 'Please complete the captcha and try again.' };
	}

	const body = new URLSearchParams();
	body.set('secret', secret);
	body.set('response', token);
	if (remoteip) body.set('remoteip', remoteip);

	try {
		const res = await fetch(SITEVERIFY_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body
		});

		const result = (await res.json()) as SiteverifyResponse;
		if (!result.success) {
			console.warn('Turnstile verification failed', result['error-codes']);
			return { ok: false, reason: 'Captcha verification failed. Please try again.' };
		}

		return { ok: true };
	} catch (err) {
		console.error('Turnstile siteverify request failed', err);
		return { ok: false, reason: 'Could not verify captcha right now. Please try again.' };
	}
}
