import * as fs from 'node:fs';
import * as path from 'node:path';
import { valid as semverValid } from './semver.js';
import { FactoryError, type FactoryConfig } from './types.js';

export function readFactoryConfig(configPath: string): FactoryConfig {
	if (!fs.existsSync(configPath)) {
		throw new FactoryError(`factory.json not found at ${configPath}.`);
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
	} catch {
		throw new FactoryError('Invalid factory.json configuration.');
	}

	if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
		throw new FactoryError('Invalid factory.json configuration.');
	}

	const cfg = parsed as FactoryConfig;
	if (typeof cfg.core_version !== 'string' || cfg.core_version.trim() === '' || !semverValid(cfg.core_version)) {
		throw new FactoryError('Invalid factory.json configuration (missing or invalid core_version).');
	}

	// active_components is optional for upgrade (only add needs it). Default to empty.
	if (cfg.active_components === undefined) {
		cfg.active_components = [];
	}
	if (!Array.isArray(cfg.active_components) || cfg.active_components.some((c) => typeof c !== 'string')) {
		throw new FactoryError('Invalid factory.json configuration (active_components must be string[]).');
	}

	return cfg;
}

export function writeFactoryConfig(configPath: string, config: FactoryConfig): void {
	try {
		fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
	} catch (e) {
		throw new FactoryError(`Failed to write factory.json at ${configPath}: ${(e as Error).message}`);
	}
}

/**
 * Resolve the factory.json path. The pipeline-app caller always passes an
 * explicit path (or a cwd), so we don't prompt or fall back to a wizard —
 * the lab-cli flow that ran inquirer for missing paths is dropped because
 * pipeline-app runs non-interactively on a server.
 */
export function resolveFactoryJsonPath(cwd: string, explicit?: string): string {
	if (explicit) {
		const abs = path.resolve(cwd, explicit);
		if (fs.existsSync(abs)) return abs;
		throw new FactoryError(`factory.json not found at provided path: ${abs}`);
	}

	const root = path.resolve(cwd, 'factory.json');
	if (fs.existsSync(root)) return root;

	const src = path.resolve(cwd, 'src/factory.json');
	if (fs.existsSync(src)) return src;

	throw new FactoryError(
		`factory.json not found in ${cwd} or ${path.resolve(cwd, 'src')}. ` +
			`Pass an explicit path to disambiguate.`
	);
}
