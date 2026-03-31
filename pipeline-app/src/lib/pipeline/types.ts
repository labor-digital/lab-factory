export type PhaseId = 0 | 1 | 2 | 3;
export type StepStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

export type TailwindColor =
	| 'red' | 'orange' | 'amber' | 'yellow' | 'lime' | 'green'
	| 'emerald' | 'teal' | 'cyan' | 'sky' | 'blue' | 'indigo'
	| 'violet' | 'purple' | 'fuchsia' | 'pink' | 'rose';

export type NeutralColor = 'slate' | 'gray' | 'zinc' | 'neutral' | 'stone';

export type ColorMode = 'system' | 'light' | 'dark';

export interface FactorySettings {
	colors: {
		primary: TailwindColor;
		secondary: TailwindColor | NeutralColor;
		success: TailwindColor;
		info: TailwindColor;
		warning: TailwindColor;
		error: TailwindColor;
		neutral: NeutralColor;
	};
	radius: string;
	fonts: {
		sans: string;
		mono: string;
	};
	breakpoints: Record<string, string>;
	colorMode: ColorMode;
}

export interface PipelineConfig {
	labCliBin: string;
	factoryCorePath: string;
	testProjectName: string;
	componentsToTest: string[];
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
	composer_dependencies: Record<string, string>;
	npm_dependencies: Record<string, string>;
	nuxt_ui: boolean;
}

export type Manifest = Record<string, ManifestComponent>;
