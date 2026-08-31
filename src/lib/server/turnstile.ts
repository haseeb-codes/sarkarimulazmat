import { env } from '$env/dynamic/private';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const MAX_TOKEN_LENGTH = 2048;

type SiteverifyResponse = {
	success: boolean;
	'error-codes'?: string[];
};

/**
 * Captcha stays off unless `CAPTCHA_ENABLED="true"` is set, so the contact form keeps
 * working in environments where Turnstile is not set up yet.
 */
export function isCaptchaEnabled(): boolean {
	return env.CAPTCHA_ENABLED?.trim().toLowerCase() === 'true';
}

/**
 * Cloudflare rejects the verification when `remoteip` does not match the address that
 * solved the challenge, so loopback/private addresses (local dev, unproxied requests)
 * and spoofed `x-forwarded-for` values must never be forwarded.
 */
function isPublicIp(ip: string): boolean {
	if (ip.includes(':')) {
		const v6 = ip.toLowerCase();
		if (!/^[0-9a-f:]+$/.test(v6) || v6 === '::' || v6 === '::1') return false;
		return !/^(fc|fd|fe8|fe9|fea|feb)/.test(v6);
	}

	const octets = ip.split('.');
	if (octets.length !== 4 || !octets.every((o) => /^\d{1,3}$/.test(o))) return false;

	const [a, b] = octets.map(Number);
	if (octets.some((o) => Number(o) > 255)) return false;
	if (a === 0 || a === 10 || a === 127) return false;
	if (a === 169 && b === 254) return false;
	if (a === 172 && b >= 16 && b <= 31) return false;
	if (a === 192 && b === 168) return false;
	return true;
}

function messageForErrorCodes(codes: string[] | undefined): string {
	if (codes?.includes('invalid-input-secret') || codes?.includes('missing-input-secret')) {
		console.error('TURNSTILE_SECRET_KEY is invalid for this site key');
		return 'Captcha is misconfigured on the server.';
	}

	if (codes?.includes('timeout-or-duplicate')) {
		return 'Your captcha expired. Please complete it again and resend.';
	}

	return 'Captcha verification failed. Please try again.';
}

export async function verifyTurnstileToken(
	token: string,
	remoteip?: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
	const secret = env.TURNSTILE_SECRET_KEY?.trim();
	if (!secret) {
		console.error('TURNSTILE_SECRET_KEY is not configured');
		return { ok: false, reason: 'Captcha is not configured on the server.' };
	}

	if (!token || token.length > MAX_TOKEN_LENGTH) {
		return { ok: false, reason: 'Please complete the captcha and try again.' };
	}

	const body = new URLSearchParams();
	body.set('secret', secret);
	body.set('response', token);
	if (remoteip && isPublicIp(remoteip)) body.set('remoteip', remoteip);

	try {
		const res = await fetch(SITEVERIFY_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body
		});

		if (!res.ok) {
			console.error('Turnstile siteverify returned', res.status);
			return { ok: false, reason: 'Could not verify captcha right now. Please try again.' };
		}

		const result = (await res.json()) as SiteverifyResponse;
		if (!result.success) {
			console.warn('Turnstile verification failed', result['error-codes']);
			return { ok: false, reason: messageForErrorCodes(result['error-codes']) };
		}

		return { ok: true };
	} catch (err) {
		console.error('Turnstile siteverify request failed', err);
		return { ok: false, reason: 'Could not verify captcha right now. Please try again.' };
	}
}
