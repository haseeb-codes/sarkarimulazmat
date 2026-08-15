<script lang="ts">
	import BrowseByCategory from '$lib/components/jobs/browse-by-category.svelte';
	import BrowseByCategorySkeleton from '$lib/components/jobs/browse-by-category-skeleton.svelte';

	type BrowseByCategoryData = {
		adDates: { value: string; label: string; count: number }[];
		postedBy: { label: string; count: number }[];
		donors: { label: string; count: number }[];
		genders: { value: string; label: string; count: number }[];
		degreeAreas: { label: string; count: number }[];
		educationLevels: { label: string; count: number }[];
	};

	let {
		browse
	}: {
		browse: Promise<BrowseByCategoryData>;
	} = $props();
</script>

{#snippet pending()}
	<BrowseByCategorySkeleton />
{/snippet}

{#snippet failed(error: unknown)}
	<div
		class="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
		role="alert"
	>
		Could not load filters.
		<span class="sr-only">{String(error)}</span>
	</div>
{/snippet}

<svelte:boundary {pending} {failed}>
	<div class="lg:h-full">
		{#await browse}
			<BrowseByCategorySkeleton />
		{:then data}
			<BrowseByCategory
				adDates={data.adDates}
				postedBy={data.postedBy}
				donors={data.donors}
				genders={data.genders}
				degreeAreas={data.degreeAreas}
			/>
		{:catch error}
			{@render failed(error)}
		{/await}
	</div>
</svelte:boundary>
