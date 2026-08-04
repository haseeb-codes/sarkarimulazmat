import db from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		await db.$queryRaw`SELECT 1`;
		return Response.json({ ok: true, db: true }, { status: 200 });
	} catch {
		return Response.json({ ok: false, db: false }, { status: 503 });
	}
};
