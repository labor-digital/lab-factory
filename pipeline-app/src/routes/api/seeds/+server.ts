import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listSeeds, writeLibrarySeed } from '$lib/seeds/store.js';
import { DEFAULT_CONFIG } from '$lib/pipeline/config.js';
import type { SeedOrigin } from '$lib/pipeline/types.js';

function options(url: URL) {
	return {
		seedsRepoPath: url.searchParams.get('seedsRepoPath') ?? DEFAULT_CONFIG.seedsRepoPath,
		factoryCorePath: url.searchParams.get('factoryCorePath') ?? DEFAULT_CONFIG.factoryCorePath
	};
}

export const GET: RequestHandler = async ({ url }) => {
	const { entries, warnings } = await listSeeds(options(url));
	return json({ entries, warnings });
};

interface PostBody {
	slug: string;
	name?: string;
	description?: string;
	coreVersion?: string;
	seed: Record<string, unknown>;
	origin?: SeedOrigin;
}

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

export const POST: RequestHandler = async ({ request, url }) => {
	let body: PostBody;
	try {
		body = (await request.json()) as PostBody;
	} catch {
		throw error(400, 'invalid_json');
	}
	if (!body.slug || !SLUG_PATTERN.test(body.slug)) {
		throw error(400, 'invalid_slug');
	}
	if (!body.seed || typeof body.seed !== 'object') {
		throw error(400, 'missing_seed_payload');
	}

	const meta = {
		id: `library-${body.slug}`,
		slug: body.slug,
		name: body.name ?? body.slug,
		description: body.description ?? '',
		coreVersion: body.coreVersion ?? '',
		createdAt: new Date().toISOString(),
		source: body.origin ?? { kind: 'manual' as const }
	};

	try {
		await writeLibrarySeed(options(url), { slug: body.slug, seed: body.seed, meta });
	} catch (err) {
		throw error(500, (err as Error).message);
	}

	return json({ status: 'created', slug: body.slug }, { status: 201 });
};
