<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';

	let { error, status }: { error: App.Error; status: number } = $props();

	const message = $derived(
		error?.message ||
			(status === 404 ? 'We could not find that page.' : 'Something went wrong.')
	);
</script>

<svelte:head>
	<title>{status === 404 ? 'Not found' : 'Error'} — Sarkari Nokri</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto flex max-w-lg flex-col items-start gap-4 py-16">
	<p class="text-sm font-medium text-muted-foreground">{status}</p>
	<h1>{status === 404 ? 'Page not found' : 'Something went wrong'}</h1>
	<p class="text-muted-foreground">{message}</p>
	<div class="flex gap-2">
		<Button href="/">Back to jobs</Button>
		{#if status >= 500}
			<Button variant="outline" href={page.url.pathname + page.url.search}>Try again</Button>
		{/if}
	</div>
</div>
