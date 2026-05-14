import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface PatchBody {
	displayName?: string;
	notes?: string | null;
}

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const id = params.id ?? '';
	if (id === '') throw error(400, 'missing_id');
	let body: PatchBody;
	try {
		body = (await request.json()) as PatchBody;
	} catch {
		throw error(400, 'invalid_json');
	}
	const patch: Record<string, unknown> = {};
	if (body.displayName !== undefined) patch.display_name = body.displayName;
	if (body.notes !== undefined) patch.notes = body.notes;

	const { data, error: err } = await locals.supabase
		.from('clients')
		.update(patch)
		.eq('id', id)
		.select()
		.single();
	if (err) throw error(500, err.message);
	return json({ status: 'updated', entry: data });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const id = params.id ?? '';
	if (id === '') throw error(400, 'missing_id');
	const { error: err } = await locals.supabase.from('clients').delete().eq('id', id);
	if (err) throw error(500, err.message);
	return json({ status: 'deleted', id });
};
