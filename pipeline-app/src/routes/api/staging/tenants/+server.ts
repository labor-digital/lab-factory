import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { createTenant, StagingApiError, type CreateTenantRequest } from '$lib/staging/api.js';

function getStagingApiToken(): string | null {
	return env.STAGING_API_TOKEN?.trim() ? env.STAGING_API_TOKEN : null;
}

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
