<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card/index.js';

	let { data, form } = $props();

	let submitting = $state(false);

	const dobValue = $derived(
		form?.dateOfBirth ??
			(data.profile?.date_of_birth
				? data.profile.date_of_birth.toISOString().slice(0, 10)
				: '')
	);
	const graduationValue = $derived(
		form?.graduationDate ??
			(data.profile?.graduation_date
				? data.profile.graduation_date.toISOString().slice(0, 10)
				: '')
	);
</script>

<svelte:head>
	<title>Complete your profile — Sarkari Mulazmat</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<article class="mx-auto max-w-lg space-y-6">
	<div class="space-y-2">
		<h1>Complete your profile</h1>
		<p class="text-sm leading-relaxed text-muted-foreground">
			We use this information to match government jobs to your background. You can update it later
			from your profile page.
		</p>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>About you</CardTitle>
			<CardDescription>
				{#if data.profile?.name}
					Signed in as {data.profile.name}
				{:else if data.profile?.email}
					Signed in as {data.profile.email}
				{/if}
			</CardDescription>
		</CardHeader>
		<CardContent>
			<form
				method="POST"
				class="space-y-4"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						await update();
						submitting = false;
					};
				}}
			>
				{#if form?.error}
					<p
						class="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
						role="alert"
					>
						{form.error}
					</p>
				{/if}

				<div class="space-y-2">
					<Label for="profile-dob">Date of birth</Label>
					<Input
						id="profile-dob"
						name="date_of_birth"
						type="date"
						required
						value={dobValue}
						disabled={submitting}
					/>
				</div>

				<div class="space-y-2">
					<Label for="profile-education">Highest education level</Label>
					<select
						id="profile-education"
						name="highest_degree"
						required
						disabled={submitting}
						class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
					>
						<option value="" disabled selected={!form?.highestDegree && !data.profile?.highest_degree}>
							Select education level
						</option>
						{#each data.educationLevels as level (level)}
							<option
								value={level}
								selected={(form?.highestDegree ?? data.profile?.highest_degree) === level}
							>
								{level}
							</option>
						{/each}
					</select>
				</div>

				<div class="space-y-2">
					<Label for="profile-graduation">Graduation date</Label>
					<Input
						id="profile-graduation"
						name="graduation_date"
						type="date"
						required
						value={graduationValue}
						disabled={submitting}
					/>
				</div>

				<div class="space-y-2">
					<Label for="profile-gender">Gender</Label>
					<select
						id="profile-gender"
						name="gender"
						required
						disabled={submitting}
						class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
					>
						<option value="" disabled selected={!form?.gender && !data.profile?.gender}>
							Select gender
						</option>
						{#each data.genders as option (option.value)}
							<option
								value={option.value}
								selected={(form?.gender ?? data.profile?.gender) === option.value}
							>
								{option.label}
							</option>
						{/each}
					</select>
				</div>

				<label class="flex items-start gap-3 text-sm leading-relaxed">
					<input
						type="checkbox"
						name="consent"
						required
						disabled={submitting}
						class="mt-0.5 size-4 rounded border border-input"
					/>
					<span>
						I consent to Sarkari Mulazmat storing my profile data and sending me job-match emails. I
						can edit or delete my profile and unsubscribe at any time.
					</span>
				</label>

				<Button type="submit" class="w-full" disabled={submitting}>
					{submitting ? 'Saving…' : 'Save profile'}
				</Button>
			</form>
		</CardContent>
	</Card>
</article>
