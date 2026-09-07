/**
 * Badge colours per job attribute, shared by job cards and the detail page so the
 * same field is always the same hue. Tokens live in `app.css` (`--facet-*`).
 */
export const facetBadgeClass = {
	program:
		'rounded-md border-facet-program/25 bg-facet-program-bg text-facet-program hover:bg-facet-program/15 hover:text-facet-program',
	specialization:
		'border-facet-spec/25 bg-facet-spec-bg text-facet-spec hover:bg-facet-spec/15 hover:text-facet-spec',
	degree:
		'border-facet-degree/25 bg-facet-degree-bg text-facet-degree hover:bg-facet-degree/15 hover:text-facet-degree',
	domicile:
		'border-facet-domicile/25 bg-facet-domicile-bg text-facet-domicile hover:bg-facet-domicile/15 hover:text-facet-domicile',
	location:
		'border-facet-location/25 bg-facet-location-bg text-facet-location hover:bg-facet-location/15 hover:text-facet-location',
	salary:
		'border-facet-salary/25 bg-facet-salary-bg text-facet-salary hover:bg-facet-salary/15 hover:text-facet-salary',
	age: 'border-facet-age/25 bg-facet-age-bg text-facet-age hover:bg-facet-age/15 hover:text-facet-age'
} as const;
