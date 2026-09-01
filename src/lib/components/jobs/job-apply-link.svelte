<script lang="ts">
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import MailIcon from '@lucide/svelte/icons/mail';
	import { resolveJobPortal } from '$lib/job-portals';
	import { getJobApplyLink } from '$lib/jobs-utils';

	let {
		applicationOnlineAddress,
		email,
		urlWebTitle = null,
		compact = false
	}: {
		applicationOnlineAddress?: string | null;
		email?: string | null;
		urlWebTitle?: string | null;
		compact?: boolean;
	} = $props();

	const applyLink = $derived(getJobApplyLink(applicationOnlineAddress, email));
	const portal = $derived(
		applyLink?.kind === 'url'
			? resolveJobPortal(applicationOnlineAddress, urlWebTitle)
			: undefined
	);

	let logoFailed = $state(false);

	function logoFrameClass(slug: string): string {
		const size = compact ? 'size-6' : 'size-8';
		const base = `flex ${size} shrink-0 items-center justify-center rounded-md`;
		if (slug === 'iwork4sindh') return `${base} bg-blue-600 p-1`;
		return base;
	}
</script>

{#if applyLink}
	<a
		href={applyLink.href}
		target={applyLink.kind === 'url' ? '_blank' : undefined}
		rel={applyLink.kind === 'url' ? 'noopener noreferrer' : undefined}
		class="inline-flex min-w-0 max-w-full items-center gap-1.5 font-medium text-primary underline-offset-2 hover:underline {compact
			? 'text-[10px]'
			: 'text-sm'}"
	>
		{#if portal && !logoFailed}
			<span class={logoFrameClass(portal.slug)}>
				<img
					src={portal.logoSrc}
					alt=""
					width="32"
					height="32"
					class="size-full object-contain"
					loading="lazy"
					decoding="async"
					onerror={() => {
						logoFailed = true;
					}}
				/>
			</span>
		{:else if applyLink.kind === 'email'}
			<MailIcon class="{compact ? 'size-4' : 'size-5'} shrink-0" />
		{:else}
			<ExternalLinkIcon class="{compact ? 'size-4' : 'size-5'} shrink-0" />
		{/if}
		<span class="min-w-0 break-all leading-snug">{applyLink.label}</span>
	</a>
{/if}
