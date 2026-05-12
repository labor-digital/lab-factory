export type PhaseId = 0 | 1 | 2 | 3 | 4;
export type StepStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

export type TailwindColor =
	| 'red' | 'orange' | 'amber' | 'yellow' | 'lime' | 'green'
	| 'emerald' | 'teal' | 'cyan' | 'sky' | 'blue' | 'indigo'
	| 'violet' | 'purple' | 'fuchsia' | 'pink' | 'rose';

export type NeutralColor = 'slate' | 'gray' | 'zinc' | 'neutral' | 'stone';

export type ColorMode = 'system' | 'light' | 'dark';

/** A Tailwind color name or a CSS hex value (e.g. '#8B2500'). */
export type ColorValue = TailwindColor | NeutralColor | (string & {});

export interface FactorySettings {
	colors: {
		primary: ColorValue;
		secondary: ColorValue;
		success: ColorValue;
		info: ColorValue;
		warning: ColorValue;
		error: ColorValue;
		neutral: ColorValue;
	};
	radius: string;
	fonts: {
		sans: string;
		mono: string;
	};
	breakpoints: Record<string, string>;
	colorMode: ColorMode;
	placeholderImageBaseUrl: string;
}

export interface SeedTemplate {
	name: string;
	slug: string;
	description: string;
	components: string[];
	recordTypes?: string[];
	settings?: Partial<FactorySettings>;
	/** Composer-style range, e.g. "^0.2". Populated when the seed declares one (library seeds always do; older builtins may not). */
	coreVersion?: string;
	/** "builtin" (ships with factory-core) or "library" (private seed repo). Populated by /api/seeds; unset by the legacy /api/templates response. */
	source?: SeedSource;
}

/**
 * Where a seed entry came from. `builtin` are the synthetic seeds that ship
 * inside `factory-core/typo3-extension/SeedTemplates/` — safe to live in the
 * public monorepo. `library` are AI/customer-derived seeds that live in the
 * private `labor-factory-seeds` Bitbucket repo.
 */
export type SeedSource = 'builtin' | 'library';

/**
 * Origin metadata captured when a seed is added to the library. Helps the AI
 * chain be accountable (which Figma frame, which prompt, which model).
 */
export interface SeedOrigin {
	kind: 'figma' | 'ai-prompt' | 'manual' | 'builtin';
	figmaUrl?: string;
	prompt?: string;
	model?: string;
}

/**
 * One row in the unified seed picker (builtin + library combined). Surfaced
 * by `GET /api/seeds`. The actual seed payload is loaded on demand from
 * `payloadPath` (library) or built into the entry (builtin).
 */
export interface SeedLibraryEntry {
	id: string;
	name: string;
	slug: string;
	source: SeedSource;
	description: string;
	coreVersion: string;
	components: string[];
	recordTypes: string[];
	settings?: Partial<FactorySettings>;
	thumbnailPath?: string;
	createdAt?: string;
	lastUsedAt?: string;
	origin: SeedOrigin;
	/** Absolute path to the on-disk seed.json (library only). */
	payloadPath?: string;
}

/**
 * What gets persisted as the "currently applied" seed for a project. Used by
 * `diffSeeds()` to decide between theming-only hot-swap and full DB reseed.
 */
export interface AppliedSeedSnapshot {
	projectName: string;
	seedSlug: string;
	source: SeedSource;
	activeComponents: string[];
	activeRecordTypes: string[];
	settings: Partial<FactorySettings>;
	appliedAt: string;
}

/**
 * Output of the seed diff. `mode` drives which reseed path runs;
 * `reasons` is shown to the operator so the auto-decision is auditable.
 */
export interface SeedDiff {
	mode: 'no-op' | 'theming-only' | 'db-reseed';
	reasons: string[];
}

/**
 * Body for `POST /api/reseed`. `force` lets the operator override the auto-
 * detected mode (e.g. force `db-reseed` to clear stale demo content even
 * when only theming changed).
 */
export interface ReseedRequest {
	projectName: string;
	seedSlug: string;
	source: SeedSource;
	force?: 'theming-only' | 'db-reseed' | null;
}

/**
 * Where a pipeline run targets. `local` is today's full Docker stack on the
 * operator's machine. `staging` posts the tenant to the deployed multitenant
 * API + triggers a Fly.io frontend deploy. `prod` is a placeholder until the
 * production shared-tenant instance is provisioned (DL #015 keeps it in the
 * UI as a disabled segment).
 */
export type TargetEnvironment = 'local' | 'staging' | 'prod';

