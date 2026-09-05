import type { PageServerLoad } from './$types';
import {
	getJobsPostedLast7Days,
	getDonorNameCounts,
	getEducationLevelCounts,
	getGradeDerivedCounts,
	getJobsExpiringByDate,
	getDomicileFlagCounts
} from '$lib/server/trends';
import type { TrendPoint } from '$lib/trends-types';

function emptyOnError(
	label: string,
	promise: Promise<TrendPoint[]>
): Promise<TrendPoint[]> {
	return promise.catch((err) => {
		console.error(`Failed to load trends: ${label}`, err);
		return [] as TrendPoint[];
	});
}

export const load: PageServerLoad = () => {
	// Stream each chart independently — shell + skeletons render immediately.
	return {
		jobsPostedLast7Days: emptyOnError('jobsPostedLast7Days', getJobsPostedLast7Days()),
		jobsExpiringByDate: emptyOnError('jobsExpiringByDate', getJobsExpiringByDate()),
		gradeDerived: emptyOnError('gradeDerived', getGradeDerivedCounts()),
		educationLevels: emptyOnError('educationLevels', getEducationLevelCounts()),
		donors: emptyOnError('donors', getDonorNameCounts()),
		domicileFlags: emptyOnError('domicileFlags', getDomicileFlagCounts())
	};
};
