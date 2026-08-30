<script lang="ts">
	import { browser } from '$app/environment';
	import logo from '$lib/assets/logo.png';
	import { SITE_NAME, SITE_URL } from '$lib/job-category-pages';
	import type { ListJob } from '$lib/server/job-list-dto';
	import type { SocialJobImageData } from '$lib/server/social-job-images';
	import { formatDateLabel } from '$lib/jobs-utils';
	import { SOCIAL_IMAGE_FORMATS } from '$lib/social-job-images';

	let { data }: { data: SocialJobImageData } = $props();

	let ready = $state(false);

	const updatedLabel = $derived(
		new Date(data.updatedAt).toLocaleDateString('en-PK', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		})
	);

	const isStory = $derived(data.format === 'story');
	const jobsPerPage = $derived(SOCIAL_IMAGE_FORMATS[data.format].jobsPerPage);
	const showPagination = $derived(data.totalPages > 1);

	function truncate(value: string | null | undefined, max: number): string {
		const text = value?.trim();
		if (!text) return '';
		if (text.length <= max) return text;
		return `${text.slice(0, max - 1).trimEnd()}…`;
	}

	function jobMeta(job: ListJob): string {
		const parts: string[] = [];
		if (job.department) parts.push(truncate(job.department, 42));
		if (job.grade) parts.push(`BPS ${job.grade.replace(/^bps[\s-]*/i, '')}`);
		const closing = formatDateLabel(job.last_date_to_apply);
		if (closing) parts.push(`Apply by ${closing}`);
		return parts.join(' · ');
	}

	function jobLocation(job: ListJob): string | null {
		const place = job.place_of_posting?.trim();
		const domicile = job.domicile?.trim();
		if (place && domicile && place !== domicile) {
			return truncate(`${place} · Domicile: ${domicile}`, 58);
		}
		return truncate(place ?? domicile ?? null, 58) || null;
	}

	$effect(() => {
		if (!browser) return;

		const markReady = () => {
			requestAnimationFrame(() => {
				ready = true;
			});
		};

		if (document.fonts?.ready) {
			void document.fonts.ready.then(markReady);
		} else {
			markReady();
		}
	});
</script>

<svelte:head>
	<title>{data.label} — social image</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div
	class="social-image-root"
	style={`width:${data.width}px;height:${data.height}px;`}
	data-social-image={ready ? 'ready' : 'loading'}
	data-slug={data.category.slug}
	data-format={data.format}
	data-page={data.page}
	data-total-pages={data.totalPages}
	data-total-jobs={data.totalJobs}