/**
 * Subset of `GET /api/multitenant/version` that pipeline-app actually consumes
 * for compatibility checks and badge display.
 */
export interface DeployedVersionInfo {
	factoryCoreVersion: string;
	factoryMultitenantApiVersion: string;
	typo3Version: string;
	supportedSeedSchema: { min: string; max: string };
}

export interface VersionCompatResult {
	deployed: DeployedVersionInfo | null;
	seedConstraint: string;
	matches: boolean;
	reason: string;
	remediation?: { composerRequire: string; renovateLinkHint: string };
}

export type DeploymentMode = 'standalone' | 'shared-tenant';

/**
 * Where a scaffolded client's Nuxt frontend is hosted.
 *
 * - `fly-io`: default. Plain Node containers on Fly.io with scale-to-zero.
 *   Deployed via Bitbucket Pipelines calling `flyctl deploy --remote-only`.
 * - `aws-ecs`: opt-in. Per-client or shared ECS task on Labor's existing cluster.
 *   Shipped as a reference Bitbucket Pipelines workflow; see DL #012 Part A.
 */
export type FrontendHostingTarget = 'fly-io' | 'aws-ecs';

/**
 * Fly.io machine sizes we support as a menu. Named per Fly's catalog
 * (`shared-cpu-<vcpu>x-<mb>`). 512 MB is sufficient for a typical Nuxt SSR
 * client site; 1 GB gives headroom for bigger bundles or concurrent SSR.
 */
export type FlyIoMachineSize = 'shared-cpu-1x-512' | 'shared-cpu-2x-1024';

/**
 * Where a scaffolded client project pulls `factory-core` from.
 *
 * - `local`: path repo + symlinks to the monorepo's `factory-core/` (today's
 *   default). Used for internal Factory development against the live sources.
 * - `npm`: published packages — `composer require labor-digital/factory-core`
 *   and `npm install @labor-digital/factory-nuxt-layer`. Used for real
 *   client repos that ship outside the monorepo.
 */
export type FactoryCoreSource = 'local' | 'npm';

/**
 * One tenant inside the shared TYPO3 instance. Multiple TenantSpec entries
 * under one PipelineConfig represent a single client owning several sites
 * (see Design Log #011). Each spec becomes one `config/sites/{slug}/` tree
 * plus one call to `factory:tenant:provision` in the shared instance.
 */
export interface TenantSpec {
	slug: string;
	domain: string;
	displayName: string;
	activeComponents: string[];
	activeRecordTypes: string[];
	adminEmail: string;
}

