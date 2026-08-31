<script lang="ts">
	import { enhance } from '$app/forms';
	import { signOut } from '@auth/sveltekit/client';
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

	let { data, form } = $props();

	let submitting = $state(false);
	let deleting = $state(false);
	let keywordInput = $state('');
	let keywords = $state<string[]>([...data.jobInterests]);

	const dobValue = $derived(form?.dateOfBirth ?? data.values.dateOfBirth);
	const educationValue = $derived(form?.highestDegree ?? data.values.highestDegree);
	const degreeTitleValue = $derived(form?.degreeTitle ?? data.values.degreeTitle);
	const degreeSpecializationValue = $derived(
		form?.degreeSpecialization ?? data.values.degreeSpecialization
	);
	const whatsappValue = $derived(form?.whatsappNumber ?? data.values.whatsappNumber);
	const hasDisabilityValue = $derived(form?.hasDisability ?? data.values.hasDisability);
	const genderValue = $derived(form?.gender ?? data.values.gender);

	$effect(() => {
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
</script>

<svelte:head>
	<title>Your profile — Sarkari Mulazmat</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<article class="mx-auto max-w-lg space-y-6">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
		<div class="space-y-2">
			<h1>Your profile</h1>
			<p class="text-sm leading-relaxed text-muted-foreground">
				Update the details we use to match jobs to your background.
			</p>
		</div>
		<Button variant="outline" onclick={() => signOut({ callbackUrl: '/' })}>Sign out</Button>
	</div>

	{#if form?.success}
		<div
			class="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary"
			role="status"
		>
			Profile updated.
		</div>
	{/if}

	<Card>
		<CardHeader>
			<CardTitle>Account</CardTitle>
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
						{#each data.educationLevels as level (level)}
							<option value={level} selected={educationValue === level}>{level}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-2">
					<Label for="profile-degree-title">Highest degree title</Label>
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
					<Label for="profile-degree-specialization">Degree specialization (optional)</Label>
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
					<Label for="profile-gender">Gender</Label>
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

				<div class="space-y-2">
					<Label for="profile-job-keyword">Job interest keywords</Label>
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

				<Button type="submit" disabled={submitting || keywords.length === 0}>
					{submitting ? 'Saving…' : 'Save changes'}
				</Button>
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
</article>
