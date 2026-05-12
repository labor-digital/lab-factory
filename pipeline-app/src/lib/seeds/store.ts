import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import type {
	SeedLibraryEntry,
	SeedOrigin,
	SeedSource,
	FactorySettings,
	TenantSpec
} from '$lib/pipeline/types.js';

/**
 * Resolves the Factory monorepo root by walking up from this file's location.
 * Mirrors the pattern in `routes/api/templates/+server.ts` and
 * `lib/pipeline/executor.ts` so all path-resolving code stays consistent.
 */
function factoryMonorepoRoot(): string {
	return resolve(dirname(new URL(import.meta.url).pathname), '..', '..', '..', '..');
}

function resolveFromMonorepo(maybeRelative: string): string {
	if (maybeRelative.startsWith('/')) return maybeRelative;
	return resolve(factoryMonorepoRoot(), maybeRelative);
}

function pascalToKebab(pascal: string): string {
	return pascal.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function kebabToPascal(kebab: string): string {
	return kebab.replace(/(^|-)([a-z])/g, (_: string, __: string, c: string) => c.toUpperCase());
}

interface SeedTemplateJson {
	name?: string;
	description?: string;
	settings?: Partial<FactorySettings>;
	core_version?: string;
	record_types?: string[];
	elements?: Array<{ component?: string; data?: Record<string, unknown> }>;
}

interface SeedMetaJson {
	id?: string;
	name?: string;
	slug?: string;
	description?: string;
	coreVersion?: string;
	createdAt?: string;
	thumbnail?: string;
	source?: SeedOrigin;
	suggestedTenants?: TenantSpec[];
}

export interface SeedListResult {
	entries: SeedLibraryEntry[];
	warnings: string[];
}

export interface SeedListOptions {
	/** Either absolute, or relative to the Factory monorepo root. */
	seedsRepoPath: string;
	/** Either absolute, or relative to the Factory monorepo root. */
	factoryCorePath: string;
}

/**
 * Combined builtin + library seed listing. Builtins live in the public
 * monorepo (`factory-core/typo3-extension/SeedTemplates/`); library seeds
 * live in a private sibling repo. Missing/invalid library entries become
 * warnings rather than errors so the picker UI stays usable.
 */
export async function listSeeds(opts: SeedListOptions): Promise<SeedListResult> {
	const warnings: string[] = [];
	const builtin = await readBuiltinSeeds(opts.factoryCorePath, warnings);
	const library = await readLibrarySeeds(opts.seedsRepoPath, warnings);
	return { entries: [...builtin, ...library], warnings };
}

async function readBuiltinSeeds(factoryCorePath: string, warnings: string[]): Promise<SeedLibraryEntry[]> {
	const dir = resolve(resolveFromMonorepo(factoryCorePath), 'typo3-extension', 'SeedTemplates');
	let files: string[];
	try {
		files = await readdir(dir);
	} catch {
		warnings.push(`Builtin seeds directory not found at ${dir}.`);
		return [];
	}
	const out: SeedLibraryEntry[] = [];
	for (const file of files) {
		if (!file.endsWith('.json')) continue;
		const slug = file.replace(/\.json$/, '');
		const path = resolve(dir, file);
		try {
			const parsed: SeedTemplateJson = JSON.parse(await readFile(path, 'utf-8'));
			out.push(builtinEntry(slug, parsed, path));
		} catch (err) {
			warnings.push(`Skipped invalid builtin seed ${slug}: ${(err as Error).message}`);
		}
	}
	return out;
}

function builtinEntry(slug: string, parsed: SeedTemplateJson, payloadPath: string): SeedLibraryEntry {
	const componentSlugs = (parsed.elements ?? [])
		.map((e) => e.component)
		.filter((c): c is string => typeof c === 'string' && c !== '');
	const components = [...new Set(componentSlugs)].map(kebabToPascal);
	const recordTypes = (parsed.record_types ?? []).filter((r): r is string => typeof r === 'string');
	return {
		id: `builtin-${slug}`,
		slug,
		source: 'builtin',
		name: parsed.name ?? slug,
		description: parsed.description ?? '',
		coreVersion: parsed.core_version ?? '',
		components,
		recordTypes,
		settings: parsed.settings,
		origin: { kind: 'builtin' },
		payloadPath
	};
}

async function readLibrarySeeds(seedsRepoPath: string, warnings: string[]): Promise<SeedLibraryEntry[]> {
	const repoDir = resolveFromMonorepo(seedsRepoPath);
	const seedsDir = resolve(repoDir, 'seeds');
	let entries: string[];
	try {
		entries = await readdir(seedsDir);
	} catch {
		warnings.push(
			`Seed library not found at ${repoDir}. Clone the private labor-factory-seeds repo as a sibling of Factory to enable customer seeds.`
		);
		return [];
	}
	const out: SeedLibraryEntry[] = [];
	for (const slug of entries) {
		const dir = resolve(seedsDir, slug);
		let dirStat;
		try {
			dirStat = await stat(dir);
		} catch {
			continue;
		}
		if (!dirStat.isDirectory()) continue;

		const seedPath = resolve(dir, 'seed.json');
		const metaPath = resolve(dir, 'meta.json');
		try {
			const [seedJson, metaJson] = await Promise.all([
				readFile(seedPath, 'utf-8'),
				readFile(metaPath, 'utf-8').catch(() => '{}')
			]);
			const seed = JSON.parse(seedJson);
			const meta: SeedMetaJson = JSON.parse(metaJson);
			out.push(libraryEntry(slug, seed, meta, dir));
		} catch (err) {
			warnings.push(`Skipped malformed seed "${slug}": ${(err as Error).message}`);
		}
	}
	return out;
}

function libraryEntry(
	slug: string,
	seed: SeedTemplateJson & {
		active_components?: string[];
		active_record_types?: string[];
	},
	meta: SeedMetaJson,
	dir: string
): SeedLibraryEntry {
	const componentsFromActive = Array.isArray(seed.active_components) ? seed.active_components : null;
	const componentsFromElements = (seed.elements ?? [])
		.map((e) => e.component)
		.filter((c): c is string => typeof c === 'string' && c !== '');
	const components =
		componentsFromActive && componentsFromActive.length > 0
			? componentsFromActive.map(kebabToPascal)
			: [...new Set(componentsFromElements)].map(kebabToPascal);
	const recordTypes = Array.isArray(seed.active_record_types)
		? seed.active_record_types
		: Array.isArray(seed.record_types)
		? seed.record_types
		: [];

	return {
		id: meta.id ?? `library-${slug}`,
		slug: meta.slug ?? slug,
		source: 'library',
		name: meta.name ?? seed.name ?? slug,
		description: meta.description ?? seed.description ?? '',
		coreVersion: meta.coreVersion ?? seed.core_version ?? '',
		components,
		recordTypes,
		settings: seed.settings,
		thumbnailPath: meta.thumbnail ? resolve(dir, meta.thumbnail) : undefined,
		createdAt: meta.createdAt,
		origin: meta.source ?? { kind: 'manual' },
		suggestedTenants: Array.isArray(meta.suggestedTenants) ? meta.suggestedTenants : undefined,
		payloadPath: resolve(dir, 'seed.json')
	};
}

/**
 * Loads the raw seed JSON for a given slug. Used when actually applying a
 * seed (to read `elements`, `settings`, etc.). Returns null if not found.
 */
export async function loadSeedPayload(opts: SeedListOptions, source: SeedSource, slug: string): Promise<SeedTemplateJson | null> {
	if (source === 'builtin') {
		const path = resolve(
			resolveFromMonorepo(opts.factoryCorePath),
			'typo3-extension',
			'SeedTemplates',
			`${slug}.json`
		);
		try {
			return JSON.parse(await readFile(path, 'utf-8'));
		} catch {
			return null;
		}
	}
	const path = resolve(resolveFromMonorepo(opts.seedsRepoPath), 'seeds', slug, 'seed.json');
	try {
		return JSON.parse(await readFile(path, 'utf-8'));
	} catch {
		return null;
	}
}

export interface WriteSeedInput {
	slug: string;
	seed: Record<string, unknown>;
	meta: SeedMetaJson;
}

/**
 * Writes a new seed into the library (`seeds/<slug>/{seed.json,meta.json}`).
 * Refuses to overwrite an existing slug — the operator should explicitly
 * delete or duplicate first.
 */
export async function writeLibrarySeed(opts: SeedListOptions, input: WriteSeedInput): Promise<void> {
	const repoDir = resolveFromMonorepo(opts.seedsRepoPath);
	try {
		await stat(repoDir);
	} catch {
		throw new Error(`Seeds repo not found at ${repoDir}. Clone labor-factory-seeds first.`);
	}
	const dir = resolve(repoDir, 'seeds', input.slug);
	try {
		await stat(dir);
		throw new Error(`Seed slug "${input.slug}" already exists. Pick a unique slug or delete first.`);
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
	}
	await mkdir(dir, { recursive: true });
	await writeFile(resolve(dir, 'seed.json'), JSON.stringify(input.seed, null, 2) + '\n', 'utf-8');
	await writeFile(resolve(dir, 'meta.json'), JSON.stringify(input.meta, null, 2) + '\n', 'utf-8');
}

/**
 * Removes a library seed. Refuses on builtins.
 */
export async function deleteLibrarySeed(opts: SeedListOptions, slug: string): Promise<void> {
	const dir = resolve(resolveFromMonorepo(opts.seedsRepoPath), 'seeds', slug);
	try {
		await stat(dir);
	} catch {
		throw new Error(`Seed "${slug}" not found in library.`);
	}
	const { rm } = await import('node:fs/promises');
	await rm(dir, { recursive: true, force: true });
}

export { pascalToKebab, kebabToPascal, factoryMonorepoRoot, resolveFromMonorepo };
