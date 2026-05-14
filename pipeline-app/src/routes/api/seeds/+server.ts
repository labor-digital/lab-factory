import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSeed, listSeedsFromSupabase } from '$lib/seeds/supabaseStore.js';
import type { SeedOrigin, TenantSpec } from '$lib/pipeline/types.js';
import type { SeedPayload, SeedStatus } from '$lib/supabase/types.js';

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

export const GET: RequestHandler = async ({ url, locals }) => {
	const statusParam = url.searchParams.get('status') as SeedStatus | 'all' | null;
	const clientIdParam = url.searchParams.get('clientId');
	const { entries, warnings } = await listSeedsFromSupabase(locals.supabase, {
		status: statusParam ?? 'all',
		clientId: clientIdParam === null ? undefined : clientIdParam === '' ? null : clientIdParam
	});
	return json({ entries, warnings });
};

interface PostBody {
	slug: string;
	name?: string;
	description?: string;
	coreVersion?: string;
	seed: SeedPayload;
	origin?: SeedOrigin;
	suggestedTenants?: TenantSpec[];
	clientId?: string | null;
	status?: SeedStatus;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	let body: PostBody;
	try {
		body = (await request.json()) as PostBody;
	} catch {
		throw error(400, 'invalid_json');
	}
	if (!body.slug || !SLUG_PATTERN.test(body.slug)) throw error(400, 'invalid_slug');
	if (!body.seed || typeof body.seed !== 'object') throw error(400, 'missing_seed_payload');

	try {
		const entry = await createSeed(locals.supabase, {
			slug: body.slug,
			name: body.name ?? body.slug,
			description: body.description ?? '',
			coreVersion: body.coreVersion ?? body.seed.core_version ?? '',
			payload: body.seed,
			origin: body.origin,
			suggestedTenants: body.suggestedTenants,
			clientId: body.clientId ?? null,
			status: body.status ?? 'draft'
		});
		return json({ status: 'created', entry }, { status: 201 });
	} catch (err) {
		throw error(500, (err as Error).message);
	}
};
