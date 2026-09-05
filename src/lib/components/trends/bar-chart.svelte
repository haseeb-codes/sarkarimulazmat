<script lang="ts">
	import type { TrendPoint } from '$lib/trends-types';
	import { cn } from '$lib/utils.js';

	let {
		title,
		description,
		data,
		orientation = 'vertical',
		emptyMessage = 'No data available.',
		color = 'var(--chart-1)',
		accent = 'var(--chart-1)'
	}: {
		title: string;
		description?: string;
		data: TrendPoint[];
		orientation?: 'vertical' | 'horizontal';
		emptyMessage?: string;
		color?: string;
		accent?: string;
	} = $props();

	let hoveredIndex = $state<number | null>(null);
	let pinnedIndex = $state<number | null>(null);
	let tooltip = $state<{
		x: number;
		y: number;
		label: string;
		count: number;
	} | null>(null);
	let chartRoot: HTMLElement | null = $state(null);

	const maxCount = $derived(Math.max(0, ...data.map((d) => d.count)));
	const total = $derived(data.reduce((sum, d) => sum + d.count, 0));
	const activeIndex = $derived(hoveredIndex ?? pinnedIndex);
	const activePoint = $derived(activeIndex != null ? data[activeIndex] : null);

	function pctOfMax(count: number): number {
		if (maxCount <= 0) return 0;
		return (count / maxCount) * 100;
	}

	function isDimmed(index: number): boolean {
		return activeIndex != null && activeIndex !== index;
	}

	function updateTooltip(index: number, event: PointerEvent) {
		if (!chartRoot) return;
		const rect = chartRoot.getBoundingClientRect();
		const point = data[index];
		tooltip = {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top,
			label: point.label,
			count: point.count
		};
	}

	function onBarEnter(index: number, event: PointerEvent) {
		hoveredIndex = index;
		updateTooltip(index, event);
	}

	function onBarMove(index: number, event: PointerEvent) {
		if (hoveredIndex !== index) hoveredIndex = index;
		updateTooltip(index, event);
	}

	function onBarLeave() {
		hoveredIndex = null;
		if (pinnedIndex == null) {
			tooltip = null;
			return;
		}
		const point = data[pinnedIndex];
		tooltip = {
			x: tooltip?.x ?? 24,
			y: 24,
			label: point.label,
			count: point.count
		};
	}

	function onBarClick(index: number) {
		pinnedIndex = pinnedIndex === index ? null : index;
	}

	function onBarKeydown(index: number, event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onBarClick(index);
		}
	}
</script>

<section
	bind:this={chartRoot}
	class="trend-chart-shell group/chart relative overflow-hidden rounded-2xl border border-border/80 bg-card/90 p-4 shadow-sm transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-5"
	style:--trend-accent={accent}
