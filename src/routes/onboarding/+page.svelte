<script lang="ts">
	import { enhance } from '$app/forms';
	import { Badge } from '$lib/components/ui/badge/index.js';
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
	import type { OnboardingStage } from '$lib/server/user-profile';

	let { data, form } = $props();

	let submitting = $state(false);
	let stage = $state<OnboardingStage>(data.initialStage);
	let keywordInput = $state('');
	let keywords = $state<string[]>([...data.jobInterests]);

	const stageMeta = {
		1: { title: 'About you', description: 'Basic details we use for job matching.' },
		2: {
			title: 'Your qualifications',
			description: 'Tell us about your highest qualification.'
		},
		3: {
			title: 'Job interests',
			description: 'Add keywords for roles or fields you want to hear about.'
		}
	} as const;

	const dobValue = $derived(form?.dateOfBirth ?? data.values.dateOfBirth);
	const genderValue = $derived(form?.gender ?? data.values.gender);
	const whatsappValue = $derived(form?.whatsappNumber ?? data.values.whatsappNumber);
	const hasDisabilityValue = $derived(form?.hasDisability ?? data.values.hasDisability);
	const educationValue = $derived(form?.highestDegree ?? data.values.highestDegree);
	const degreeTitleValue = $derived(form?.degreeTitle ?? data.values.degreeTitle);
	const degreeSpecializationValue = $derived(
		form?.degreeSpecialization ?? data.values.degreeSpecialization
	);

	$effect(() => {
		if (typeof form?.stage === 'number') {
			stage = form.stage as OnboardingStage;
		}

		if (form?.keywords && Array.isArray(form.keywords)) {
			keywords = form.keywords.map(String);
		}
	});

	function addKeyword() {
		const value = keywordInput.trim();
		if (!value) return;

		const exists = keywords.some((keyword) => keyword.toLowerCase() === value.toLowerCase());
		if (exists) {
			keywordInput = '';
			return;
		}

		keywords = [...keywords, value];
		keywordInput = '';
	}

	function removeKeyword(index: number) {
		keywords = keywords.filter((_, i) => i !== index);
	}

	function handleKeywordKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			addKeyword();
		}
	}

	function goBack() {
		if (stage > 1) stage = (stage - 1) as OnboardingStage;
	}
</script>

