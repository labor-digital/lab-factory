import type { StepEvent } from '../pipeline/types.js';

export type FactoryEmit = (event: StepEvent) => void;

export interface FactoryConfig {
	core_version: string;
	active_components: string[];
	[key: string]: unknown;
}

export interface FactoryComponentManifestEntry {
	version: string;
	composer_dependencies?: string[];
	npm_dependencies?: string[];
	[key: string]: unknown;
}

export interface FactoryComponentManifest {
	[componentName: string]: FactoryComponentManifestEntry;
}

export interface CreateProjectOptions {
	projectName: string;
	targetDir: string;
	templatePath: string;
	secrets?: Record<string, string>;
	force?: boolean;
}

export interface CreateProjectResult {
	status: 'success';
	project: string;
	path: string;
}

export interface AddComponentOptions {
	componentName: string;
	cwd: string;
	factoryJsonPath?: string;
}

export type AddComponentResult =
	| {
			status: 'success';
			context: 'frontend' | 'backend';
			component: string;
			installed: string[];
	  }
	| {
			status: 'requires_update';
			component: string;
			current_core_version: string;
			required_core_version: string;
			message: string;
	  };

export interface UpgradeCoreOptions {
	cwd: string;
	factoryJsonPath?: string;
	targetVersion?: string;
}

export type UpgradeCoreResult =
	| {
			status: 'success';
			previous_version: string;
			new_version: string;
	  }
	| {
			status: 'noop';
			previous_version: string;
			new_version: string;
	  };

export class FactoryError extends Error {
	constructor(
		message: string,
		public readonly userFacing: boolean = true
	) {
		super(message);
		this.name = 'FactoryError';
	}
}
