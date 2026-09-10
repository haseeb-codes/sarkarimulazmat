<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card/index.js';
	import LockIcon from '@lucide/svelte/icons/lock';

	let { data, form } = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Admin sign in</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="flex min-h-svh items-center justify-center bg-muted/30 px-4">
	<article class="w-full max-w-md">
		<Card>
			<CardHeader class="space-y-3">
				<div
					class="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
					aria-hidden="true"
				>
					<LockIcon class="size-5" />
				</div>
				<div class="space-y-1">
					<CardTitle>Admin access</CardTitle>
					<CardDescription>
						Enter the admin password to view collected user, visitor, and search analytics.
					</CardDescription>
				</div>
			</CardHeader>
			<CardContent>
				{#if !data.configured}
					<p class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
						Set <code class="font-mono text-xs">ADMIN_PASSWORD</code> in the environment before
						signing in.
					</p>
				{:else}
					<form
						method="POST"
						class="space-y-4"
						use:enhance={() => {
							submitting = true;
							return async ({ update }) => {
								await update();
								submitting = false;
							};
						}}
					>
						<input type="hidden" name="redirectTo" value={data.redirectTo} />

						<div class="space-y-2">
							<Label for="admin-password">Password</Label>
							<Input
								id="admin-password"
								name="password"
								type="password"
								autocomplete="current-password"
								required
								disabled={submitting}
								aria-invalid={form?.error ? 'true' : undefined}
							/>
						</div>

						{#if form?.error}
							<p class="text-sm text-destructive" role="alert">{form.error}</p>
						{/if}

						<Button type="submit" class="w-full" disabled={submitting}>
							{submitting ? 'Signing in…' : 'Sign in'}
						</Button>
					</form>
				{/if}
			</CardContent>
		</Card>
	</article>
</div>