<svelte:head>
	<title>Complete your profile — Sarkari Mulazmat</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<article class="mx-auto max-w-lg space-y-6">
	<div class="space-y-2">
		<h1>Complete your profile</h1>
		<p class="text-sm leading-relaxed text-muted-foreground">
			Step {stage} of 3 — {stageMeta[stage].description}
		</p>
		<div class="flex gap-2" aria-hidden="true">
			{#each [1, 2, 3] as step (step)}
				<div
					class="h-1.5 flex-1 rounded-full transition-colors {step <= stage
						? 'bg-primary'
						: 'bg-muted'}"
				></div>
			{/each}
		</div>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>{stageMeta[stage].title}</CardTitle>
			<CardDescription>
				{#if data.profile?.name}
					Signed in as {data.profile.name}
				{:else if data.profile?.email}
					Signed in as {data.profile.email}
				{/if}
			</CardDescription>
		</CardHeader>
		<CardContent>
			{#if form?.error}
				<p
					class="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
					role="alert"
				>
					{form.error}
				</p>
			{/if}

			{#if stage === 1}
				<form
					method="POST"
					action="?/stage1"
					class="space-y-4"
					use:enhance={() => {
						submitting = true;
						return async ({ result, update }) => {
							await update();
							submitting = false;
							if (result.type === 'success' && result.data && 'stage' in result.data) {
								stage = result.data.stage as OnboardingStage;
							}
						};
					}}
				>
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
						<Label for="profile-gender">Gender</Label>
						<select
							id="profile-gender"
							name="gender"
							required
							disabled={submitting}
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<option value="" disabled selected={!genderValue}>Select gender</option>
							{#each data.genders as option (option.value)}
								<option value={option.value} selected={genderValue === option.value}>
									{option.label}
								</option>
							{/each}
						</select>
					</div>

					<div class="space-y-2">
						<Label for="profile-whatsapp">WhatsApp number</Label>
						<Input
							id="profile-whatsapp"
							name="whatsapp_number"
							type="tel"
							required
							autocomplete="tel"
							inputmode="tel"
							placeholder="e.g. 03001234567"
							value={whatsappValue}
							disabled={submitting}
						/>
					</div>

					<label class="flex items-start gap-3 text-sm leading-relaxed">
						<input
							type="checkbox"
							name="has_disability"
							checked={hasDisabilityValue}
							disabled={submitting}
							class="mt-0.5 size-4 rounded border border-input"
						/>
						<span>I have a disability</span>
					</label>

					<Button type="submit" class="w-full" disabled={submitting}>
						{submitting ? 'Saving…' : 'Continue'}
					</Button>
				</form>
			{:else if stage === 2}
				<form
					method="POST"
					action="?/stage2"
					class="space-y-4"
					use:enhance={() => {
						submitting = true;
						return async ({ result, update }) => {
							await update();
							submitting = false;
							if (result.type === 'success' && result.data && 'stage' in result.data) {
								stage = result.data.stage as OnboardingStage;
							}
						};
					}}
				>
					<div class="space-y-2">
						<Label for="profile-education">Highest qualification</Label>
						<select
							id="profile-education"
							name="highest_degree"
							required
							disabled={submitting}
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<option value="" disabled selected={!educationValue}>Select qualification level</option>
							{#each data.educationLevels as level (level)}
								<option value={level} selected={educationValue === level}>{level}</option>
							{/each}
						</select>
					</div>

					<div class="space-y-2">
						<Label for="profile-degree-title">Qualification degree</Label>
						<Input
							id="profile-degree-title"
							name="degree_title"
							type="text"
							required
							autocomplete="off"
							placeholder="e.g. BS Computer Science, MBBS"
							value={degreeTitleValue}
							disabled={submitting}
						/>
					</div>

					<div class="space-y-2">
						<Label for="profile-degree-specialization">Qualification specialization (optional)</Label>
						<Input
							id="profile-degree-specialization"
							name="degree_specialization"
							type="text"
							autocomplete="off"
							placeholder="e.g. Computer Science, Civil Engineering"
							value={degreeSpecializationValue}
							disabled={submitting}
						/>
					</div>

					<div class="flex gap-3">
						<Button type="button" variant="outline" onclick={goBack} disabled={submitting}>
							Back
						</Button>
						<Button type="submit" class="flex-1" disabled={submitting}>
							{submitting ? 'Saving…' : 'Continue'}
						</Button>
					</div>
				</form>
			{:else}
				<form
					method="POST"
					action="?/stage3"
					class="space-y-4"
					use:enhance={() => {
						submitting = true;
						return async ({ update }) => {
							await update();
							submitting = false;
						};
					}}
				>
					<div class="space-y-2">
						<Label for="job-keyword">Job interest keywords</Label>
						<p class="text-sm text-muted-foreground">
							Add topics like data science, android development, legal, or cardiologist. Press Enter
							or click Add after each one.
						</p>
						<div class="flex gap-2">
							<Input
								id="job-keyword"
								type="text"
								autocomplete="off"
								placeholder="e.g. data science"
								bind:value={keywordInput}
								onkeydown={handleKeywordKeydown}
								disabled={submitting}
							/>
							<Button type="button" variant="secondary" onclick={addKeyword} disabled={submitting}>
								Add
							</Button>
						</div>
					</div>

					{#if keywords.length > 0}
						<div class="flex flex-wrap gap-2">
							{#each keywords as keyword, index (keyword + index)}
								<Badge variant="secondary" class="gap-1 pr-1">
									{keyword}
									<button
										type="button"
										class="rounded-sm px-1 text-muted-foreground hover:text-foreground"
										aria-label="Remove {keyword}"
										onclick={() => removeKeyword(index)}
										disabled={submitting}
									>
										×
									</button>
								</Badge>
							{/each}
						</div>
					{:else}
						<p class="text-sm text-muted-foreground">No keywords added yet.</p>
					{/if}

					{#each keywords as keyword (keyword)}
						<input type="hidden" name="keyword" value={keyword} />
					{/each}

					<label class="flex items-start gap-3 text-sm leading-relaxed">
						<input
							type="checkbox"
							name="consent"
							required
							disabled={submitting}
							class="mt-0.5 size-4 rounded border border-input"
						/>
						<span>
							I consent to Sarkari Mulazmat storing my profile data and sending me job-match emails.
							I can edit or delete my profile and unsubscribe at any time.
						</span>
					</label>

					<div class="flex gap-3">
						<Button type="button" variant="outline" onclick={goBack} disabled={submitting}>
							Back
						</Button>
						<Button type="submit" class="flex-1" disabled={submitting || keywords.length === 0}>
							{submitting ? 'Saving…' : 'Save profile'}
						</Button>
					</div>
				</form>
			{/if}
		</CardContent>
	</Card>
</article>
