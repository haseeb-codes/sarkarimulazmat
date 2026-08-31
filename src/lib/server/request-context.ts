import { UAParser } from 'ua-parser-js';

const MAX_UA_LENGTH = 512;

export type ClientDeviceInfo = {
	userAgent?: string;
	browser?: string;
	browserVersion?: string;
	os?: string;
	deviceType?: string;
};

export function parseClientDevice(userAgent: string | null | undefined): ClientDeviceInfo {
	if (!userAgent) return {};

	const parsed = new UAParser(userAgent).getResult();

	return {
		userAgent: userAgent.slice(0, MAX_UA_LENGTH),
		browser: parsed.browser.name ?? undefined,
		browserVersion: parsed.browser.version ?? undefined,
		os: parsed.os.name ?? undefined,
		deviceType: parsed.device.type ?? 'desktop'
	};
}

export type JobQueryTracking = ClientDeviceInfo & {
	visitorId?: string;
	userId?: string;
	ipAddress?: string;
	path: string;
	/** When set, overrides default filtersAreActive() check for logging. */
	log?: boolean;
};

export function jobQueryTrackingFromLocals(
	locals: App.Locals,
	path: string
): JobQueryTracking {
	return {
		visitorId: locals.visitorId,
		userId: locals.userId,
		ipAddress: locals.clientIp,
		path,
		userAgent: locals.userAgent,
		browser: locals.browser,
		browserVersion: locals.browserVersion,
		os: locals.os,
		deviceType: locals.deviceType
	};
}
