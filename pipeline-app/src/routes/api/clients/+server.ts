import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

export const GET: RequestHandler = async ({ locals }) => {
	const { data, error: err } = await locals.supabase
		.from('clients')
		.select('*')
		.order('display_name', { ascending: true });
	if (err) throw error(500, err.message);
	return json({ entries: data ?? [] });
};

interface PostBody {
	slug: string;
	displayName: string;
	notes?: string;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	let body: PostBody;
	try {
		body = (await request.json()) as PostBody;
	} catch {
		throw error(400, 'invalid_json');
	}
	if (!body.slug || !SLUG_PATTERN.test(body.slug)) throw error(400, 'invalid_slug');
	if (!body.displayName || body.displayName.trim() === '') throw error(400, 'missing_display_name');

	const { data, error: err } = await locals.supabase
		.from('clients')
		.insert({ slug: body.slug, display_name: body.displayName, notes: body.notes ?? null })
		.select()
		.single();
	if (err) throw error(500, err.message);
	return json({ status: 'created', entry: data }, { status: 201 });
};
