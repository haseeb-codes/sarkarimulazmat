import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { AUTH_SECRET } from '$env/static/private';
import { env } from '$env/dynamic/private';

export const ADMIN_COOKIE = 'admin_session';
/** Signed admin sessions last 12 hours. */
export const ADMIN_SESSION_MAX_AGE_S = 60 * 60 * 12;

function getAdminPassword(): string | null {
	const password = env.ADMIN_PASSWORD?.trim();
	return password ? password : null;
}

function sessionSigningKey(password: string): string {
	return `${AUTH_SECRET}:admin:${password}`;
}

function passwordsMatch(provided: string, expected: string): boolean {
	const a = createHash('sha256').update(provided).digest();
	const b = createHash('sha256').update(expected).digest();
	return timingSafeEqual(a, b);
}

function signPayload(payload: string, key: string): string {
	const sig = createHmac('sha256', key).update(payload).digest('base64url');
	return `${payload}.${sig}`;
}

function verifySignedToken(token: string, key: string): string | null {
	const lastDot = token.lastIndexOf('.');
	if (lastDot <= 0) return null;

	const payload = token.slice(0, lastDot);
	const sig = token.slice(lastDot + 1);
	if (!payload || !sig) return null;

	const expected = createHmac('sha256', key).update(payload).digest('base64url');
	const sigBuf = Buffer.from(sig);
	const expectedBuf = Buffer.from(expected);
	if (sigBuf.length !== expectedBuf.length) return null;
	if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

	return payload;
}

export function isAdminPasswordConfigured(): boolean {
	return getAdminPassword() !== null;
}

export function verifyAdminPassword(password: string): boolean {
	const expected = getAdminPassword();
	if (!expected) return false;
	return passwordsMatch(password, expected);
}

export function createAdminSessionToken(): string | null {
	const password = getAdminPassword();
	if (!password) return null;

	const exp = Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE_S;
	return signPayload(String(exp), sessionSigningKey(password));
}

export function isAdminSessionValid(token: string | undefined): boolean {
	if (!token) return false;
	const password = getAdminPassword();
	if (!password) return false;

	const payload = verifySignedToken(token, sessionSigningKey(password));
	if (!payload) return false;

	const exp = Number(payload);
	if (!Number.isFinite(exp)) return false;
	return exp > Math.floor(Date.now() / 1000);
}

export function readAdminAuthenticated(cookies: Cookies): boolean {
	return isAdminSessionValid(cookies.get(ADMIN_COOKIE));
}

export function setAdminSessionCookie(cookies: Cookies, secure: boolean): boolean {
	const token = createAdminSessionToken();
	if (!token) return false;

	cookies.set(ADMIN_COOKIE, token, {
		path: '/',
		httpOnly: true,
		secure,
		sameSite: 'lax',
		maxAge: ADMIN_SESSION_MAX_AGE_S
	});
	return true;
}

export function clearAdminSessionCookie(cookies: Cookies): void {
	cookies.delete(ADMIN_COOKIE, { path: '/' });
}

export function isAdminPath(pathname: string): boolean {
	return pathname === '/admin' || pathname.startsWith('/admin/');
}

export function isAdminLoginPath(pathname: string): boolean {
	return pathname === '/admin/login' || pathname.startsWith('/admin/login/');
}
