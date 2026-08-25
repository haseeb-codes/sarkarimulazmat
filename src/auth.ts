import { customFetch } from '@auth/core';
import { SvelteKitAuth } from '@auth/sveltekit';
import Google from '@auth/sveltekit/providers/google';
import { AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, AUTH_SECRET } from '$env/static/private';
import { authFetch } from '$lib/server/auth-fetch';
import { ensureUserProfile } from '$lib/server/user-profile';

export const { handle, signIn, signOut } = SvelteKitAuth({
	providers: [
		Google({
			clientId: AUTH_GOOGLE_ID,
			clientSecret: AUTH_GOOGLE_SECRET,
			authorization: {
				url: 'https://accounts.google.com/o/oauth2/v2/auth',
				params: {
					prompt: 'consent',
					access_type: 'online',
					response_type: 'code'
				}
			},
			token: {
				url: 'https://oauth2.googleapis.com/token'
			},
			userinfo: {
				url: 'https://openidconnect.googleapis.com/v1/userinfo'
			},
			[customFetch]: authFetch
		})
	],
	secret: AUTH_SECRET,
	trustHost: true,
	callbacks: {
		async jwt({ token, account, profile }) {
			if (account?.provider === 'google' && profile?.sub && profile.email) {
				const userProfile = await ensureUserProfile({
					googleSub: profile.sub,
					email: profile.email,
					name: profile.name ?? null,
					image: typeof profile.picture === 'string' ? profile.picture : null
				});
				token.sub = userProfile.id;
				token.googleSub = profile.sub;
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user && token.sub) {
				session.user.id = token.sub as string;
				session.user.googleSub = token.googleSub as string;
			}
			return session;
		},
		async signIn({ account, profile }) {
			return account?.provider === 'google' && Boolean(profile?.sub && profile?.email);
		}
	}
});
