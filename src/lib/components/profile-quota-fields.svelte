<script lang="ts">
	import ProfileQuotaInfo from '$lib/components/profile-quota-info.svelte';
	import ProfileSegmentToggle from '$lib/components/profile-segment-toggle.svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import {
		DEFAULT_PROFILE_RELIGION,
		DISABILITY_TOGGLE_OPTIONS,
		PROFILE_RELIGIONS,
		disabilityFormValue
	} from '$lib/profile-quota';

	let {
		religion = $bindable(DEFAULT_PROFILE_RELIGION),
		hasDisability = $bindable(false),
		disabled = false
	}: {
		religion?: string;
		hasDisability?: boolean;
		disabled?: boolean;
	} = $props();

	let disabilityValue = $state(disabilityFormValue(hasDisability));

	$effect.pre(() => {
		disabilityValue = disabilityFormValue(hasDisability);
	});

	$effect(() => {
		hasDisability = disabilityValue === 'true';
	});
</script>

<div class="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
	<div class="flex items-start justify-between gap-3">
		<div class="space-y-1">
			<p id="quota-fields-heading" class="text-sm font-medium text-foreground">Quota eligibility</p>
			<p class="text-xs leading-relaxed text-muted-foreground">
				Used to surface jobs with minority or disability quotas.
			</p>
		</div>
		<ProfileQuotaInfo />
	</div>

	<div class="space-y-2">
		<Label id="profile-religion-label" required>Religion</Label>
		<ProfileSegmentToggle
			name="religion"
			bind:value={religion}
			options={PROFILE_RELIGIONS}
			{disabled}
			labelledBy="profile-religion-label"
		/>
	</div>

	<div class="space-y-2">
		<Label id="profile-disability-label" required>Disability</Label>
		<ProfileSegmentToggle
			name="has_disability"
			bind:value={disabilityValue}
			options={DISABILITY_TOGGLE_OPTIONS}
			{disabled}
			labelledBy="profile-disability-label"
		/>
	</div>
</div>
