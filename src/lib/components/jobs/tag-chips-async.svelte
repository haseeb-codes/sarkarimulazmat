<script lang="ts">
	import TagChips from '$lib/components/jobs/tag-chips.svelte';

	let {
		browse
	}: {
		browse: Promise<{ topTags: { slug: string; label: string; count: number }[] }>;
	} = $props();
</script>

{#await browse then data}
	<TagChips tags={data.topTags} />
{/await}
