<script lang="ts">
	import { signIn } from '@auth/sveltekit/client';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card/index.js';

	let { data } = $props();

	let signingIn = $state(false);

	function handleGoogleSignIn() {
		signingIn = true;
		signIn('google', { callbackUrl: '/onboarding' });
	}
</script>

<svelte:head>
	<title>Sign in — Sarkari Mulazmat</title>
	<meta
		name="description"
		content="Sign in with Google to save your profile and get job alerts matched to your background."
	/>
</svelte:head>

<article class="mx-auto max-w-md space-y-6">
	<Card>
		<CardHeader>
			<CardTitle>Sign in</CardTitle>
			<CardDescription>
				Use your Google account to create a profile and save job searches. Job browsing stays free
				without an account.
			</CardDescription>
		</CardHeader>
		<CardContent>
			<Button class="w-full" disabled={signingIn} onclick={handleGoogleSignIn}>
				{signingIn ? 'Redirecting…' : 'Continue with Google'}
			</Button>
		</CardContent>
	</Card>
</article>
