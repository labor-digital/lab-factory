import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { loadSeedPayloadFromSupabase } from '$lib/seeds/supabaseStore.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const slug = params.slug;
	const [seedResult, clientsRes, manifest] = await Promise.all([
		loadSeedPayloadFromSupabase(locals.supabase, slug),
		locals.supabase.from('clients').select('id, slug, display_name').order('display_name'),
		readManifest()
	]);

	if (!seedResult) throw error(404, 'seed_not_found');

	return {
		seed: seedResult.entry,
		payload: seedResult.payload,
		clients: clientsRes.data ?? [],
		manifest
	};
};

async function readManifest(): Promise<Record<string, unknown> | null> {
	const here = dirname(new URL(import.meta.url).pathname);
	const root = resolve(here, '..', '..', '..', '..', '..');
	try {
		return JSON.parse(await readFile(resolve(root, 'factory-core', 'manifest.json'), 'utf-8'));
	} catch {
		return null;
	}
}
