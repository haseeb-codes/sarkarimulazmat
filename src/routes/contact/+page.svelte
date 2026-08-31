<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import TurnstileWidget from '$lib/components/turnstile-widget.svelte';

	let { data, form } = $props();

	let submitting = $state(false);
	let turnstileReset = $state(0);
	let turnstileToken = $state('');

	const captchaSolved = $derived(
		!data.captchaEnabled || (Boolean(data.turnstileSiteKey) && Boolean(turnstileToken))
	);
</script>

<svelte:head>
	<title>Contact — Sarkari Mulazmat</title>
	<meta
		name="description"
		content="Get in touch with Sarkari Mulazmat. Send a message about government jobs, feedback, or questions."
	/>
	{#if data.captchaEnabled}
		<link rel="preconnect" href="https://challenges.cloudflare.com" />
	{/if}
</svelte:head>

<article class="mx-auto max-w-2xl space-y-6">
	<div class="space-y-2">
		<h1>Contact</h1>
		<p class="text-sm leading-relaxed text-muted-foreground">
			Have a question, suggestion, or issue with a listing? Send us a message and we’ll get back to
			you when we can.
		</p>
	</div>

	{#if form?.success}
		<div
			class="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary"
			role="status"
		>
			Thanks — your message was sent. We’ll review it soon.
		</div>
	{:else}
		<form
			method="POST"
			class="space-y-4"
			use:enhance={() => {
				submitting = true;
				return async ({ result, update }) => {
					await update();
					submitting = false;

					// Only re-challenge when the token was actually spent; a rejected field
					// leaves it valid, so making the visitor solve it again is wasted effort.
					const spent =
						result.type === 'failure'
							? (result.data as { captchaExpired?: boolean } | undefined)?.captchaExpired === true
							: result.type === 'error';
					if (spent) turnstileReset += 1;
				};
			}}
		>
			{#if form?.error}
				<p class="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
					{form.error}
				</p>
			{/if}

			<div class="space-y-2">
				<Label for="contact-name" required>Name</Label>
				<Input
					id="contact-name"
					name="name"
					type="text"
					autocomplete="name"
					required
					maxlength={120}
					value={form?.name ?? ''}
					placeholder="Your name"
					disabled={submitting}
				/>
			</div>

			<div class="space-y-2">
				<Label for="contact-phone" required>Contact</Label>
				<Input
					id="contact-phone"
					name="contact"
					type="tel"
					autocomplete="tel"
					required
					maxlength={40}
					value={form?.contact ?? ''}
					placeholder="Phone number"
					disabled={submitting}
				/>
			</div>

			<div class="space-y-2">
				<Label for="contact-email"
					>Email <span class="font-normal text-muted-foreground">(optional)</span></Label
				>
				<Input
					id="contact-email"
					name="email"
					type="email"
					autocomplete="email"
					maxlength={254}
					value={form?.email ?? ''}
					placeholder="you@example.com"
					disabled={submitting}
				/>
			</div>

			<div class="space-y-2">
				<Label for="contact-message" required>Message</Label>
				<textarea
					id="contact-message"
					name="message"
					required
					rows={6}
					maxlength={5000}
					placeholder="How can we help?"
					disabled={submitting}
					class="w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30"
					>{form?.message ?? ''}</textarea
				>
			</div>

			{#if data.captchaEnabled}
				<div class="space-y-2">
					{#if data.turnstileSiteKey}
						<TurnstileWidget
							siteKey={data.turnstileSiteKey}
							resetSignal={turnstileReset}
							bind:token={turnstileToken}
						/>
					{:else}
						<p class="text-sm text-destructive" role="alert">
							Captcha is not configured. Add PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY to
							your environment.
						</p>
					{/if}
				</div>
			{/if}

			<div class="space-y-2">
				<Button type="submit" disabled={submitting || !captchaSolved}>
					{submitting ? 'Sending…' : 'Send message'}
				</Button>
				{#if data.captchaEnabled && data.turnstileSiteKey && !captchaSolved && !submitting}
					<p class="text-sm text-muted-foreground">
						Complete the captcha above to enable sending.
					</p>
				{/if}
			</div>
		</form>
	{/if}
</article>
