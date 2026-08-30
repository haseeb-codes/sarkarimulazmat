<script lang="ts">
	import { browser } from '$app/environment';
	import TagChips from '$lib/components/jobs/tag-chips.svelte';
	import TagChipsSkeleton from '$lib/components/jobs/tag-chips-skeleton.svelte';

	type TagCount = { slug: string; label: string; count: number };

	let tags = $state<TagCount[] | null>(null);

	$effect(() => {
		if (!browser) return;

		let cancelled = false;

		void fetch('/api/tags/top')
			.then((res) => {
				if (!res.ok) throw new Error('Failed to load tag counts');
				return res.json() as Promise<{ tags: TagCount[] }>;
			})
			.then((data) => {
				if (!cancelled) tags = data.tags;
			})
			.catch((err) => {
				console.error('Failed to load tag counts', err);
				if (!cancelled) tags = [];
			});

		return () => {
			cancelled = true;
		};
	});
</script>

{#if tags === null}
	<TagChipsSkeleton />
{:else}
	<TagChips tags={tags} />
{/if}
