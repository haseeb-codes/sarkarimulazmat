<script lang="ts">
	import { signOut } from '@auth/sveltekit/client';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import UserIcon from '@lucide/svelte/icons/user';

	let {
		isSignedIn,
		profileHref,
		userName = null,
		userEmail = null
	}: {
		isSignedIn: boolean;
		profileHref: string;
		userName?: string | null;
		userEmail?: string | null;
	} = $props();

	const displayName = $derived(userName?.trim() || userEmail?.trim() || 'Account');
	const firstName = $derived(displayName.split(/\s+/)[0] ?? 'Account');
	const initials = $derived(
		userName
			?.trim()
			.split(/\s+/)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase() ?? '')
			.join('') ||
			firstName[0]?.toUpperCase() ||
			'U'
	);
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger
		class={cn(
			buttonVariants({ variant: 'ghost', size: 'sm' }),
			'max-w-[12rem] gap-2 px-2'
		)}
		aria-label={isSignedIn ? 'Account menu' : 'Sign in menu'}
	>
		<span
			class="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
			aria-hidden="true"
		>
			{#if isSignedIn}
				{initials}
			{:else}
				<UserIcon class="size-4" />
			{/if}
		</span>
		<span class="hidden truncate sm:inline">{isSignedIn ? firstName : 'Sign in'}</span>
		<ChevronDownIcon class="size-4 shrink-0 opacity-60" aria-hidden="true" />
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end" class="w-56">
		{#if isSignedIn}
			<DropdownMenu.Label class="font-normal">
				<div class="flex flex-col gap-0.5">
					<span class="truncate font-medium text-foreground">{displayName}</span>
					{#if userEmail}
						<span class="truncate text-xs text-muted-foreground">{userEmail}</span>
					{/if}
				</div>
			</DropdownMenu.Label>
			<DropdownMenu.Separator />
			<DropdownMenu.Item class="p-0">
				<a href={profileHref} class="flex w-full items-center gap-2 px-2 py-1.5">
					<UserIcon class="size-4" />
					{profileHref === '/profile' ? 'Your profile' : 'Complete profile'}
				</a>
			</DropdownMenu.Item>
			<DropdownMenu.Separator />
			<DropdownMenu.Item variant="destructive" onSelect={() => signOut({ callbackUrl: '/' })}>
				<LogOutIcon class="size-4" />
				Sign out
			</DropdownMenu.Item>
		{:else}
			<DropdownMenu.Label class="font-normal text-muted-foreground">
				Sign in to save your profile and job interests.
			</DropdownMenu.Label>
			<DropdownMenu.Separator />
			<DropdownMenu.Item class="p-0">
				<a href="/login" class="flex w-full items-center gap-2 px-2 py-1.5">
					<UserIcon class="size-4" />
					Sign in with Google
				</a>
			</DropdownMenu.Item>
		{/if}
	</DropdownMenu.Content>
</DropdownMenu.Root>
