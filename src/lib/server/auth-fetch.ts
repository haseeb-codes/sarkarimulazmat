import { Agent, fetch as undiciFetch } from 'undici';

const isDev = process.env.NODE_ENV !== 'production';

let insecureAgent: Agent | undefined;

/**
 * Auth.js fetch wrapper. In local dev, some Windows setups fail TLS verification
 * (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`) when calling Google OAuth endpoints.
 */
export function authFetch(input: Parameters<typeof fetch>[0], init?: RequestInit): Promise<Response> {
	if (!isDev) {
		return fetch(input, init);
	}

	insecureAgent ??= new Agent({ connect: { rejectUnauthorized: false } });

	return undiciFetch(input as string, {
		...(init ?? {}),
		dispatcher: insecureAgent
	}) as unknown as Promise<Response>;
}
