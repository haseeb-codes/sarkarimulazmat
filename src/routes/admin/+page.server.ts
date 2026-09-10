import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { clearAdminSessionCookie } from '$lib/server/admin-auth';
import {
	getAdminOverview,
	getBrowserCounts,
	getDegreeCounts,
	getDeviceTypeCounts,
	getGenderCounts,
	getNewUsersLast30Days,
	getNewVisitorsLast30Days,
	getOsCounts,
	getPageViewsLast14Days,
	getUniqueIpsLast14Days,
	getRecentEmails,
	getRecentSearches,
	getReligionCounts,
	getAppliedFilterCategoryCounts,
	getTopAppliedFilterValues,
	getSearchKeywordCounts,
	getSearchesLast14Days,
	getTopJobInterestKeywords,
	getTopPaths
} from '$lib/server/admin-stats';
import type { TrendPoint } from '$lib/trends-types';
import type { AdminEmailRow, AdminOverview, AdminSearchRow } from '$lib/admin-types';

function emptyPointsOnError(label: string, promise: Promise<TrendPoint[]>): Promise<TrendPoint[]> {
	return promise.catch((err) => {
		console.error(`Failed to load admin chart: ${label}`, err);
		return [] as TrendPoint[];
	});
}

function emptyOverviewOnError(promise: Promise<AdminOverview>): Promise<AdminOverview> {
	return promise.catch((err) => {
		console.error('Failed to load admin overview', err);
		return {
			users: 0,
			visitors: 0,
			pageViews: 0,
			searches: 0,
			emails: 0,
			savedSearches: 0,
			jobInterests: 0,
			categoryPages: 0,
			ads: 0,
			emailSubscribedUsers: 0,
			linkedVisitors: 0
		};
	});
}

function emptyEmailsOnError(promise: Promise<AdminEmailRow[]>): Promise<AdminEmailRow[]> {
	return promise.catch((err) => {
		console.error('Failed to load admin emails', err);
		return [] as AdminEmailRow[];
	});
}

function emptySearchesOnError(promise: Promise<AdminSearchRow[]>): Promise<AdminSearchRow[]> {
	return promise.catch((err) => {
		console.error('Failed to load admin searches', err);
		return [] as AdminSearchRow[];
	});
}

export const load: PageServerLoad = () => {
	return {
		overview: emptyOverviewOnError(getAdminOverview()),
		pageViewsLast14Days: emptyPointsOnError('pageViewsLast14Days', getPageViewsLast14Days()),
		uniqueIpsLast14Days: emptyPointsOnError('uniqueIpsLast14Days', getUniqueIpsLast14Days()),
		searchesLast14Days: emptyPointsOnError('searchesLast14Days', getSearchesLast14Days()),
		newUsersLast30Days: emptyPointsOnError('newUsersLast30Days', getNewUsersLast30Days()),
		newVisitorsLast30Days: emptyPointsOnError('newVisitorsLast30Days', getNewVisitorsLast30Days()),
		topPaths: emptyPointsOnError('topPaths', getTopPaths()),
		deviceTypes: emptyPointsOnError('deviceTypes', getDeviceTypeCounts()),
		browsers: emptyPointsOnError('browsers', getBrowserCounts()),
		os: emptyPointsOnError('os', getOsCounts()),
		genders: emptyPointsOnError('genders', getGenderCounts()),
		degrees: emptyPointsOnError('degrees', getDegreeCounts()),
		religions: emptyPointsOnError('religions', getReligionCounts()),
		jobInterestKeywords: emptyPointsOnError(
			'jobInterestKeywords',
			getTopJobInterestKeywords()
		),
		searchKeywords: emptyPointsOnError('searchKeywords', getSearchKeywordCounts()),
		filterCategories: emptyPointsOnError(
			'filterCategories',
			getAppliedFilterCategoryCounts()
		),
		topFilterValues: emptyPointsOnError('topFilterValues', getTopAppliedFilterValues()),
		recentEmails: emptyEmailsOnError(getRecentEmails()),
		recentSearches: emptySearchesOnError(getRecentSearches())
	};
};

export const actions: Actions = {
	logout: async ({ cookies }) => {
		clearAdminSessionCookie(cookies);
		redirect(303, '/admin/login');
	}
};
