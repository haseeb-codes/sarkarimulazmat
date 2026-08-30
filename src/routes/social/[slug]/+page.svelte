<script lang="ts">
	import JobSpecializationSocialImage from '$lib/components/jobs/job-specialization-social-image.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<JobSpecializationSocialImage {data} />
