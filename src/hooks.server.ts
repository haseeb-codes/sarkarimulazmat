import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import db from '$lib/server/db';

const VISITOR_COOKIE = 'visitor_id';
const ONE_YEAR_S = 60 * 60 * 24 * 365;

const visitorHandle: Handle = async ({ event, resolve }) => {
	let visitorId = event.cookies.get(VISITOR_COOKIE);

	if (!visitorId) {
		visitorId = crypto.randomUUID();
		event.cookies.set(VISITOR_COOKIE, visitorId, {
			path: '/',
			httpOnly: true,
			secure: event.url.protocol === 'https:',
			sameSite: 'lax',
			maxAge: ONE_YEAR_S
		});

		// Fire-and-forget create — never block the response
		db.visitor
			.create({
				data: { id: visitorId }
			})
			.catch(() => {
				/* table may not exist yet before migrate */
			});
	} else {
		event.locals.visitorId = visitorId;
		db.visitor
			.update({
				where: { id: visitorId },
				data: {
					last_seen: new Date(),
					visit_count: { increment: 1 }
				}
			})
			.catch(() => {
				/* ignore — visitor row may be missing */
			});
	}

	event.locals.visitorId = visitorId;
	return resolve(event);
};

export const handle = sequence(visitorHandle);
