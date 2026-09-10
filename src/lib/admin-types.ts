/** Shared admin dashboard types — safe for client and server. */
export type AdminOverview = {
	users: number;
	visitors: number;
	pageViews: number;
	searches: number;
	emails: number;
	savedSearches: number;
	jobInterests: number;
	categoryPages: number;
	ads: number;
	emailSubscribedUsers: number;
	linkedVisitors: number;
};

export type AdminEmailRow = {
	id: string;
	name: string;
	email: string | null;
	contact: string;
	message: string;
	created_at: Date;
};

export type AdminSearchFilterChip = {
	id: string;
	label: string;
	category: string;
};

export type AdminSearchRow = {
	id: string;
	result_count: number;
	path: string | null;
	device_type: string | null;
	browser: string | null;
	browser_version: string | null;
	os: string | null;
	created_at: Date;
	keyword: string | null;
	sort: string | null;
	filters: AdminSearchFilterChip[];
	filter_count: number;
};

