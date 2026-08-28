<script lang="ts">
	let {
		min,
		max,
		step = 1,
		value = $bindable<[number, number]>(),
		formatValue = (n: number) => String(n),
		loAriaLabel = 'Minimum',
		hiAriaLabel = 'Maximum',
		onValueCommit
	}: {
		min: number;
		max: number;
		step?: number;
		value?: [number, number];
		formatValue?: (value: number) => string;
		loAriaLabel?: string;
		hiAriaLabel?: string;
		onValueCommit?: (value: [number, number]) => void;
	} = $props();

	const span = $derived(Math.max(1, max - min));
	const loPercent = $derived(((value[0] - min) / span) * 100);
	const hiPercent = $derived(((value[1] - min) / span) * 100);

	function clampPair(nextLo: number, nextHi: number): [number, number] {
		const lo = Math.min(max, Math.max(min, nextLo));
		const hi = Math.min(max, Math.max(min, nextHi));
		return lo <= hi ? [lo, hi] : [hi, lo];
	}

	function onLoInput(event: Event) {
		const nextLo = Number((event.currentTarget as HTMLInputElement).value);
		value = clampPair(nextLo, value[1]);
	}

	function onHiInput(event: Event) {
		const nextHi = Number((event.currentTarget as HTMLInputElement).value);
		value = clampPair(value[0], nextHi);
	}

	function commit() {
		onValueCommit?.(value);
	}
</script>

<div
	class="space-y-3"
	role="group"
	aria-label="Range slider"
	data-vaul-no-drag
	onpointerdown={(e) => e.stopPropagation()}
	ontouchstart={(e) => e.stopPropagation()}
>
	<div class="flex items-center justify-between gap-2 text-sm">
		<span class="font-medium tabular-nums">{formatValue(value[0])}</span>
		<span class="text-muted-foreground">to</span>
		<span class="font-medium tabular-nums">{formatValue(value[1])}</span>
	</div>

	<div class="relative mx-1 h-8">
		<div
			class="absolute top-1/2 right-0 left-0 h-1.5 -translate-y-1/2 rounded-full bg-muted"
			aria-hidden="true"
		>
			<div
				class="absolute h-full rounded-full bg-primary"
				style:left="{loPercent}%"
				style:right="{100 - hiPercent}%"
			></div>
		</div>

		<input
			type="range"
			{min}
			{max}
			{step}
			value={value[0]}
			class="dual-range-input pointer-events-none absolute inset-0 z-20 w-full touch-none appearance-none bg-transparent"
			aria-label={loAriaLabel}
			oninput={onLoInput}
			onchange={commit}
		/>
		<input
			type="range"
			{min}
			{max}
			{step}
			value={value[1]}
			class="dual-range-input pointer-events-none absolute inset-0 z-30 w-full touch-none appearance-none bg-transparent"
			aria-label={hiAriaLabel}
			oninput={onHiInput}
			onchange={commit}
		/>
	</div>

	<div class="flex justify-between text-xs text-muted-foreground tabular-nums">
		<span>{formatValue(min)}</span>
		<span>{formatValue(max)}</span>
	</div>
</div>

<style>
	.dual-range-input::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		pointer-events: auto;
		height: 1rem;
		width: 1rem;
		border-radius: 9999px;
		border: 1px solid var(--primary);
		background: var(--background);
		box-shadow: 0 1px 2px rgb(0 0 0 / 0.08);
		cursor: grab;
	}

	.dual-range-input::-moz-range-thumb {
		pointer-events: auto;
		height: 1rem;
		width: 1rem;
		border-radius: 9999px;
		border: 1px solid var(--primary);
		background: var(--background);
		box-shadow: 0 1px 2px rgb(0 0 0 / 0.08);
		cursor: grab;
	}

	.dual-range-input::-webkit-slider-runnable-track {
		-webkit-appearance: none;
		appearance: none;
		background: transparent;
	}

	.dual-range-input::-moz-range-track {
		background: transparent;
	}
</style>
