import type { FactorySettings, SeedOrigin, TenantSpec } from '$lib/pipeline/types';

export type SeedStatus = 'draft' | 'published' | 'archived';
export type Environment = 'local' | 'staging' | 'prod';

export interface ClientRow {
	id: string;
	slug: string;
	display_name: string;
	notes: string | null;
	created_at: string;
	created_by: string | null;
}

export interface SeedRow {
	id: string;
	slug: string;
	name: string;
	description: string;
	status: SeedStatus;
	origin: SeedOrigin;
	core_version: string;
	payload: SeedPayload;
	suggested_tenants: TenantSpec[];
	thumbnail_path: string | null;
	client_id: string | null;
	immutable: boolean;
	created_at: string;
	updated_at: string;
	created_by: string | null;
	last_used_at: string | null;
}

/** factory.json-shaped payload stored in seeds.payload (jsonb). */
export interface SeedPayload {
	core_version?: string;
	name?: string;
	description?: string;
	active_components: string[];
	active_record_types: string[];
	settings: Partial<FactorySettings>;
	elements?: unknown[];
	[key: string]: unknown;
}

export interface AppliedSeedRow {
	id: string;
	environment: Environment;
	project_name: string | null;
	tenant_slug: string | null;
	seed_id: string | null;
	active_components: string[];
	active_record_types: string[];
	settings: Partial<FactorySettings>;
	factory_core_version: string | null;
	applied_at: string;
	applied_by: string | null;
}

export interface SeedAuditRow {
	id: number;
	seed_id: string;
	at: string;
	user_id: string | null;
	action: 'create' | 'update' | 'publish' | 'archive' | 'delete';
	before: SeedRow | null;
	after: SeedRow | null;
}

export interface TeamDefaultsRow {
	id: string;
	bitbucket_workspace: string;
	bitbucket_project_key: string;
	fly_org_slug: string;
	fly_region: string;
	fly_machine_size: string;
	staging_api_base_url: string;
	updated_at: string;
}

export interface Database {
	public: {
		Tables: {
			clients: { Row: ClientRow; Insert: Partial<ClientRow> & Pick<ClientRow, 'slug' | 'display_name'>; Update: Partial<ClientRow> };
			seeds: { Row: SeedRow; Insert: Partial<SeedRow> & Pick<SeedRow, 'slug' | 'name' | 'core_version' | 'payload'>; Update: Partial<SeedRow> };
			applied_seeds: { Row: AppliedSeedRow; Insert: Partial<AppliedSeedRow> & Pick<AppliedSeedRow, 'environment'>; Update: Partial<AppliedSeedRow> };
			seed_audits: { Row: SeedAuditRow; Insert: Partial<SeedAuditRow> & Pick<SeedAuditRow, 'seed_id' | 'action'>; Update: Partial<SeedAuditRow> };
			team_defaults: { Row: TeamDefaultsRow; Insert: Partial<TeamDefaultsRow>; Update: Partial<TeamDefaultsRow> };
		};
	};
}
