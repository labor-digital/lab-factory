import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listSeeds, loadSeedPayload, deleteLibrarySeed } from '$lib/seeds/store.js';
import { DEFAULT_CONFIG } from '$lib/pipeline/config.js';

function options(url: URL) {
	return {
		seedsRepoPath: url.searchParams.get('seedsRepoPath') ?? DEFAULT_CONFIG.seedsRepoPath,
		factoryCorePath: url.searchParams.get('factoryCorePath') ?? DEFAULT_CONFIG.factoryCorePath
	};
}

export const GET: RequestHandler = async ({ params, url }) => {
	const slug = params.slug ?? '';
	if (slug === '') throw error(400, 'missing_slug');

	const opts = options(url);
	const { entries } = await listSeeds(opts);
	const entry = entries.find((e) => e.slug === slug);
	if (!entry) throw error(404, 'seed_not_found');

	const payload = await loadSeedPayload(opts, entry.source, entry.slug);
	return json({ entry, payload });
};

export const DELETE: RequestHandler = async ({ params, url }) => {
	const slug = params.slug ?? '';
	if (slug === '') throw error(400, 'missing_slug');

	const opts = options(url);
	const { entries } = await listSeeds(opts);
	const entry = entries.find((e) => e.slug === slug);
	if (!entry) throw error(404, 'seed_not_found');
	if (entry.source !== 'library') throw error(400, 'cannot_delete_builtin_seed');

	try {
		await deleteLibrarySeed(opts, slug);
	} catch (err) {
		throw error(500, (err as Error).message);
	}
	return json({ status: 'deleted', slug });
};
