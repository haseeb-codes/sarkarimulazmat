<script lang="ts">
	import { browser } from '$app/environment';
	import { setMode } from 'mode-watcher';

	let { children } = $props();

	/** Force light mode for shareable snapshot pages; restore user preference on leave. */
	$effect(() => {
		if (!browser) return;

		const html = document.documentElement;
		const savedMode =
			(localStorage.getItem('mode-watcher-mode') as 'light' | 'dark' | 'system' | null) ??
			'light';

		function forceLight() {
			html.classList.remove('dark');
			html.style.colorScheme = 'light';
		}

		forceLight();

		const observer = new MutationObserver(() => {
			if (html.classList.contains('dark')) forceLight();
		});
		observer.observe(html, { attributes: true, attributeFilter: ['class'] });

		return () => {
			observer.disconnect();
			setMode(savedMode);
		};
	});
</script>

<div class="min-h-svh bg-background text-foreground">
	{@render children()}
</div>