export interface PipelineConfig {
	labCliBin: string;
	factoryCorePath: string;
	testProjectName: string;
	componentsToTest: string[];
	activeRecordTypes: string[];
	homeElements: string[];
	seedTemplate: string;
	typo3AdminUser: string;
	typo3AdminPassword: string;
	appEncryptionKey: string;
	appInstallToolPassword: string;
	typo3ApiBaseUrl: string;
	languages: string[];
	includePhase3: boolean;
	sudoPassword: string;
	settings: FactorySettings;
	includePhase4: boolean;
	bitbucketWorkspace: string;
	bitbucketProjectKey: string;
	bitbucketRepoSlug: string;
	/**
	 * When publishing in standalone mode, include the backend in the repo.
	 * Default is true for backwards compatibility. Set false to publish only
	 * the frontend — appropriate when the backend lives in a shared instance
	 * or is managed elsewhere.
	 */
	publishBackend: boolean;
	/**
	 * 'standalone' — today's default, one full Docker stack per client with
	 * a project-root `factory.json`.
	 *
	 * 'shared-tenant' — provision one or more tenants inside an existing
	 * shared TYPO3 instance. Writes `config/sites/{slug}/` entries to
	 * `sharedInstanceRepoPath` and expects the operator to run
	 * `factory:tenant:provision` inside the running instance for DB records.
	 */
	/**
	 * Where scaffolded client repos pull factory-core from. Defaults to
	 * `local` for internal dev against the monorepo sources; switch to `npm`
	 * for real client projects consuming the published packages.
	 */
	factoryCoreSource: FactoryCoreSource;
	/** Constraint for `composer require labor-digital/factory-core` in npm mode. */
	factoryCoreComposerConstraint: string;
	/** Constraint for `npm install @labor-digital/factory-nuxt-layer` in npm mode. */
	factoryCoreNpmConstraint: string;
	deploymentMode: DeploymentMode;
	/** Shared-tenant mode only: absolute path to the shared instance's repo checkout. */
	sharedInstanceRepoPath: string;
	/** Shared-tenant mode only: one or more tenants owned by this client. */
	tenants: TenantSpec[];
	/** Shared-tenant mode only: bring the stack up (`docker compose up -d --wait`) if it isn't running. */
	autoStartStack: boolean;
	/** Shared-tenant mode only: docker-compose service name to target for `exec` (defaults to `app`). */
	stackServiceName: string;
	/**
	 * Frontend hosting target for scaffolded client Nuxt apps. Default `fly-io`.
	 * Applies to both standalone and shared-tenant frontend publishing paths.
	 * See DL #012 Amendment 2026-04.
	 */
	frontendHostingTarget: FrontendHostingTarget;
	/** Fly.io organization slug (e.g. `labor-digital`). Required when target is `fly-io`. */
	flyIoOrgSlug: string;
	/** Fly.io region code (e.g. `ams`, `fra`). Sets `primary_region` in fly.toml. */
	flyIoRegion: string;
	/** Fly.io machine size for the primary VM block in fly.toml. */
	flyIoMachineSize: FlyIoMachineSize;
	/**
	 * Path to the private seeds repo (`labor-factory-seeds`). Sibling-clone
	 * convention — see DL #014. When the path is missing, the seed picker
	 * still lists builtin seeds and surfaces a banner. Never committed to
	 * the public Factory monorepo.
	 */
	seedsRepoPath: string;
	/**
	 * Where a pipeline run targets — see DL #015. `local` is the existing
	 * full Docker scaffold; `staging` posts the tenant to the deployed
	 * multitenant API + Fly.io deploy; `prod` is disabled until 1.0.
	 */
	targetEnvironment: TargetEnvironment;
	/**
	 * Base URL of the deployed multitenant TYPO3 (e.g.
	 * `https://staging.labor-factory.example`). The bearer token never
	 * touches this object — it lives in the SvelteKit server's env.
	 */
	stagingApiBaseUrl: string;
	/** Server reports whether STAGING_API_TOKEN is set. Read-only from the client. */
	stagingApiTokenConfigured: boolean;
	/** When true, allow a staging run despite a version mismatch (tagged in the SSE log). */
	forceVersionMismatch: boolean;
}

export interface StepEvent {
	type:
		| 'phase:start'
		| 'phase:end'
		| 'step:start'
		| 'step:output'
		| 'step:pass'
		| 'step:fail'
		| 'pipeline:done'
		| 'pipeline:error';
	stepId?: string;
	phase?: PhaseId;
	phaseLabel?: string;
	data?: string;
	timestamp: number;
}

export interface PhaseInfo {
	id: PhaseId;
	label: string;
	icon: string;
}

export const PHASES: PhaseInfo[] = [
	{ id: 0, label: 'Teardown', icon: '🧹' },
	{ id: 1, label: 'Scaffolding', icon: '🏗️' },
	{ id: 2, label: 'Component Injection', icon: '🧩' },
	{ id: 3, label: 'Docker & Bootstrapping', icon: '🐳' },
	{ id: 4, label: 'Publish to Bitbucket', icon: '🚀' }
];

export interface ManifestComponent {
	version: string;
	composer_dependencies: string[] | Record<string, string>;
	npm_dependencies: string[] | Record<string, string>;
	nuxt_ui: boolean;
}

export interface ManifestRecordType {
	version: string;
	composer_dependencies: string[] | Record<string, string>;
	npm_dependencies: string[] | Record<string, string>;
	typo3_table: string;
	nuxt_ui: boolean;
}

// The shared factory-core/manifest.json is consumed both by this pipeline-app
// and by the external `lab-cli` tool. lab-cli does a flat key lookup
// (`manifest[componentName]`), so components must stay at the top level.
// `record_types` sits as a sibling meta-key; use `manifestComponents()` /
// `manifestRecordTypes()` to extract each section cleanly.
export type Manifest = Record<string, any>;

export const MANIFEST_RESERVED_KEYS = ['record_types'] as const;

export function manifestComponents(manifest: Manifest | null): Record<string, ManifestComponent> {
	if (!manifest) return {};
	const out: Record<string, ManifestComponent> = {};
	for (const [k, v] of Object.entries(manifest)) {
		if ((MANIFEST_RESERVED_KEYS as readonly string[]).includes(k)) continue;
		out[k] = v as ManifestComponent;
	}
	return out;
}

export function manifestRecordTypes(manifest: Manifest | null): Record<string, ManifestRecordType> {
	const rt = manifest?.record_types;
	return (rt && typeof rt === 'object' ? rt : {}) as Record<string, ManifestRecordType>;
}
