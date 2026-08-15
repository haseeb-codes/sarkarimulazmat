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

<Button
	type="button"
	variant="outline"
	{size}
	class={className}
	onclick={share}
	aria-label={copied ? 'Link copied' : `Share ${shareTitle}`}
>
	{#if copied}
		<CheckIcon data-icon="inline-start" />
		Copied
	{:else}
		<Share2Icon data-icon="inline-start" />
		Share
	{/if}
</Button>
