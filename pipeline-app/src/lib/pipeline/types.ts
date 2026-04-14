export type PhaseId = 0 | 1 | 2 | 3;
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
	{ id: 3, label: 'Docker & Bootstrapping', icon: '🐳' }
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
