<script lang="ts">
	import MarsIcon from '@lucide/svelte/icons/mars';
	import VenusIcon from '@lucide/svelte/icons/venus';
	import TransgenderIcon from '@lucide/svelte/icons/transgender';
	import { parseGenderKinds, type GenderKind } from '$lib/jobs-utils';

	let {
		gender,
		class: className = ''
	}: {
		gender: string | null | undefined;
		class?: string;
	} = $props();

	const GENDER_META: Record<GenderKind, { label: string; iconClass: string }> = {
		male: { label: 'Male', iconClass: 'text-sky-600 dark:text-sky-400' },
		female: { label: 'Female', iconClass: 'text-rose-600 dark:text-rose-400' },
		transgender: {
			label: 'Transgender',
			iconClass: 'text-violet-600 dark:text-violet-400'
		}
	};

	const icons = $derived(parseGenderKinds(gender));

	const groupLabel = $derived(icons.map((k) => GENDER_META[k].label).join(', '));
</script>

{#if icons.length}
	<span
		class="inline-flex shrink-0 items-center gap-0.5 {className}"
		aria-label="Open to {groupLabel}"
	>
		{#each icons as kind (kind)}
			{@const meta = GENDER_META[kind]}
			<span class="group relative inline-flex" title={meta.label}>
				<span
					class="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 -translate-x-1/2 rounded-md bg-foreground px-2 py-0.5 text-xs font-medium whitespace-nowrap text-background opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
					role="tooltip"
				>
					{meta.label}
				</span>
				{#if kind === 'male'}
					<MarsIcon class="size-4 {meta.iconClass}" aria-hidden="true" />
				{:else if kind === 'female'}
					<VenusIcon class="size-4 {meta.iconClass}" aria-hidden="true" />
				{:else}
					<TransgenderIcon class="size-4 {meta.iconClass}" aria-hidden="true" />
				{/if}
			</span>
		{/each}
	</span>
{/if}
