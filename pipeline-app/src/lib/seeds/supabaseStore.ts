import type { SupabaseClient } from '@supabase/supabase-js';
import type {
	SeedLibraryEntry,
	SeedOrigin,
	SeedSource,
	TenantSpec
} from '$lib/pipeline/types.js';
import type { SeedRow, SeedPayload, SeedStatus } from '$lib/supabase/types.js';

/**
 * Supabase-backed replacement for `lib/seeds/store.ts`. Reads + writes go
 * through `event.locals.supabase` (per-request client with the user's JWT)
 * so RLS + auth.uid() apply. Payload (factory.json-shaped) lives in
 * `seeds.payload jsonb` — no on-disk JSON files anymore (DL #017).
 */

export interface SupabaseSeedListOptions {
	/** Filter: only `published`, only `draft`, or `all`. Default `all`. */
	status?: SeedStatus | 'all';
	clientId?: string | null;
}

function rowToEntry(row: SeedRow): SeedLibraryEntry {
	const source: SeedSource = row.immutable ? 'builtin' : 'library';
	const payload = row.payload ?? ({ active_components: [], active_record_types: [], settings: {} } as SeedPayload);
	const components = Array.isArray(payload.active_components) ? payload.active_components : [];
	const recordTypes = Array.isArray(payload.active_record_types) ? payload.active_record_types : [];
	return {
		id: row.id,
		name: row.name,
		slug: row.slug,
		source,
		description: row.description,
		coreVersion: row.core_version,
		components,
		recordTypes,
		settings: payload.settings,
		thumbnailPath: row.thumbnail_path ?? undefined,
		createdAt: row.created_at,
		lastUsedAt: row.last_used_at ?? undefined,
		origin: (row.origin as SeedOrigin) ?? { kind: 'manual' },
		status: row.status,
		clientId: row.client_id ?? null,
		suggestedTenants: Array.isArray(row.suggested_tenants) ? (row.suggested_tenants as TenantSpec[]) : undefined
	};
}

export async function listSeedsFromSupabase(
	supabase: SupabaseClient,
	opts: SupabaseSeedListOptions = {}
): Promise<{ entries: SeedLibraryEntry[]; warnings: string[] }> {
	let query = supabase
		.from('seeds')
		.select('*')
		.order('immutable', { ascending: false })
		.order('updated_at', { ascending: false });

	const status = opts.status ?? 'all';
	if (status !== 'all') query = query.eq('status', status);
	if (opts.clientId !== undefined) {
		query = opts.clientId === null ? query.is('client_id', null) : query.eq('client_id', opts.clientId);
	}

	const { data, error } = await query;
	if (error) return { entries: [], warnings: [`Seed query failed: ${error.message}`] };

	return { entries: ((data ?? []) as SeedRow[]).map(rowToEntry), warnings: [] };
}

export async function loadSeedPayloadFromSupabase(
	supabase: SupabaseClient,
	slug: string
): Promise<{ entry: SeedLibraryEntry; payload: SeedPayload } | null> {
	const { data, error } = await supabase.from('seeds').select('*').eq('slug', slug).maybeSingle();
	if (error || !data) return null;
	const row = data as SeedRow;
	return { entry: rowToEntry(row), payload: row.payload };
}

export interface CreateSeedInput {
	slug: string;
	name: string;
	description?: string;
	coreVersion: string;
	payload: SeedPayload;
	origin?: SeedOrigin;
	suggestedTenants?: TenantSpec[];
	clientId?: string | null;
	status?: SeedStatus;
}

export async function createSeed(
	supabase: SupabaseClient,
	input: CreateSeedInput
): Promise<SeedLibraryEntry> {
	const row = {
		slug: input.slug,
		name: input.name,
		description: input.description ?? '',
		status: input.status ?? 'draft',
		origin: input.origin ?? { kind: 'manual' as const },
		core_version: input.coreVersion,
		payload: input.payload,
		suggested_tenants: input.suggestedTenants ?? [],
		client_id: input.clientId ?? null,
		immutable: false
	};
	const { data, error } = await supabase.from('seeds').insert(row).select().single();
	if (error) throw new Error(error.message);
	const inserted = data as SeedRow;
	await supabase.from('seed_audits').insert({ seed_id: inserted.id, action: 'create', after: inserted });
	return rowToEntry(inserted);
}

export interface UpdateSeedInput {
	name?: string;
	description?: string;
	coreVersion?: string;
	payload?: SeedPayload;
	suggestedTenants?: TenantSpec[];
	clientId?: string | null;
	status?: SeedStatus;
}

export async function updateSeed(
	supabase: SupabaseClient,
	slug: string,
	input: UpdateSeedInput
): Promise<SeedLibraryEntry> {
	const { data: beforeRaw } = await supabase.from('seeds').select('*').eq('slug', slug).maybeSingle();
	if (!beforeRaw) throw new Error('seed_not_found');
	const before = beforeRaw as SeedRow;
	if (before.immutable) throw new Error('cannot_modify_builtin_seed');

	const patch: Record<string, unknown> = {};
	if (input.name !== undefined) patch.name = input.name;
	if (input.description !== undefined) patch.description = input.description;
	if (input.coreVersion !== undefined) patch.core_version = input.coreVersion;
	if (input.payload !== undefined) patch.payload = input.payload;
	if (input.suggestedTenants !== undefined) patch.suggested_tenants = input.suggestedTenants;
	if (input.clientId !== undefined) patch.client_id = input.clientId;
	if (input.status !== undefined) patch.status = input.status;

	const { data: afterRaw, error } = await supabase.from('seeds').update(patch).eq('slug', slug).select().single();
	if (error) throw new Error(error.message);
	const after = afterRaw as SeedRow;

	const action = input.status === 'published' && before.status !== 'published'
		? 'publish'
		: input.status === 'archived'
			? 'archive'
			: 'update';
	await supabase.from('seed_audits').insert({ seed_id: after.id, action, before, after });
	return rowToEntry(after);
}

export async function deleteSeed(supabase: SupabaseClient, slug: string): Promise<void> {
	const { data: beforeRaw } = await supabase.from('seeds').select('*').eq('slug', slug).maybeSingle();
	if (!beforeRaw) throw new Error('seed_not_found');
	const before = beforeRaw as SeedRow;
	if (before.immutable) throw new Error('cannot_delete_builtin_seed');

	const { error } = await supabase.from('seeds').delete().eq('slug', slug);
	if (error) throw new Error(error.message);
	await supabase.from('seed_audits').insert({ seed_id: before.id, action: 'delete', before });
}

export async function touchLastUsed(supabase: SupabaseClient, slug: string): Promise<void> {
	await supabase.from('seeds').update({ last_used_at: new Date().toISOString() }).eq('slug', slug);
}
