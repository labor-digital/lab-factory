#!/usr/bin/env tsx
/**
 * One-shot migration: read all seed JSON files from disk (builtin in
 * factory-core + optional library repo) and upsert them into the Supabase
 * `seeds` table. Idempotent — keyed on `slug`.
 *
 * Run from the pipeline-app directory:
 *
 *   tsx --env-file=.env scripts/migrate-seeds-to-supabase.ts
 *
 * Requires SUPABASE_URL and SUPABASE_SECRET_KEY in the environment.
 *
 * Flags:
 *   --dry-run     Report what would be inserted, don't write.
 *   --library DIR Override the labor-factory-seeds path
 *                 (default: ../labor-factory-seeds relative to monorepo root).
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MONOREPO_ROOT = resolve(__dirname, '..', '..');
const FACTORY_CORE = resolve(MONOREPO_ROOT, 'factory-core');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const libIdx = args.indexOf('--library');
const libraryPath = libIdx >= 0 ? args[libIdx + 1] : resolve(MONOREPO_ROOT, '..', 'labor-factory-seeds');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
	console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY in environment.');
	console.error('Run with: tsx --env-file=.env scripts/migrate-seeds-to-supabase.ts');
	process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
	auth: { autoRefreshToken: false, persistSession: false }
});

interface SeedRowInsert {
	slug: string;
	name: string;
	description: string;
	status: 'draft' | 'published';
	origin: { kind: string; [k: string]: unknown };
	core_version: string;
	payload: Record<string, unknown>;
	suggested_tenants: unknown[];
	immutable: boolean;
}

function kebabToPascal(kebab: string): string {
	return kebab.replace(/(^|-)([a-z])/g, (_, __, c: string) => c.toUpperCase());
}

async function readBuiltins(): Promise<SeedRowInsert[]> {
	const dir = resolve(FACTORY_CORE, 'typo3-extension', 'SeedTemplates');
	let files: string[];
	try {
		files = await readdir(dir);
	} catch {
		console.warn(`No builtin seeds found at ${dir}`);
		return [];
	}
	const out: SeedRowInsert[] = [];
	for (const file of files) {
		if (!file.endsWith('.json')) continue;
		const slug = file.replace(/\.json$/, '');
		try {
			const parsed = JSON.parse(await readFile(resolve(dir, file), 'utf-8'));
			out.push({
				slug: `builtin-${slug}`,
				name: parsed.name ?? slug,
				description: parsed.description ?? '',
				status: 'published',
				origin: { kind: 'builtin' },
				core_version: parsed.core_version ?? '^0.1',
				payload: parsed,
				suggested_tenants: [],
				immutable: true
			});
		} catch (err) {
			console.warn(`Skipped builtin ${slug}: ${(err as Error).message}`);
		}
	}
	return out;
}

async function readLibrary(): Promise<SeedRowInsert[]> {
	const seedsDir = resolve(libraryPath, 'seeds');
	let entries: string[];
	try {
		entries = await readdir(seedsDir);
	} catch {
		console.warn(`No library seeds found at ${seedsDir} — skipping.`);
		return [];
	}
	const out: SeedRowInsert[] = [];
	for (const slug of entries) {
		const dir = resolve(seedsDir, slug);
		try {
			const s = await stat(dir);
			if (!s.isDirectory()) continue;
			const [seedJson, metaJson] = await Promise.all([
				readFile(resolve(dir, 'seed.json'), 'utf-8'),
				readFile(resolve(dir, 'meta.json'), 'utf-8').catch(() => '{}')
			]);
			const seed = JSON.parse(seedJson);
			const meta = JSON.parse(metaJson);
			out.push({
				slug: meta.slug ?? slug,
				name: meta.name ?? seed.name ?? slug,
				description: meta.description ?? seed.description ?? '',
				status: 'published',
				origin: meta.source ?? { kind: 'manual' },
				core_version: seed.core_version ?? meta.coreVersion ?? '^0.2',
				payload: seed,
				suggested_tenants: Array.isArray(meta.suggestedTenants) ? meta.suggestedTenants : [],
				immutable: false
			});
		} catch (err) {
			console.warn(`Skipped library "${slug}": ${(err as Error).message}`);
		}
	}
	return out;
}

async function main() {
	const [builtins, library] = await Promise.all([readBuiltins(), readLibrary()]);
	const rows = [...builtins, ...library];
	console.log(`Found ${builtins.length} builtin + ${library.length} library = ${rows.length} seeds.`);

	if (dryRun) {
		for (const r of rows) console.log(`  - ${r.slug} (${r.origin.kind}, ${r.core_version})`);
		console.log('Dry run — no writes.');
		return;
	}

	const { error } = await supabase.from('seeds').upsert(rows, { onConflict: 'slug' });
	if (error) {
		console.error('Upsert failed:', error);
		process.exit(1);
	}
	console.log(`Upserted ${rows.length} seeds.`);

	// Silence unused warning on the kebab helper — kept for future builtins
	// whose slug needs componentisation. Remove once a use lands.
	void kebabToPascal;
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
