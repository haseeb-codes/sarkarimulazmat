<script lang="ts">
	import { onMount, tick } from 'svelte';

	type TurnstileApi = {
		ready: (cb: () => void) => void;
		render: (
			el: HTMLElement,
			options: {
				sitekey: string;
				theme?: 'auto' | 'light' | 'dark';
				size?: 'normal' | 'flexible' | 'compact';
				callback?: (token: string) => void;
				'error-callback'?: (errorCode: string) => void;
				'expired-callback'?: () => void;
				'timeout-callback'?: () => void;
			}
		) => string;
		reset: (widgetId?: string) => void;
		remove: (widgetId?: string) => void;
	};

	let {
		siteKey,
		resetSignal = 0,
		token = $bindable('')
	}: {
		siteKey: string;
		resetSignal?: number;
		token?: string;
	} = $props();

	let container: HTMLDivElement | undefined = $state();
	let widgetId: string | undefined = $state();
	let errorMessage = $state<string | null>(null);
	let handledResetSignal = 0;

	function getTurnstile(): TurnstileApi | undefined {
		return (window as Window & { turnstile?: TurnstileApi }).turnstile;
	}

	function loadTurnstileScript(): Promise<TurnstileApi> {
		const existing = getTurnstile();
		if (existing) return Promise.resolve(existing);

		return new Promise((resolve, reject) => {
			const prev = document.querySelector<HTMLScriptElement>('script[data-cf-turnstile]');
			const onLoad = () => {
				const api = getTurnstile();
				if (api) resolve(api);
				else reject(new Error('Turnstile script loaded but API is missing'));
			};

			if (prev) {
				if (getTurnstile()) onLoad();
				else {
					prev.addEventListener('load', onLoad, { once: true });
					prev.addEventListener(
						'error',
						() => reject(new Error('Failed to load Turnstile script')),
						{ once: true }
					);
				}
				return;
			}

			const script = document.createElement('script');
			script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
			script.async = true;
			script.defer = true;
			script.dataset.cfTurnstile = '';
			script.addEventListener('load', onLoad, { once: true });
			script.addEventListener(
				'error',
				() => reject(new Error('Failed to load Turnstile script')),
				{ once: true }
			);
			document.head.appendChild(script);
		});
	}

	function renderWidget(api: TurnstileApi) {
		if (!container || !siteKey) return;

		if (widgetId) {
			api.remove(widgetId);
			widgetId = undefined;
		}

		token = '';
		errorMessage = null;

		widgetId = api.render(container, {
			sitekey: siteKey,
			theme: 'auto',
			size: 'flexible',
			callback: (newToken) => {
				token = newToken;
				errorMessage = null;
			},
			// Tokens are valid for 5 minutes; without these the widget goes stale while the
			// visitor is still typing and the server rejects it as timeout-or-duplicate.
			'expired-callback': () => {
				token = '';
				if (widgetId) api.reset(widgetId);
			},
			'timeout-callback': () => {
				token = '';
				if (widgetId) api.reset(widgetId);
			},
			'error-callback': (code) => {
				token = '';
				const codeStr = String(code);
				errorMessage =
					codeStr === '110200'
						? 'This domain is not allowed for the Turnstile widget. Add localhost (and your production domain) in the Cloudflare Turnstile dashboard → Hostname Management.'
						: `Captcha failed to load (error ${codeStr}). Check your site key and widget domain settings.`;
			}
		});
	}

	$effect(() => {
		const signal = resetSignal;
		if (signal === handledResetSignal || !widgetId) return;

		handledResetSignal = signal;
		token = '';
		getTurnstile()?.reset(widgetId);
	});

	onMount(() => {
		let cancelled = false;

		if (!siteKey.trim()) {
			errorMessage = 'Captcha site key is missing.';
			return;
		}

		(async () => {
			try {
				await tick();
				const api = await loadTurnstileScript();
				if (cancelled) return;
				api.ready(() => {
					if (cancelled) return;
					renderWidget(api);
				});
			} catch (err) {
				console.error(err);
				if (!cancelled) {
					errorMessage =
						'Could not load captcha. Check your connection, or that challenges.cloudflare.com is not blocked.';
				}
			}
		})();

		return () => {
			cancelled = true;
			if (widgetId) getTurnstile()?.remove(widgetId);
		};
	});
</script>

<div class="space-y-2">
	<div bind:this={container} class="min-h-[65px] w-full"></div>
	{#if errorMessage}
		<p class="text-sm text-destructive" role="alert">{errorMessage}</p>
	{/if}
</div>
