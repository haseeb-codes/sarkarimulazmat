import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import db from '$lib/server/db';
import { isCaptchaEnabled, verifyTurnstileToken } from '$lib/server/turnstile';
import { env } from '$env/dynamic/public';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME = 120;
const MAX_EMAIL = 254;
const MAX_CONTACT = 40;
const MAX_MESSAGE = 5000;

function formValues(fields: {
	name: string;
	email: string;
	contact: string;
	message: string;
}) {
	return fields;
}

export const load: PageServerLoad = async () => {
	const captchaEnabled = isCaptchaEnabled();
	return {
		captchaEnabled,
		turnstileSiteKey: captchaEnabled ? (env.PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? '') : ''
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const email = String(data.get('email') ?? '').trim();
		const contact = String(data.get('contact') ?? '').trim();
		const message = String(data.get('message') ?? '').trim();
		const turnstileToken = String(data.get('cf-turnstile-response') ?? '').trim();
		const values = formValues({ name, email, contact, message });

		if (!name || !contact || !message) {
			return fail(400, {
				...values,
				error: 'Please fill in your name, contact number, and message.'
			});
		}

		if (
			name.length > MAX_NAME ||
			email.length > MAX_EMAIL ||
			contact.length > MAX_CONTACT ||
			message.length > MAX_MESSAGE
		) {
			return fail(400, {
				...values,
				error: 'One or more fields are too long. Please shorten your message and try again.'
			});
		}

		if (email && !EMAIL_RE.test(email)) {
			return fail(400, {
				...values,
				error: 'Please enter a valid email address, or leave it blank.'
			});
		}

		// Verified last so a rejected field never consumes the single-use token.
		if (isCaptchaEnabled()) {
			const captcha = await verifyTurnstileToken(turnstileToken, locals.clientIp);
			if (!captcha.ok) {
				return fail(400, { ...values, error: captcha.reason, captchaExpired: true });
			}
		}

		try {
			await db.email.create({
				data: {
					name,
					email: email || null,
					contact,
					message
				}
			});
		} catch (err) {
			console.error('Failed to save contact message', err);
			return fail(500, {
				...values,
				error: 'We could not send your message right now. Please try again shortly.',
				captchaExpired: true
			});
		}

		return { success: true };
	}
};
