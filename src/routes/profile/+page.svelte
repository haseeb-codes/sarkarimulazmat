<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
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
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import ProfileQuotaFields from '$lib/components/profile-quota-fields.svelte';
	import { DEFAULT_PROFILE_RELIGION } from '$lib/profile-quota';

	let { data, form } = $props();

	let submitting = $state(false);
	let deleting = $state(false);
	let editing = $state(page.url.searchParams.get('edit') === '1');
	let keywordInput = $state('');
	let keywords = $state<string[]>([...data.jobInterests]);
	let religion = $state(data.values.religion ?? DEFAULT_PROFILE_RELIGION);
	let hasDisability = $state(data.values.hasDisability ?? false);

	const justSaved = $derived(
		page.url.searchParams.get('saved') === '1' || form?.success === true
	);

	const dobValue = $derived(form?.dateOfBirth ?? data.values.dateOfBirth);
	const educationValue = $derived(form?.highestDegree ?? data.values.highestDegree);
	const degreeTitleValue = $derived(form?.degreeTitle ?? data.values.degreeTitle);
	const degreeSpecializationValue = $derived(
		form?.degreeSpecialization ?? data.values.degreeSpecialization
	);
	const whatsappValue = $derived(form?.whatsappNumber ?? data.values.whatsappNumber);
	const genderValue = $derived(form?.gender ?? data.values.gender);

	$effect(() => {
		if (form?.keywords && Array.isArray(form.keywords)) {
			keywords = form.keywords.map(String);
		}

		if (form?.religion) religion = String(form.religion);
		if (typeof form?.hasDisability === 'boolean') hasDisability = form.hasDisability;

		if (form?.success) {
			editing = false;
			if (page.url.searchParams.get('edit') === '1' || page.url.searchParams.get('saved') !== '1') {
				goto('/profile?saved=1', { replaceState: true, keepFocus: true, noScroll: true });
			}
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

	function startEditing() {
		editing = true;
		if (page.url.searchParams.has('saved')) {
			goto('/profile?edit=1', { replaceState: true, keepFocus: true, noScroll: true });
		}
	}

	function cancelEditing() {
		editing = false;
		keywords = [...data.jobInterests];
		keywordInput = '';
		religion = data.values.religion ?? DEFAULT_PROFILE_RELIGION;
		hasDisability = data.values.hasDisability ?? false;
		goto('/profile', { replaceState: true, keepFocus: true, noScroll: true });
	}
</script>

<svelte:head>
	<title>Your profile — Sarkari Mulazmat</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<article class="mx-auto max-w-lg space-y-6">
	<div class="space-y-2">
		<h1>Your profile</h1>
		<p class="text-sm leading-relaxed text-muted-foreground">
			{#if editing}
				Update the details we use to match jobs to your background.
			{:else}
				Your profile details are saved and ready for job matching.
			{/if}
		</p>
	</div>

	{#if !editing}
		<Card>
			<CardContent class="space-y-5 pt-6">
				<div
					class="flex flex-col items-center gap-3 rounded-lg border border-primary/30 bg-primary/10 px-6 py-8 text-center"
					role="status"
				>
					<CircleCheckIcon class="size-10 text-primary" aria-hidden="true" />
					<div class="space-y-1">
						<p class="text-base font-medium text-primary">
							{#if justSaved}
								Your profile has been saved successfully.
							{:else}
								Your profile is complete.
							{/if}
						</p>
						<p class="text-sm leading-relaxed text-muted-foreground">
							We will use your details and job interests to match relevant government jobs to you.
						</p>
					</div>
				</div>
				<Button class="w-full" onclick={startEditing}>Edit profile</Button>
			</CardContent>
		</Card>
	{:else}
		<Card>
			<CardHeader>
				<CardTitle>Edit profile</CardTitle>
				<CardDescription>
					{#if data.profile.name}
						{data.profile.name} · {data.profile.email}
					{:else}
						{data.profile.email}
					{/if}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					method="POST"
					action="?/update"
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
						<Label for="profile-dob" required>Date of birth</Label>
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
						<Label for="profile-education" required>Highest qualification</Label>
						<select
							id="profile-education"
							name="highest_degree"
							required
							disabled={submitting}
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#each data.educationLevels as level (level)}
								<option value={level} selected={educationValue === level}>{level}</option>
							{/each}
						</select>
					</div>

					<div class="space-y-2">
						<Label for="profile-degree-title" required>Qualification degree</Label>
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

					<div class="space-y-2">
						<Label for="profile-gender" required>Gender</Label>
						<select
							id="profile-gender"
							name="gender"
							required
							disabled={submitting}
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#each data.genders as option (option.value)}
								<option value={option.value} selected={genderValue === option.value}>
									{option.label}
								</option>
							{/each}
						</select>
					</div>

					<div class="space-y-2">
						<Label for="profile-whatsapp" required>WhatsApp number</Label>
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

					<ProfileQuotaFields bind:religion bind:hasDisability disabled={submitting} />

					<div class="space-y-2">
						<Label for="profile-job-keyword" required>Job interest keywords</Label>
						<div class="flex gap-2">
							<Input
								id="profile-job-keyword"
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
						{#if keywords.length > 0}
							<div class="flex flex-wrap gap-2 pt-1">
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
						{/if}
					</div>

					{#each keywords as keyword (keyword)}
						<input type="hidden" name="keyword" value={keyword} />
					{/each}

					<label class="flex items-start gap-3 text-sm leading-relaxed">
						<input
							type="checkbox"
							name="consent"
							required
							checked
							disabled={submitting}
							class="mt-0.5 size-4 rounded border border-input"
						/>
						<span>
							I consent to Sarkari Mulazmat storing my profile data and sending me job-match emails.
						</span>
					</label>

					<div class="flex gap-3">
						<Button type="button" variant="outline" onclick={cancelEditing} disabled={submitting}>
							Cancel
						</Button>
						<Button type="submit" class="flex-1" disabled={submitting || keywords.length === 0}>
							{submitting ? 'Saving…' : 'Save changes'}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Delete profile</CardTitle>
				<CardDescription>
					Removes your profile and saved searches. You can sign in again later with Google.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					method="POST"
					action="?/delete"
					use:enhance={() => {
						if (!confirm('Delete your profile and saved searches? This cannot be undone.')) {
							return () => {};
						}
						deleting = true;
						return async ({ update }) => {
							await update();
							deleting = false;
						};
					}}
				>
					<Button type="submit" variant="destructive" disabled={deleting}>
						{deleting ? 'Deleting…' : 'Delete profile'}
					</Button>
				</form>
			</CardContent>
		</Card>
	{/if}
</article>
