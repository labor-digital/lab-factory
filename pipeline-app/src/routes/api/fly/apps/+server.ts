import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { listApps, listMachines, FlyApiError } from '$lib/fly/api.js';

/**
 * GET /api/fly/apps?org=<slug>&withMachines=1
 *
 * Lists fly.io apps in the org. `withMachines=1` adds a `machines` array
 * per app (one extra round-trip per app — only use on the dedicated /fly
 * page, not on the dashboard overview where we render the count only).
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	const token = env.FLY_API_TOKEN?.trim();
	if (!token) throw error(503, 'FLY_API_TOKEN not configured');

	let orgSlug = url.searchParams.get('org')?.trim() ?? '';
	if (orgSlug === '') {
		const { data } = await locals.supabase.from('team_defaults').select('fly_org_slug').limit(1).maybeSingle();
		orgSlug = data?.fly_org_slug?.trim() ?? '';
	}
	if (orgSlug === '') throw error(400, 'fly org slug missing — pass ?org= or set team_defaults.fly_org_slug');

	try {
		const apps = await listApps(token, orgSlug);
		if (url.searchParams.get('withMachines') === '1') {
			const enriched = await Promise.all(
				apps.map(async (app) => {
					try {
						const machines = await listMachines(token, app.name);
						return { ...app, machines };
					} catch {
						return { ...app, machines: [] as never[] };
					}
				})
			);
			return json({ apps: enriched, orgSlug });
		}
		return json({ apps, orgSlug });
	} catch (err) {
		if (err instanceof FlyApiError) throw error(err.status >= 400 && err.status < 600 ? err.status : 502, err.message);
		throw error(502, (err as Error).message);
	}
};
