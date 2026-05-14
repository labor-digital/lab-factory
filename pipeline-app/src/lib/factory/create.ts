import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Doppler } from './doppler.js';
import { emitFail, emitOutput, emitPass, emitStart } from './exec.js';
import { replaceInDir } from './templates.js';
import {
	FactoryError,
	type CreateProjectOptions,
	type CreateProjectResult,
	type FactoryEmit
} from './types.js';

const DEFAULT_APP_INSTALL_TOOL_PASSWORD_HASH =
	'$argon2id$v=19$m=65536,t=4,p=1$SVE3eVUxS1VnUUF5VXQ0bw$jAw8MUNiCjRARsovanN/dFH4OuT8i2pt9hQS250PMAY';

/**
 * Port of lab-cli `FactoryCreateCommand`. Scaffolds a new Factory client
 * project: creates a Doppler project + dev secrets, copies backend/frontend
 * templates from factory-core, substitutes placeholders, and writes a
 * starter factory.json. Returns when the directory tree is ready; subsequent
 * pipeline phases (component injection, Docker bootstrap) run on top.
 *
 * Differences from lab-cli:
 * - Emits StepEvents instead of writing to stdout / chalk. Use the optional
 *   `emit` to surface progress; omit for fully silent execution.
 * - Errors throw `FactoryError` instead of `process.exit`. Callers decide
 *   how to surface them (UI toast, NDJSON to stdout, etc.).
 * - The 10-second `--force` countdown is preserved (so an operator running
 *   the headless CLI still has a chance to abort), but the warning banner
 *   goes through `emit` so pipeline-app's UI can surface it.
 */
export async function createProject(
	opts: CreateProjectOptions,
	emit?: FactoryEmit
): Promise<CreateProjectResult> {
	const { projectName, targetDir, templatePath, secrets = {}, force = false } = opts;
	const stepId = 'factory-create';

	if (!projectName || !projectName.trim()) {
		throw new FactoryError('Project name is required.');
	}

	emitStart(emit, stepId, `Scaffolding factory project "${projectName}"`);

	const doppler = new Doppler();
	if (!doppler.isInstalled()) {
		emitFail(emit, stepId, 'Doppler CLI not installed');
		throw new FactoryError(
			'Doppler CLI is not installed. Install it first: https://docs.doppler.com/docs/install-cli'
		);
	}
	if (!doppler.isLoggedIn()) {
		emitFail(emit, stepId, 'Doppler CLI not authenticated');
		throw new FactoryError('Doppler CLI is not authenticated. Run: doppler login');
	}

	const hasDir = fs.existsSync(targetDir);
	const hasDoppler = doppler.projectExists(projectName);

	if (force) {
		if (hasDir || hasDoppler) {
			const targets: string[] = [];
			if (hasDir) targets.push(`directory ${targetDir}`);
			if (hasDoppler) targets.push(`Doppler project ${projectName}`);
			emitOutput(
				emit,
				stepId,
				`--force: destroying existing ${targets.join(' and ')} in 10s (abort to cancel)`
			);
			await new Promise((r) => setTimeout(r, 10_000));
			if (hasDoppler) {
				doppler.deleteProject(projectName);
				emitOutput(emit, stepId, `Deleted Doppler project ${projectName}`);
			}
			if (hasDir) {
				fs.rmSync(targetDir, { recursive: true, force: true });
				emitOutput(emit, stepId, `Deleted directory ${targetDir}`);
			}
		}
	} else if (hasDir) {
		throw new FactoryError(`Target directory already exists: ${targetDir}`);
	}

	doppler.createProject(projectName);
	emitOutput(emit, stepId, `Created Doppler project ${projectName} (dev/stg/prd auto-provisioned)`);

	const baseSecrets: Record<string, string> = {
		APP_ENCRYPTION_KEY: crypto.randomBytes(48).toString('hex'),
		APP_INSTALL_TOOL_PASSWORD: DEFAULT_APP_INSTALL_TOOL_PASSWORD_HASH,
		...secrets
	};
	try {
		doppler.setSecrets(projectName, 'dev', baseSecrets);
		emitOutput(emit, stepId, `Seeded ${Object.keys(baseSecrets).length} Doppler dev secrets`);
	} catch (e) {
		// Match lab-cli: secret seeding failure is a warning, not fatal —
		// the project directory and Doppler project are already provisioned.
		emitOutput(emit, stepId, `Warning: ${(e as Error).message}`);
	}

	fs.mkdirSync(targetDir, { recursive: true });
	const backendAppDir = path.join(targetDir, 'backend', 'app');
	const frontendAppDir = path.join(targetDir, 'frontend', 'app');
	fs.mkdirSync(backendAppDir, { recursive: true });
	fs.mkdirSync(frontendAppDir, { recursive: true });

	const backendTemplateDir = path.join(templatePath, 'backend');
	const frontendTemplateDir = path.join(templatePath, 'frontend');

	if (fs.existsSync(backendTemplateDir)) {
		fs.cpSync(backendTemplateDir, backendAppDir, { recursive: true });
		emitOutput(emit, stepId, `Copied backend template from ${backendTemplateDir}`);
	} else {
		emitOutput(emit, stepId, `Warning: backend template directory not found at ${backendTemplateDir}`);
	}

	if (fs.existsSync(frontendTemplateDir)) {
		fs.cpSync(frontendTemplateDir, frontendAppDir, { recursive: true });
		emitOutput(emit, stepId, `Copied frontend template from ${frontendTemplateDir}`);
	} else {
		emitOutput(emit, stepId, `Warning: frontend template directory not found at ${frontendTemplateDir}`);
	}

	replaceInDir(targetDir, {
		'{{PROJECT_NAME}}': projectName,
		'{{DOPPLER_PROJECT}}': projectName,
		'{{DOPPLER_CONFIG}}': 'dev'
	});

	const factoryJsonPath = path.join(targetDir, 'factory.json');
	fs.writeFileSync(
		factoryJsonPath,
		JSON.stringify({ core_version: '1.0.0', active_components: [] }, null, 4)
	);

	emitPass(emit, stepId, `Project "${projectName}" scaffolded at ${targetDir}`);

	return { status: 'success', project: projectName, path: targetDir };
}
