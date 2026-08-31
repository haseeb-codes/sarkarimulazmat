import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { handle as authHandle } from './auth';
import db from '$lib/server/db';
import { parseClientDevice } from '$lib/server/request-context';
import { linkVisitorToUser } from '$lib/server/user-profile';

const VISITOR_COOKIE = 'visitor_id';
const ONE_YEAR_S = 60 * 60 * 24 * 365;

function getClientIp(event: Parameters<Handle>[0]['event']): string | undefined {
	const fromHeaders =
		event.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
		event.request.headers.get('x-real-ip');
	if (fromHeaders) return fromHeaders;

	try {
		return event.getClientAddress();
	} catch {
		return undefined;
	}
}

const visitorHandle: Handle = async ({ event, resolve }) => {
	const ip = getClientIp(event);
	event.locals.clientIp = ip;

	const device = parseClientDevice(event.request.headers.get('user-agent'));
	event.locals.userAgent = device.userAgent;
	event.locals.browser = device.browser;
	event.locals.browserVersion = device.browserVersion;
	event.locals.os = device.os;
	event.locals.deviceType = device.deviceType;

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

		db.visitor
			.create({
				data: { id: visitorId, ip_address: ip }
			})
			.catch(() => {});
	} else {
		db.visitor
			.update({
				where: { id: visitorId },
				data: {
					last_seen: new Date(),
					visit_count: { increment: 1 },
					ip_address: ip
				}
			})
			.catch(() => {});
	}

	event.locals.visitorId = visitorId;

	db.pageView
		.create({
			data: {
				visitor_id: visitorId,
				ip_address: ip,
				path: event.url.pathname,
				query: event.url.search || null,
				referrer: event.request.headers.get('referer') || null
			}
		})
		.catch(() => {});

	return resolve(event);
};

const linkVisitorHandle: Handle = async ({ event, resolve }) => {
	const session = await event.locals.auth();
	if (session?.user?.id) {
		event.locals.userId = session.user.id;
	}
	if (session?.user?.id && event.locals.visitorId) {
		linkVisitorToUser(event.locals.visitorId, session.user.id).catch(() => {});
	}
	return resolve(event);
};

export const handle = sequence(authHandle, visitorHandle, linkVisitorHandle);
