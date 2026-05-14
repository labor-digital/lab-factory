import * as fs from 'node:fs';
import * as path from 'node:path';
import { emitFail, emitOutput, emitPass, emitStart, runStreaming } from './exec.js';
import { resolveFactoryJsonPath, readFactoryConfig } from './factoryJson.js';
import { fetchComponentManifest } from './manifest.js';
import { gt, valid as semverValid } from './semver.js';
import {
	FactoryError,
	type AddComponentOptions,
	type AddComponentResult,
	type FactoryComponentManifestEntry,
	type FactoryEmit
} from './types.js';

function validateManifestEntry(entry: FactoryComponentManifestEntry): void {
	if (typeof entry.version !== 'string' || !semverValid(entry.version)) {
		throw new FactoryError('Invalid factory manifest entry: missing or invalid version.');
	}
	if (entry.composer_dependencies !== undefined) {
		if (
			!Array.isArray(entry.composer_dependencies) ||
			entry.composer_dependencies.some((d) => typeof d !== 'string' || d.trim() === '')
		) {
			throw new FactoryError('Invalid factory manifest entry: composer_dependencies must be string[].');
		}
	}
	if (entry.npm_dependencies !== undefined) {
		if (
			!Array.isArray(entry.npm_dependencies) ||
			entry.npm_dependencies.some((d) => typeof d !== 'string' || d.trim() === '')
		) {
			throw new FactoryError('Invalid factory manifest entry: npm_dependencies must be string[].');
		}
	}
}

/**
 * Port of lab-cli `FactoryAddCommand`. Adds a component to `active_components`
 * in factory.json and installs the component's composer/npm dependencies.
 *
 * The environment (backend vs frontend) is inferred from whether the cwd
 * contains composer.json or package.json — exactly one must match, otherwise
 * the call fails. This matches lab-cli; pipeline-app's phase 2 already calls
 * once per (component, side) from the respective `backend/app/src` and
 * `frontend/app/src` directories so the autodetect works.
 *
 * Differences from lab-cli:
 * - Returns a discriminated union or throws — no NDJSON, no process.exit.
 * - Dependency install uses streaming spawn (emits live composer/npm output)
 *   instead of execSync, so the pipeline UI shows install progress.
 */
export async function addComponent(
	opts: AddComponentOptions,
	emit?: FactoryEmit,
	signal?: AbortSignal
): Promise<AddComponentResult> {
	const componentName = opts.componentName?.trim();
	if (!componentName) throw new FactoryError('Component name is required.');

	const stepId = `factory-add-${componentName.toLowerCase()}`;
	emitStart(emit, stepId, `Adding component "${componentName}"`);

	const configPath = resolveFactoryJsonPath(opts.cwd, opts.factoryJsonPath);
	const config = readFactoryConfig(configPath);
	const manifest = await fetchComponentManifest(opts.cwd);
	const manifestEntry = manifest[componentName];

	const hasComposer = fs.existsSync(path.join(opts.cwd, 'composer.json'));
	const hasPackage = fs.existsSync(path.join(opts.cwd, 'package.json'));

	let envContext: 'frontend' | 'backend';
	if (hasComposer && !hasPackage) envContext = 'backend';
	else if (hasPackage && !hasComposer) envContext = 'frontend';
	else {
		emitFail(emit, stepId, 'Could not determine project context');
		throw new FactoryError(
			'Could not determine project context. Run inside a directory with either composer.json or package.json (not both).'
		);
	}

	if (typeof manifestEntry !== 'object' || manifestEntry === null) {
		emitFail(emit, stepId, `Component "${componentName}" not in manifest`);
		throw new FactoryError(`Component "${componentName}" not found in factory manifest.`);
	}

	validateManifestEntry(manifestEntry);

	if (gt(manifestEntry.version, config.core_version)) {
		const result: AddComponentResult = {
			status: 'requires_update',
			component: componentName,
			current_core_version: config.core_version,
			required_core_version: manifestEntry.version,
			message: `Update required. Run factory:upgrade. Required ${manifestEntry.version}, current ${config.core_version}.`
		};
		emitPass(emit, stepId, result.message);
		return result;
	}

	const composerDeps = Array.isArray(manifestEntry.composer_dependencies)
		? manifestEntry.composer_dependencies
		: [];
	const npmDeps = Array.isArray(manifestEntry.npm_dependencies) ? manifestEntry.npm_dependencies : [];

	let installed: string[] = [];

	const alreadyActive = config.active_components.indexOf(componentName) !== -1;
	if (!alreadyActive) {
		try {
			if (envContext === 'backend' && composerDeps.length > 0) {
				emitOutput(emit, stepId, `composer require ${composerDeps.join(' ')}`);
				await runStreaming(
					'composer',
					['require', ...composerDeps, '--with-all-dependencies'],
					{ cwd: opts.cwd, stepId, emit, signal }
				);
				installed = composerDeps;
			} else if (envContext === 'frontend' && npmDeps.length > 0) {
				emitOutput(emit, stepId, `npm install ${npmDeps.join(' ')}`);
				await runStreaming('npm', ['install', ...npmDeps], {
					cwd: opts.cwd,
					stepId,
					emit,
					signal
				});
				installed = npmDeps;
			}
		} catch (e) {
			emitFail(emit, stepId, (e as Error).message);
			throw new FactoryError(`Failed to install dependencies: ${(e as Error).message}`);
		}

		config.active_components.push(componentName);
		fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
	}

	const result: AddComponentResult = {
		status: 'success',
		context: envContext,
		component: componentName,
		installed
	};
	emitPass(
		emit,
		stepId,
		alreadyActive
			? `Component "${componentName}" already active in ${envContext}`
			: `Component "${componentName}" added to ${envContext}`
	);
	return result;
}
