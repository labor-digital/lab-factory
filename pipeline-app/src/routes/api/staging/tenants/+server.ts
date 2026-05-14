import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { createTenant, listTenants, StagingApiError, type CreateTenantRequest } from '$lib/staging/api.js';

function getStagingApiToken(): string | null {
	return env.STAGING_API_TOKEN?.trim() ? env.STAGING_API_TOKEN : null;
}

async function resolveBaseUrl(locals: App.Locals, override: string | null): Promise<string> {
	if (override && override.trim()) return override.trim();
	const { data } = await locals.supabase
		.from('team_defaults')
		.select('staging_api_base_url')
		.limit(1)
		.maybeSingle();
	return data?.staging_api_base_url?.trim() ?? '';
}

export const GET: RequestHandler = async ({ url, locals }) => {
	const baseUrl = await resolveBaseUrl(locals, url.searchParams.get('baseUrl'));
	if (!baseUrl) throw error(400, 'staging_base_url_missing — set team_defaults.staging_api_base_url');

	const token = getStagingApiToken();
	if (!token) throw error(503, 'STAGING_API_TOKEN not configured on the server');

	try {
		const tenants = await listTenants(baseUrl, token);
		return json({ tenants, baseUrl });
	} catch (err) {
		if (err instanceof StagingApiError) {
			throw error(err.status >= 400 && err.status < 600 ? err.status : 502, err.message);
		}
		throw error(502, (err as Error).message);
	}
};

interface RequestBody extends CreateTenantRequest {
	baseUrl: string;
}

export const POST: RequestHandler = async ({ request }) => {
	let body: RequestBody;
	try {
		body = (await request.json()) as RequestBody;
	} catch {
		return json({ error: 'invalid_json' }, { status: 400 });
	}

	if (!body.baseUrl) return json({ error: 'missing_base_url' }, { status: 400 });
	if (!body.slug) return json({ error: 'missing_slug' }, { status: 400 });
	if (!body.domain) return json({ error: 'missing_domain' }, { status: 400 });
	if (!body.adminEmail) return json({ error: 'missing_admin_email' }, { status: 400 });

	const token = getStagingApiToken();
	if (!token) {
		return json({ error: 'STAGING_API_TOKEN not configured on the server' }, { status: 503 });
	}

	const { baseUrl, ...tenant } = body;
	try {
		const result = await createTenant(baseUrl, token, tenant);
		return json(result, { status: 201 });
	} catch (err) {
		if (err instanceof StagingApiError) {
			throw error(err.status >= 400 && err.status < 600 ? err.status : 502, err.message);
		}
		throw error(502, (err as Error).message);
	}
};
