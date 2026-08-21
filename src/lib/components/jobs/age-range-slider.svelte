<script lang="ts">
	import DualRangeSlider from '$lib/components/jobs/dual-range-slider.svelte';
	import { AGE_FILTER_MAX, AGE_FILTER_MIN } from '$lib/jobs-utils';

	let {
		min = AGE_FILTER_MIN,
		max = AGE_FILTER_MAX,
		value = $bindable<[number, number]>([AGE_FILTER_MIN, AGE_FILTER_MAX]),
		onValueCommit
	}: {
		min?: number;
		max?: number;
		value?: [number, number];
		onValueCommit?: (value: [number, number]) => void;
	} = $props();
</script>

<DualRangeSlider
	{min}
	{max}
	bind:value
	{onValueCommit}
	formatValue={(n) => `${n} yrs`}
	loAriaLabel="Minimum age"
	hiAriaLabel="Maximum age"
/>
