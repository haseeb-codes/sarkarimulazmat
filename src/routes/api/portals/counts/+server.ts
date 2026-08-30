import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPortalJobCounts } from '$lib/server/jobs';

export const GET: RequestHandler = async () => {
	try {
		const portals = await getPortalJobCounts();
		return json({ portals });
	} catch (err) {
		console.error('GET /api/portals/counts failed', err);
		error(500, 'Could not load portal counts');
	}
};
