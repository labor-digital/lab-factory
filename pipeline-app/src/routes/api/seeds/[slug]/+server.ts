import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteSeed, loadSeedPayloadFromSupabase, updateSeed } from '$lib/seeds/supabaseStore.js';
import type { SeedPayload, SeedStatus } from '$lib/supabase/types.js';
import type { TenantSpec } from '$lib/pipeline/types.js';

export const GET: RequestHandler = async ({ params, locals }) => {
	const slug = params.slug ?? '';
	if (slug === '') throw error(400, 'missing_slug');
	const result = await loadSeedPayloadFromSupabase(locals.supabase, slug);
	if (!result) throw error(404, 'seed_not_found');
	return json(result);
};

interface PatchBody {
	name?: string;
	description?: string;
	coreVersion?: string;
	payload?: SeedPayload;
	suggestedTenants?: TenantSpec[];
	clientId?: string | null;
	status?: SeedStatus;
}

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const slug = params.slug ?? '';
	if (slug === '') throw error(400, 'missing_slug');
	let body: PatchBody;
	try {
		body = (await request.json()) as PatchBody;
	} catch {
		throw error(400, 'invalid_json');
	}
	try {
		const entry = await updateSeed(locals.supabase, slug, body);
		return json({ status: 'updated', entry });
	} catch (err) {
		const msg = (err as Error).message;
		const code = msg === 'seed_not_found' ? 404 : msg === 'cannot_modify_builtin_seed' ? 400 : 500;
		throw error(code, msg);
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const slug = params.slug ?? '';
	if (slug === '') throw error(400, 'missing_slug');
	try {
		await deleteSeed(locals.supabase, slug);
	} catch (err) {
		const msg = (err as Error).message;
		const code = msg === 'seed_not_found' ? 404 : msg === 'cannot_delete_builtin_seed' ? 400 : 500;
		throw error(code, msg);
	}
	return json({ status: 'deleted', slug });
};
