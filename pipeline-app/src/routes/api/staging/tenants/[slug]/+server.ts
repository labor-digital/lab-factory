import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { getTenant, StagingApiError } from '$lib/staging/api.js';

function getStagingApiToken(): string | null {
	return env.STAGING_API_TOKEN?.trim() ? env.STAGING_API_TOKEN : null;
}

export const GET: RequestHandler = async ({ params, url }) => {
	const slug = params.slug ?? '';
	if (slug === '') return json({ error: 'missing_slug' }, { status: 400 });

	const baseUrl = url.searchParams.get('baseUrl')?.trim() ?? '';
	if (baseUrl === '') return json({ error: 'missing_base_url' }, { status: 400 });

	const token = getStagingApiToken();
	if (!token) {
		return json({ error: 'STAGING_API_TOKEN not configured on the server' }, { status: 503 });
	}

	try {
		const result = await getTenant(baseUrl, token, slug);
		if (result === null) return json({ error: 'tenant_not_found', slug }, { status: 404 });
		return json(result);
	} catch (err) {
		if (err instanceof StagingApiError) {
			throw error(err.status >= 400 && err.status < 600 ? err.status : 502, err.message);
		}
		throw error(502, (err as Error).message);
	}
};
