<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { getJobAdKind, getJobAdUrl } from '$lib/jobs-utils';
	import MinusIcon from '@lucide/svelte/icons/minus';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';

	const MIN_ZOOM = 1;
	const MAX_ZOOM = 5;
	const ZOOM_STEP = 0.5;

	let {
		open = $bindable(false),
		title,
		supabaseFilePath
	}: {
		open?: boolean;
		title: string | null;
		supabaseFilePath: string | null;
	} = $props();

	const adUrl = $derived(getJobAdUrl(supabaseFilePath));
	const adKind = $derived(getJobAdKind(supabaseFilePath));
	const imageAlt = $derived(`${title ?? 'Job'} advertisement`);

	let zoom = $state(1);
	let offsetX = $state(0);
	let offsetY = $state(0);
	let dragging = $state(false);

	let viewportEl = $state<HTMLElement | null>(null);

	let dragStartX = 0;
	let dragStartY = 0;
	let dragOriginX = 0;
	let dragOriginY = 0;
	let pinchStartDistance = 0;
	let pinchStartZoom = 1;

	$effect(() => {
		if (!open) {
			zoom = 1;
			offsetX = 0;
			offsetY = 0;
			dragging = false;
		}
	});

	function clampZoom(value: number) {
		return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
	}

	function setZoom(next: number, originX?: number, originY?: number) {
		const previous = zoom;
		const clamped = clampZoom(next);
		if (clamped === previous) {
			if (clamped === MIN_ZOOM) {
				offsetX = 0;
				offsetY = 0;
			}
			return;
		}

		if (clamped === MIN_ZOOM) {
			zoom = MIN_ZOOM;
			offsetX = 0;
			offsetY = 0;
			return;
		}

		const el = viewportEl;
		if (el && originX != null && originY != null && previous > 0) {
			const rect = el.getBoundingClientRect();
			const cx = originX - rect.left - rect.width / 2;
			const cy = originY - rect.top - rect.height / 2;
			const scale = clamped / previous;
			offsetX = cx - (cx - offsetX) * scale;
			offsetY = cy - (cy - offsetY) * scale;
		}

		zoom = clamped;
	}

	function zoomIn() {
		setZoom(zoom + ZOOM_STEP);
	}

	function zoomOut() {
		setZoom(zoom - ZOOM_STEP);
	}

	function resetZoom() {
		zoom = MIN_ZOOM;
		offsetX = 0;
		offsetY = 0;
	}

	function onWheel(event: WheelEvent) {
		if (adKind !== 'image') return;
		event.preventDefault();
		const delta = event.deltaY < 0 ? ZOOM_STEP / 2 : -ZOOM_STEP / 2;
		setZoom(zoom + delta, event.clientX, event.clientY);
	}

	function onDoubleClick(event: MouseEvent) {
		if (adKind !== 'image') return;
		if (zoom > MIN_ZOOM) {
			resetZoom();
		} else {
			setZoom(2.5, event.clientX, event.clientY);
		}
	}

	function onPointerDown(event: PointerEvent) {
		if (adKind !== 'image' || zoom <= MIN_ZOOM) return;
		if (event.pointerType === 'touch') return;
		dragging = true;
		dragStartX = event.clientX;
		dragStartY = event.clientY;
		dragOriginX = offsetX;
		dragOriginY = offsetY;
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
	}

	function onPointerMove(event: PointerEvent) {
		if (!dragging) return;
		offsetX = dragOriginX + (event.clientX - dragStartX);
		offsetY = dragOriginY + (event.clientY - dragStartY);
	}

	function onPointerUp(event: PointerEvent) {
		if (!dragging) return;
		dragging = false;
		try {
			(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
		} catch {
			/* already released */
		}
	}

	function touchDistance(touches: TouchList) {
		const [a, b] = [touches[0], touches[1]];
		const dx = a.clientX - b.clientX;
		const dy = a.clientY - b.clientY;
		return Math.hypot(dx, dy);
	}

	function touchMidpoint(touches: TouchList) {
		return {
			x: (touches[0].clientX + touches[1].clientX) / 2,
			y: (touches[0].clientY + touches[1].clientY) / 2
		};
	}

	function onTouchStart(event: TouchEvent) {
		if (adKind !== 'image') return;
		if (event.touches.length === 2) {
			pinchStartDistance = touchDistance(event.touches);
			pinchStartZoom = zoom;
			dragging = false;
		} else if (event.touches.length === 1 && zoom > MIN_ZOOM) {
			dragging = true;
			dragStartX = event.touches[0].clientX;
			dragStartY = event.touches[0].clientY;
			dragOriginX = offsetX;
			dragOriginY = offsetY;
		}
	}

	function onTouchMove(event: TouchEvent) {
		if (adKind !== 'image') return;
		if (event.touches.length === 2 && pinchStartDistance > 0) {
			event.preventDefault();
			const mid = touchMidpoint(event.touches);
			const ratio = touchDistance(event.touches) / pinchStartDistance;
			setZoom(pinchStartZoom * ratio, mid.x, mid.y);
		} else if (event.touches.length === 1 && dragging && zoom > MIN_ZOOM) {
			event.preventDefault();
			offsetX = dragOriginX + (event.touches[0].clientX - dragStartX);
			offsetY = dragOriginY + (event.touches[0].clientY - dragStartY);
		}
	}

	function onTouchEnd(event: TouchEvent) {
		if (event.touches.length < 2) {
			pinchStartDistance = 0;
		}
		if (event.touches.length === 0) {
			dragging = false;
		} else if (event.touches.length === 1 && zoom > MIN_ZOOM) {
			dragging = true;
			dragStartX = event.touches[0].clientX;
			dragStartY = event.touches[0].clientY;
			dragOriginX = offsetX;
			dragOriginY = offsetY;
		}
	}

	const zoomLabel = $derived(`${Math.round(zoom * 100)}%`);
	const canZoomOut = $derived(zoom > MIN_ZOOM);
	const canZoomIn = $derived(zoom < MAX_ZOOM);
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="flex max-h-[calc(100vh-2rem)] max-w-[min(100vw-2rem,56rem)] flex-col gap-0 overflow-hidden p-0"
	>
		<Dialog.Header class="shrink-0 border-b border-border px-6 py-4 text-left">
			<Dialog.Title class="pr-8">{title ?? 'Job advertisement'}</Dialog.Title>
			<Dialog.Description class="sr-only">Original job advertisement</Dialog.Description>
		</Dialog.Header>

		{#if adUrl && adKind === 'image'}
			<div
				class="flex shrink-0 items-center justify-center gap-1 border-b border-border bg-background px-3 py-2"
			>
				<Button
					variant="outline"
					size="icon-sm"
					onclick={zoomOut}
					disabled={!canZoomOut}
					aria-label="Zoom out"
				>
					<MinusIcon />
				</Button>
				<span class="min-w-14 text-center text-xs tabular-nums text-muted-foreground">{zoomLabel}</span>
				<Button
					variant="outline"
					size="icon-sm"
					onclick={zoomIn}
					disabled={!canZoomIn}
					aria-label="Zoom in"
				>
					<PlusIcon />
				</Button>
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={resetZoom}
					disabled={!canZoomOut}
					aria-label="Reset zoom"
				>
					<RotateCcwIcon />
				</Button>
			</div>
		{/if}

		<div class="min-h-0 flex-1 overflow-hidden bg-muted/30">
			{#if adUrl && adKind === 'image'}
				<div
					bind:this={viewportEl}
					class="relative h-[min(75vh,calc(100vh-11rem))] w-full touch-none select-none overflow-hidden"
					class:cursor-grab={zoom > MIN_ZOOM && !dragging}
					class:cursor-grabbing={dragging}
					onwheel={onWheel}
					ondblclick={onDoubleClick}
					onpointerdown={onPointerDown}
					onpointermove={onPointerMove}
					onpointerup={onPointerUp}
					onpointercancel={onPointerUp}
					ontouchstart={onTouchStart}
					ontouchmove={onTouchMove}
					ontouchend={onTouchEnd}
					ontouchcancel={onTouchEnd}
					role="img"
					aria-label={imageAlt}
				>
					<img
						src={adUrl}
						alt={imageAlt}
						draggable="false"
						class="pointer-events-none absolute top-1/2 left-1/2 max-h-full max-w-full object-contain"
						style="transform: translate(calc(-50% + {offsetX}px), calc(-50% + {offsetY}px)) scale({zoom}); transform-origin: center center;"
						loading="lazy"
					/>
				</div>
				<p class="px-4 py-2 text-center text-xs text-muted-foreground">
					Pinch or scroll to zoom · drag to pan · double-click to toggle
				</p>
			{:else if adUrl && adKind === 'pdf'}
				<div class="p-4">
					<iframe
						src={adUrl}
						title={imageAlt}
						class="mx-auto block h-[75vh] w-full rounded-md border border-border bg-background"
					></iframe>
					<p class="mt-3 text-center text-sm text-muted-foreground">
						<a
							href={adUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="underline underline-offset-2"
						>
							Open PDF in a new tab
						</a>
					</p>
				</div>
			{:else if adUrl}
				<p class="px-2 py-6 text-center text-sm text-muted-foreground">
					<a href={adUrl} target="_blank" rel="noopener noreferrer" class="underline underline-offset-2">
						Open advertisement
					</a>
				</p>
			{:else}
				<p class="px-2 py-6 text-center text-sm text-muted-foreground">
					Advertisement is not available for this posting.
				</p>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