>
	<div
		class="pointer-events-none absolute inset-x-0 top-0 h-1 opacity-90"
		style:background="linear-gradient(90deg, {color}, color-mix(in oklch, {color} 35%, transparent))"
		aria-hidden="true"
	></div>
	<div
		class="pointer-events-none absolute -top-24 -right-16 size-48 rounded-full opacity-[0.12] blur-2xl"
		style:background={color}
		aria-hidden="true"
	></div>

	<div class="relative mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-start sm:justify-between">
		<div class="min-w-0 space-y-1">
			<h2 class="text-base font-semibold tracking-tight text-foreground sm:text-lg">{title}</h2>
			{#if description}
				<p class="text-sm text-muted-foreground">{description}</p>
			{/if}
			{#if data.length > 0 && maxCount > 0}
				<p class="text-xs text-muted-foreground">
					<span class="font-medium text-foreground/80">{total.toLocaleString('en-PK')}</span>
					total · hover or click a bar for details
				</p>
			{/if}
		</div>

		{#if activePoint}
			<div
				class="shrink-0 rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-right shadow-xs backdrop-blur-sm"
			>
				<p
					class="max-w-[14rem] truncate text-xs font-medium text-muted-foreground"
					title={activePoint.label}
				>
					{activePoint.label}
				</p>
				<p class="text-lg font-semibold tabular-nums tracking-tight text-foreground">
					{activePoint.count.toLocaleString('en-PK')}
				</p>
			</div>
		{/if}
	</div>

	{#if data.length === 0 || maxCount === 0}
		<p class="relative py-10 text-center text-sm text-muted-foreground">{emptyMessage}</p>
	{:else if orientation === 'horizontal'}
		<ul class="relative max-h-[28rem] space-y-2 overflow-y-auto pr-1" role="list">
			{#each data as point, index (point.label)}
				{@const pct = pctOfMax(point.count)}
				<li>
					<button
						type="button"
						class={cn(
							'grid w-full grid-cols-[minmax(0,7.5rem)_1fr_auto] items-center gap-2 rounded-lg px-1 py-1 text-left transition-colors sm:grid-cols-[minmax(0,10rem)_1fr_auto] sm:gap-3 sm:px-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
							activeIndex === index && 'bg-muted/60',
							isDimmed(index) && 'opacity-40'
						)}
						aria-pressed={pinnedIndex === index}
						aria-label="{point.label}: {point.count}"
						onpointerenter={(e) => onBarEnter(index, e)}
						onpointermove={(e) => onBarMove(index, e)}
						onpointerleave={onBarLeave}
						onclick={() => onBarClick(index)}
						onkeydown={(e) => onBarKeydown(index, e)}
					>
						<span class="truncate text-xs font-medium text-foreground sm:text-sm" title={point.label}>
							{point.label}
						</span>
						<div class="h-6 overflow-hidden rounded-md bg-muted/80 sm:h-7" aria-hidden="true">
							<div
								class="trend-bar-fill-x h-full rounded-md"
								style:width="{Math.max(pct, point.count > 0 ? 2 : 0)}%"
								style:background="linear-gradient(90deg, {color}, color-mix(in oklch, {color} 75%, white))"
								style:animation-delay="{(index * 40).toString()}ms"
							></div>
						</div>
						<span class="min-w-10 text-right text-xs tabular-nums text-muted-foreground sm:text-sm">
							{point.count.toLocaleString('en-PK')}
						</span>
					</button>
				</li>
			{/each}
		</ul>
	{:else}
		<div class="relative overflow-x-auto pb-1">
			<div
				class="flex h-56 min-w-full items-end gap-1.5 sm:h-60 sm:gap-2"
				style:min-width="{Math.max(data.length * 3.75, 18)}rem"
				role="list"
				aria-label={title}
			>
				{#each data as point, index (point.label)}
					{@const pct = pctOfMax(point.count)}
					{@const barHeight = Math.max(pct, point.count > 0 ? 6 : 0)}
					<button
						type="button"
						class={cn(
							'group/bar flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-lg px-0.5 py-1 transition-[opacity,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
							isDimmed(index) && 'opacity-35',
							activeIndex === index && 'scale-[1.02]'
						)}
						aria-pressed={pinnedIndex === index}
						aria-label="{point.label}: {point.count}"
						onpointerenter={(e) => onBarEnter(index, e)}
						onpointermove={(e) => onBarMove(index, e)}
						onpointerleave={onBarLeave}
						onclick={() => onBarClick(index)}
						onkeydown={(e) => onBarKeydown(index, e)}
					>
						<div class="flex h-44 w-full flex-col sm:h-48" aria-hidden="true">
							<div class="h-5 shrink-0"></div>
							<div class="relative flex min-h-0 flex-1 items-end">
								<div
									class="relative mx-auto w-full max-w-11"
									style:height="{barHeight}%"
								>
									<span
										class={cn(
											'absolute bottom-full left-1/2 z-10 mb-0.5 -translate-x-1/2 whitespace-nowrap text-[10px] tabular-nums text-muted-foreground transition-colors sm:text-xs',
											activeIndex === index && 'font-semibold text-foreground'
										)}
									>
										{point.count.toLocaleString('en-PK')}
									</span>
									<div
										class="trend-bar-fill h-full w-full rounded-t-lg shadow-sm ring-0 transition-[filter,box-shadow] duration-200 group-hover/bar:brightness-110 group-aria-pressed/bar:ring-2 group-aria-pressed/bar:ring-ring/40"
										style:background="linear-gradient(180deg, color-mix(in oklch, {color} 88%, white), {color})"
										style:animation-delay="{(index * 45).toString()}ms"
									></div>
								</div>
							</div>
						</div>
						<span
							class="w-full text-center text-[10px] leading-tight font-medium text-muted-foreground sm:text-xs"
							title={point.label}
						>
							{point.label}
						</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}

	{#if tooltip && (hoveredIndex != null || pinnedIndex != null)}
		<div
			class="pointer-events-none absolute z-20 max-w-[12rem] -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-lg border border-border/80 bg-popover px-2.5 py-1.5 text-popover-foreground shadow-lg"
			style:left="{Math.min(Math.max(tooltip.x, 72), (chartRoot?.clientWidth ?? 240) - 72)}px"
			style:top="{Math.max(tooltip.y, 56)}px"
			role="tooltip"
		>
			<p class="truncate text-xs font-semibold">{tooltip.label}</p>
			<p class="text-xs tabular-nums text-muted-foreground">
				{tooltip.count.toLocaleString('en-PK')}
			</p>
		</div>
	{/if}
</section>

<style>
	.trend-bar-fill {
		transform-origin: bottom;
		animation: trend-bar-grow-y 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	.trend-bar-fill-x {
		transform-origin: left;
		animation: trend-bar-grow-x 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	@keyframes trend-bar-grow-y {
		from {
			transform: scaleY(0.08);
			opacity: 0.35;
		}
		to {
			transform: scaleY(1);
			opacity: 1;
		}
	}

	@keyframes trend-bar-grow-x {
		from {
			transform: scaleX(0.08);
			opacity: 0.35;
		}
		to {
			transform: scaleX(1);
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.trend-bar-fill,
		.trend-bar-fill-x {
			animation: none;
		}

		:global(.trend-chart-shell:hover) {
			transform: none;
		}
	}
</style>
