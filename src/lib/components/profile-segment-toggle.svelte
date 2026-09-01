<script lang="ts">
	import { cn } from '$lib/utils.js';

	type Option = { value: string; label: string };

	let {
		name,
		value = $bindable(),
		options,
		disabled = false,
		labelledBy
	}: {
		name: string;
		value: string;
		options: readonly [Option, Option];
		disabled?: boolean;
		labelledBy?: string;
	} = $props();
</script>

<input type="hidden" {name} {value} />
<div
	class="flex rounded-md border border-border bg-muted p-1"
	role="group"
	aria-labelledby={labelledBy}
>
	{#each options as option (option.value)}
		<button
			type="button"
			{disabled}
			aria-pressed={value === option.value}
			class={cn(
				'flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
				value === option.value
					? 'bg-primary text-primary-foreground shadow-sm'
					: 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
			)}
			onclick={() => (value = option.value)}
		>
			{option.label}
		</button>
	{/each}
</div>
