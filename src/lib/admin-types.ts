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

/** One query param as used in the search URL (for admin replay). */
export type AdminSearchParam = {
	key: string;
	value: string;
	label: string;
};

export type AdminSearchRow = {
	id: string;
	result_count: number;
	path: string | null;
	/** Repaired / reconstructed href to replay the search. */
	href: string | null;
	/** Query params exactly as in the replay URL. */
	params: AdminSearchParam[];
	ip_address: string | null;
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

