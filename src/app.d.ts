import type { DefaultSession } from '@auth/sveltekit';
import type { UserProfileRecord } from '$lib/server/user-profile';

declare module '@auth/sveltekit' {
	interface Session {
		user: {
			id: string;
			googleSub: string;
		} & DefaultSession['user'];
	}
}

declare global {
	namespace App {
		interface Locals {
			visitorId?: string;
			clientIp?: string;
		}
		interface PageData {
			session?: import('@auth/sveltekit').Session | null;
			profile?: UserProfileRecord | null;
			profileComplete?: boolean;
		}
	}
}

export {};
