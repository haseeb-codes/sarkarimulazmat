<script lang="ts">
	import JobInterestTree from '$lib/components/jobs/job-interest-tree.svelte';
	import JobInterestTreeSkeleton from '$lib/components/jobs/job-interest-tree-skeleton.svelte';

	type BrowseData = {
		jobInterestTree: {
			label: string;
			count: number;
			children: {
				label: string;
				count: number;
				degree_areas?: string[];
				q?: string;
			}[];
		}[];
	};

	let {
		browse
	}: {
		browse: Promise<BrowseData>;
	} = $props();
</script>

{#snippet pending()}
	<JobInterestTreeSkeleton />
{/snippet}

{#snippet failed(error: unknown)}
	<div
		class="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
		role="alert"
	>
		Could not load job interest links.
		<span class="sr-only">{String(error)}</span>
	</div>
{/snippet}

<svelte:boundary {pending} {failed}>
	{#await browse}
		<JobInterestTreeSkeleton />
	{:then data}
		<JobInterestTree tree={data.jobInterestTree} />
	{:catch error}
		{@render failed(error)}
	{/await}
</svelte:boundary>
