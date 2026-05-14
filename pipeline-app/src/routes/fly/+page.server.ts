import { env } from '$env/dynamic/private';
import { listApps, listMachines, type FlyApp, type FlyMachine, FlyApiError } from '$lib/fly/api.js';
import type { PageServerLoad } from './$types';

interface AppRow extends FlyApp {
	machines: FlyMachine[];
}

export const load: PageServerLoad = async ({ locals }) => {
	const token = env.FLY_API_TOKEN?.trim();
	if (!token) {
		return { apps: [] as AppRow[], orgSlug: '', error: 'FLY_API_TOKEN not configured' };
	}

	const { data: defaults } = await locals.supabase
		.from('team_defaults')
		.select('fly_org_slug')
		.limit(1)
		.maybeSingle();
	const orgSlug = defaults?.fly_org_slug?.trim() ?? '';
	if (orgSlug === '') {
		return { apps: [] as AppRow[], orgSlug: '', error: 'No fly_org_slug set in team_defaults' };
	}

	try {
		const apps = await listApps(token, orgSlug);
		const enriched: AppRow[] = await Promise.all(
			apps.map(async (app) => {
				try {
					const machines = await listMachines(token, app.name);
					return { ...app, machines };
				} catch {
					return { ...app, machines: [] };
				}
			})
		);
		return { apps: enriched, orgSlug, error: null };
	} catch (err) {
		const msg = err instanceof FlyApiError ? `Fly API ${err.status}: ${err.message}` : (err as Error).message;
		return { apps: [] as AppRow[], orgSlug, error: msg };
	}
};