>
	<div class="social-image-canvas" data-social-image="canvas">
		<header class="header">
			<div class="brand-row">
				<img src={logo} alt="" class="logo" width="72" height="72" />
				<div class="brand-copy">
					<p class="site-name">{SITE_NAME}</p>
					<p class="site-url">{SITE_URL}</p>
				</div>
			</div>

			<div class="headline-block">
				<h1 class="headline">{data.label}</h1>
				<p class="subhead">
					{data.totalJobs.toLocaleString('en-PK')} active opening{data.totalJobs === 1 ? '' : 's'}
					{#if showPagination}
						<span> · Slide {data.page}/{data.totalPages}</span>
					{/if}
				</p>
				<p class="updated">Updated {updatedLabel}</p>
			</div>
		</header>

		<main class="jobs" class:jobs-story={isStory}>
			{#if data.jobs.length === 0}
				<div class="empty-state">
					<p class="empty-title">No active openings right now</p>
					<p class="empty-copy">Check back soon on {SITE_URL}</p>
				</div>
			{:else}
				<ul class="job-list">
					{#each data.jobs as job, index (job.slug)}
						<li class="job-item">
							<div class="job-index">
								{String((data.page - 1) * jobsPerPage + index + 1).padStart(2, '0')}
							</div>
							<div class="job-body">
								<p class="job-title">{truncate(job.title, isStory ? 72 : 64) || 'Untitled posting'}</p>
								{#if jobMeta(job)}
									<p class="job-meta">{jobMeta(job)}</p>
								{/if}
								{#if jobLocation(job)}
									<p class="job-location">{jobLocation(job)}</p>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</main>

		<footer class="footer">
			<p class="footer-cta">Full list &amp; apply links on</p>
			<p class="footer-url">{data.listUrl.replace(/^https?:\/\//, '')}</p>
			<p class="footer-tagline">Government jobs in Pakistan — filter by your background</p>
		</footer>
	</div>
</div>

<style>
	.social-image-root {
		margin: 0 auto;
		background: #f8fafc;
		color: #0f172a;
		font-family: 'Inter Variable', Inter, system-ui, sans-serif;
		overflow: hidden;
	}

	.social-image-canvas {
		box-sizing: border-box;
		display: flex;
		height: 100%;
		width: 100%;
		flex-direction: column;
		background: linear-gradient(180deg, #eef6ff 0%, #ffffff 28%, #ffffff 100%);
		border: 2px solid rgba(15, 76, 129, 0.18);
		padding: 44px 48px 40px;
	}

	.header {
		flex-shrink: 0;
	}

	.brand-row {
		display: flex;
		align-items: center;
		gap: 20px;
	}

	.logo {
		border-radius: 16px;
		box-shadow: 0 8px 24px rgba(15, 76, 129, 0.12);
	}

	.site-name {
		margin: 0;
		font-size: 34px;
		font-weight: 800;
		line-height: 1.1;
		color: #0f4c81;
		letter-spacing: -0.02em;
	}

	.site-url {
		margin: 4px 0 0;
		font-size: 24px;
		font-weight: 600;
		color: rgba(15, 76, 129, 0.78);
	}

	.headline-block {
		margin-top: 28px;
		padding-top: 24px;
		border-top: 2px solid rgba(15, 76, 129, 0.12);
	}

	.headline {
		margin: 0;
		font-size: 52px;
		font-weight: 800;
		line-height: 1.08;
		color: #0f172a;
		letter-spacing: -0.03em;
	}

	.subhead {
		margin: 10px 0 0;
		font-size: 28px;
		font-weight: 600;
		color: #334155;
	}

	.updated {
		margin: 6px 0 0;
		font-size: 22px;
		color: #64748b;
	}

	.jobs {
		flex: 1;
		min-height: 0;
		margin-top: 28px;
	}

	.jobs-story {
		margin-top: 32px;
	}

	.job-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 18px;
	}

	.jobs-story .job-list {
		gap: 22px;
	}

	.job-item {
		display: flex;
		gap: 18px;
		align-items: flex-start;
		padding: 18px 20px;
		border-radius: 18px;
		background: rgba(255, 255, 255, 0.92);
		border: 1px solid rgba(15, 76, 129, 0.12);
		box-shadow: 0 10px 24px rgba(15, 76, 129, 0.06);
	}

	.job-index {
		flex-shrink: 0;
		width: 52px;
		height: 52px;
		border-radius: 14px;
		display: grid;
		place-items: center;
		background: #0f4c81;
		color: #fff;
		font-size: 22px;
		font-weight: 800;
	}

	.job-title {
		margin: 0;
		font-size: 30px;
		font-weight: 700;
		line-height: 1.25;
		color: #0f172a;
	}

	.jobs-story .job-title {
		font-size: 32px;
	}

	.job-meta,
	.job-location {
		margin: 6px 0 0;
		font-size: 22px;
		line-height: 1.35;
		color: #475569;
	}

	.job-location {
		color: #64748b;
	}

	.empty-state {
		height: 100%;
		display: grid;
		place-content: center;
		text-align: center;
		padding: 24px;
		border-radius: 18px;
		border: 2px dashed rgba(15, 76, 129, 0.18);
		background: rgba(255, 255, 255, 0.72);
	}

	.empty-title {
		margin: 0;
		font-size: 34px;
		font-weight: 700;
		color: #0f172a;
	}

	.empty-copy {
		margin: 10px 0 0;
		font-size: 24px;
		color: #64748b;
	}

	.footer {
		flex-shrink: 0;
		margin-top: 28px;
		padding-top: 24px;
		border-top: 2px solid rgba(15, 76, 129, 0.12);
		text-align: center;
	}

	.footer-cta {
		margin: 0;
		font-size: 24px;
		font-weight: 600;
		color: #334155;
	}

	.footer-url {
		margin: 8px 0 0;
		font-size: 34px;
		font-weight: 800;
		color: #0f4c81;
		word-break: break-word;
	}

	.footer-tagline {
		margin: 8px 0 0;
		font-size: 20px;
		color: #64748b;
	}
</style>
