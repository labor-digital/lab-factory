import * as fs from 'node:fs';
import * as path from 'node:path';
import { emitFail, emitOutput, emitPass, emitStart, runStreaming } from './exec.js';
import { resolveFactoryJsonPath, readFactoryConfig, writeFactoryConfig } from './factoryJson.js';
import { fetchComponentManifest } from './manifest.js';
import { lte, valid as semverValid } from './semver.js';
import {
	FactoryError,
	type FactoryEmit,
	type UpgradeCoreOptions,
	type UpgradeCoreResult
} from './types.js';

const FALLBACK_TARGET_VERSION = '1.6.0';

/**
 * Port of lab-cli `FactoryUpgradeCommand`. Updates the factory-core
 * dependency in either the backend (composer) or frontend (npm) and runs
 * TYPO3 schema migrations on the backend. On success, writes the new
 * core_version back to factory.json. Returns `noop` if the project is
 * already at or above the target version.
 *
 * Environment detection mirrors lab-cli: cwd must contain exactly one of
 * composer.json (backend) or package.json (frontend).
 */
export async function upgradeCore(
	opts: UpgradeCoreOptions,
	emit?: FactoryEmit,
	signal?: AbortSignal
): Promise<UpgradeCoreResult> {
	const stepId = 'factory-upgrade';
	emitStart(emit, stepId, 'Upgrading factory core');

	const configPath = resolveFactoryJsonPath(opts.cwd, opts.factoryJsonPath);
	const config = readFactoryConfig(configPath);
	const currentVersion = config.core_version;

	const requested = opts.targetVersion?.trim() ?? '';
	let target: string;
	if (requested !== '') {
		target = requested;
	} else {
		try {
			const manifest = await fetchComponentManifest(opts.cwd);
			const core = manifest['core'];
			target =
				core && typeof core.version === 'string' && semverValid(core.version)
					? core.version
					: FALLBACK_TARGET_VERSION;
		} catch {
			target = FALLBACK_TARGET_VERSION;
		}
	}

	const normalized = semverValid(target);
	if (!normalized) {
		emitFail(emit, stepId, `Invalid target version: ${target}`);
		throw new FactoryError(`Invalid target version: ${target}`);
	}

	if (lte(normalized, currentVersion)) {
		emitPass(emit, stepId, `Already at ${currentVersion} — no upgrade needed`);
		return {
			status: 'noop',
			previous_version: currentVersion,
			new_version: currentVersion
		};
	}

	const hasComposer = fs.existsSync(path.join(opts.cwd, 'composer.json'));
	const hasPackage = fs.existsSync(path.join(opts.cwd, 'package.json'));

	if (hasComposer && !hasPackage) {
		emitOutput(emit, stepId, `Updating TYPO3 factory-core dependency to ${normalized}`);
		await runStreaming(
			'composer',
			['require', `labor-digital/factory-core:${normalized}`, '--with-all-dependencies'],
			{ cwd: opts.cwd, stepId, emit, signal }
		);
		emitOutput(emit, stepId, 'Running TYPO3 database schema migrations');
		await runStreaming('vendor/bin/typo3', ['database:updateschema'], {
			cwd: opts.cwd,
			stepId,
			emit,
			signal
		});
	} else if (hasPackage && !hasComposer) {
		emitOutput(emit, stepId, `Updating Nuxt factory-nuxt-layer to ${normalized}`);
		await runStreaming(
			'npm',
			['install', `@labor-digital/factory-nuxt-layer@${normalized}`],
			{ cwd: opts.cwd, stepId, emit, signal }
		);
	} else {
		emitFail(emit, stepId, 'Could not determine project context');
		throw new FactoryError(
			'Could not determine project context. Run inside a directory with either composer.json or package.json (not both).'
		);
	}

	writeFactoryConfig(configPath, { ...config, core_version: normalized });
	emitPass(emit, stepId, `Upgraded ${currentVersion} → ${normalized}`);
	return { status: 'success', previous_version: currentVersion, new_version: normalized };
}
