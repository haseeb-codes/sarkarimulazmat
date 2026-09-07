<script lang="ts">
	import { Button, type ButtonSize } from '$lib/components/ui/button/index.js';
	import Share2Icon from '@lucide/svelte/icons/share-2';
	import CheckIcon from '@lucide/svelte/icons/check';

	let {
		url,
		title,
		text = null,
		size = 'sm',
		class: className = ''
	}: {
		url: string;
		title: string | null;
		text?: string | null;
		size?: ButtonSize;
		class?: string;
	} = $props();

	let copied = $state(false);
	let copiedTimer: ReturnType<typeof setTimeout> | null = null;

	const shareTitle = $derived(title?.trim() || 'Government job — Sarkari Mulazmat');
	const shareText = $derived(
		text?.trim() || `${shareTitle} on Sarkari Mulazmat`
	);

	async function share(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();

		const payload = { title: shareTitle, text: shareText, url };

		try {
			if (navigator.share) {
				await navigator.share(payload);
				return;
			}
		} catch (err) {
			if (err instanceof Error && err.name === 'AbortError') return;
		}

		try {
			await navigator.clipboard.writeText(url);
			copied = true;
			if (copiedTimer) clearTimeout(copiedTimer);
			copiedTimer = setTimeout(() => {
				copied = false;
				copiedTimer = null;
			}, 2000);
		} catch {
			/* clipboard unavailable */
		}
	}
</script>

<span class="group relative inline-flex" title={copied ? 'Link copied' : 'Share'}>
	<span
		class="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 -translate-x-1/2 rounded-md bg-foreground px-2 py-0.5 text-xs font-medium whitespace-nowrap text-background opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
		role="tooltip"
	>
		{copied ? 'Link copied' : 'Share'}
	</span>
	<Button
		type="button"
		variant="outline"
		{size}
		class="border-primary/35 bg-primary/10 text-primary hover:bg-primary/18 hover:text-primary {copied
			? 'border-status-open/40 bg-status-open-bg text-status-open hover:bg-status-open-bg hover:text-status-open'
			: ''} {className}"
		onclick={share}
		aria-label={copied ? 'Link copied' : `Share ${shareTitle}`}
	>
		{#if copied}
			<CheckIcon />
			<span class="hidden sm:inline">Copied</span>
		{:else}
			<Share2Icon />
			<span class="hidden sm:inline">Share</span>
		{/if}
	</Button>
</span>
