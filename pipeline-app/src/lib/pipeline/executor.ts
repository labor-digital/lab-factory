import { spawn } from 'node:child_process';
import { rm, symlink, unlink, appendFile, stat, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import type { PipelineConfig, StepEvent, PhaseId } from './types.js';
import { assertFileExists, assertJsonContains } from './assertions.js';

type Emit = (event: StepEvent) => void;

function toKebab(pascal: string): string {
	return pascal.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function toPascal(kebab: string): string {
	return kebab.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase());
}

async function getTemplateComponents(factoryCorePath: string, templateSlug: string): Promise<string[]> {
	try {
		const tplPath = resolve(factoryCorePath, 'typo3-extension', 'SeedTemplates', templateSlug + '.json');
		const content = await readFile(tplPath, 'utf-8');
		const parsed = JSON.parse(content);
		const slugs: string[] = (parsed.elements || []).map((e: { component?: string }) => e.component).filter(Boolean);
		// Deduplicate and convert to PascalCase
		return [...new Set(slugs)].map(toPascal);
	} catch {
		return [];
	}
}

async function getTemplateRecordTypes(factoryCorePath: string, templateSlug: string): Promise<string[]> {
	try {
		const tplPath = resolve(factoryCorePath, 'typo3-extension', 'SeedTemplates', templateSlug + '.json');
		const content = await readFile(tplPath, 'utf-8');
		const parsed = JSON.parse(content);
		return Array.isArray(parsed.record_types)
			? parsed.record_types.filter((r: unknown): r is string => typeof r === 'string')
			: [];
	} catch {
		return [];
	}
}

function parseLabCliBin(bin: string): { cmd: string; args: string[] } {
	const parts = bin.split(/\s+/);
	return { cmd: parts[0], args: parts.slice(1) };
}

async function runCommand(
	cmd: string,
	args: string[],
	cwd: string,
	emit: Emit,
	stepId: string,
	signal: AbortSignal
): Promise<string> {
	return new Promise((resolve_, reject) => {
		if (signal.aborted) {
			reject(new Error('Aborted'));
			return;
		}

		const displayCmd = `${cmd} ${args.join(' ')}`;
		emit({ type: 'step:start', stepId, data: displayCmd, timestamp: Date.now() });

		const child = spawn(cmd, args, {
			cwd,
			env: { ...process.env },
			stdio: ['ignore', 'pipe', 'pipe'],
			signal
		});

		let stdout = '';

		child.stdout.on('data', (chunk: Buffer) => {
			const text = chunk.toString();
			stdout += text;
			for (const line of text.split('\n')) {
				if (line.trim()) {
					emit({ type: 'step:output', stepId, data: line, timestamp: Date.now() });
				}
			}
		});

		child.stderr.on('data', (chunk: Buffer) => {
			const text = chunk.toString();
			for (const line of text.split('\n')) {
				if (line.trim()) {
					emit({ type: 'step:output', stepId, data: line, timestamp: Date.now() });
				}
			}
		});

		child.on('error', (err) => {
			emit({ type: 'step:fail', stepId, data: err.message, timestamp: Date.now() });
			reject(err);
		});

		child.on('close', (code: number | null) => {
			if (code === 0) {
				emit({ type: 'step:pass', stepId, data: `Exited with code 0`, timestamp: Date.now() });
				resolve_(stdout);
			} else {
				const msg = `Command failed with exit code ${code}`;
				emit({ type: 'step:fail', stepId, data: msg, timestamp: Date.now() });
				reject(new Error(msg));
			}
		});
	});
}

async function forceSymlink(target: string, link: string): Promise<void> {
	try {
		await unlink(link);
	} catch {
		// link doesn't exist, that's fine
	}
	await symlink(target, link);
}

async function assertContainerRunning(service: string, cwd: string): Promise<void> {
	return new Promise((resolve_, reject) => {
		const child = spawn('docker', ['compose', 'ps', '--format', '{{.State}}', service], { cwd });
		let out = '';
		child.stdout.on('data', (d: Buffer) => { out += d.toString(); });
		child.on('close', (code: number | null) => {
			const state = out.trim().toLowerCase();
			if (code !== 0 || !state || state === 'exited' || state === 'dead' || state === 'restarting') {
				// Grab recent logs for the error message
				const logChild = spawn('docker', ['compose', 'logs', '--tail', '30', service], { cwd });
				let logs = '';
				logChild.stdout.on('data', (d: Buffer) => { logs += d.toString(); });
				logChild.stderr.on('data', (d: Buffer) => { logs += d.toString(); });
				logChild.on('close', () => {
					const snippet = logs.trim().split('\n').slice(-15).join('\n');
					reject(new Error(
						`Container "${service}" is not running (state: ${state || 'unknown'}).\nRecent logs:\n${snippet}`
					));
				});
			} else {
				resolve_();
			}
		});
	});
}

async function fileExists(path: string): Promise<boolean> {
	try {
		await stat(path);
		return true;
	} catch {
		return false;
	}
}

async function authenticateSudo(password: string, emit: Emit, signal: AbortSignal): Promise<void> {
	const stepId = 'sudo-auth';
	emit({ type: 'step:start', stepId, data: 'Authenticating sudo...', timestamp: Date.now() });

	return new Promise((resolve_, reject) => {
		const child = spawn('sudo', ['-S', '-v'], {
			stdio: ['pipe', 'pipe', 'pipe'],
			signal
		});

		child.stdin.write(password + '\n');
		child.stdin.end();

		let stderr = '';
		child.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });

		child.on('close', (code: number | null) => {
			if (code === 0) {
				emit({ type: 'step:pass', stepId, data: 'sudo authenticated', timestamp: Date.now() });
				resolve_();
			} else {
				emit({ type: 'step:fail', stepId, data: `sudo authentication failed: ${stderr.trim()}`, timestamp: Date.now() });
				reject(new Error('sudo authentication failed'));
			}
		});

		child.on('error', (err) => {
			emit({ type: 'step:fail', stepId, data: err.message, timestamp: Date.now() });
			reject(err);
		});
	});
}

// ---------------------------------------------------------------------------
// Phase 0: Teardown
// ---------------------------------------------------------------------------
async function teardownPhase(
	config: PipelineConfig,
	projectRoot: string,
	projectDir: string,
	emit: Emit,
	signal: AbortSignal
): Promise<void> {
	emit({ type: 'phase:start', phase: 0, phaseLabel: 'Teardown', timestamp: Date.now() });

	const backendApp = resolve(projectDir, 'backend/app');
	const frontendApp = resolve(projectDir, 'frontend/app');

	if (await fileExists(projectDir)) {
		// Stop backend containers
		if (await fileExists(resolve(backendApp, 'docker-compose.yml'))) {
			try {
				await runCommand('docker', ['compose', 'down', '-v'], backendApp, emit, 'teardown-backend-docker', signal);
			} catch {
				// ignore docker errors during teardown
			}
		}

		// Stop frontend containers
		if (await fileExists(resolve(frontendApp, 'docker-compose.yml'))) {
			try {
				await runCommand('docker', ['compose', 'down', '-v'], frontendApp, emit, 'teardown-frontend-docker', signal);
			} catch {
				// ignore docker errors during teardown
			}
		}

		// Remove project directory
		const stepId = 'teardown-rm';
		emit({ type: 'step:start', stepId, data: `rm -rf ${config.testProjectName}`, timestamp: Date.now() });
		await rm(projectDir, { recursive: true, force: true });
		emit({ type: 'step:pass', stepId, data: 'Directory removed', timestamp: Date.now() });
	} else {
		emit({ type: 'step:output', stepId: 'teardown-skip', data: 'No existing project to clean up', timestamp: Date.now() });
	}

	emit({ type: 'phase:end', phase: 0, data: 'Clean slate ready', timestamp: Date.now() });
}

// ---------------------------------------------------------------------------
// Phase 1: Scaffolding
// ---------------------------------------------------------------------------
async function scaffoldPhase(
	config: PipelineConfig,
	projectRoot: string,
	projectDir: string,
	emit: Emit,
	signal: AbortSignal
): Promise<void> {
	emit({ type: 'phase:start', phase: 1, phaseLabel: 'Scaffolding', timestamp: Date.now() });

	const { cmd, args: cliArgs } = parseLabCliBin(config.labCliBin);
	const factoryCoreAbs = resolve(projectRoot, config.factoryCorePath);
	const templatePath = resolve(factoryCoreAbs, 'templates');

	// Derive preview env vars from backend URL
	const frontendDomain = config.typo3ApiBaseUrl.replace(/^https?:\/\//, '').replace(/-bac\./, '-fro.');
	const cookieDomain = '.' + frontendDomain.split('.').slice(1).join('.');

	// Run factory:create
	await runCommand(
		cmd,
		[
			...cliArgs,
			'factory:create',
			config.testProjectName,
			'--template-path',
			templatePath,
			'--force',
			'--json',
			'--secret',
			`APP_ENCRYPTION_KEY=${config.appEncryptionKey}`,
			'--secret',
			`APP_INSTALL_TOOL_PASSWORD=${config.appInstallToolPassword}`,
			'--secret',
			`TYPO3_API_BASE_URL=${config.typo3ApiBaseUrl}`,
			'--secret',
			`APP_FRONTEND_DOMAIN=${frontendDomain}`,
			'--secret',
			`APP_COOKIE_DOMAIN=${cookieDomain}`
		],
		projectRoot,
		emit,
		'scaffold-create',
		signal
	);

	// Assert scaffolded files exist
	let ok = true;
	ok = (await assertFileExists(resolve(projectDir, 'backend/app/src/factory.json'), 'backend factory.json', emit)) && ok;
	ok = (await assertFileExists(resolve(projectDir, 'backend/app/src/composer.json'), 'backend composer.json', emit)) && ok;
	ok = (await assertFileExists(resolve(projectDir, 'frontend/app/src/factory.json'), 'frontend factory.json', emit)) && ok;

	if (!ok) throw new Error('Scaffolding assertions failed');

	// Symlink factory-core
	const stepId = 'scaffold-symlink';
	emit({ type: 'step:start', stepId, data: 'Symlinking factory-core', timestamp: Date.now() });
	await forceSymlink(factoryCoreAbs, resolve(projectDir, 'backend/app/factory-core'));
	await forceSymlink(factoryCoreAbs, resolve(projectDir, 'frontend/app/factory-core'));
	emit({ type: 'step:pass', stepId, data: 'factory-core symlinked to backend + frontend', timestamp: Date.now() });

	// Write settings to factory.json
	const settingsStepId = 'scaffold-settings';
	emit({ type: 'step:start', stepId: settingsStepId, data: 'Writing settings to factory.json', timestamp: Date.now() });
	for (const subdir of ['frontend/app/src', 'backend/app/src']) {
		const factoryJsonPath = resolve(projectDir, subdir, 'factory.json');
		const raw = await readFile(factoryJsonPath, 'utf-8');
		const json = JSON.parse(raw);
		json.settings = config.settings;
		await writeFile(factoryJsonPath, JSON.stringify(json, null, '\t') + '\n');
	}
	emit({ type: 'step:pass', stepId: settingsStepId, data: 'Settings written to factory.json', timestamp: Date.now() });

	// Write TYPO3_API_BASE_URL to frontend .env.app
	const envAppPath = resolve(projectDir, 'frontend/app/.env.app');
	await appendFile(envAppPath, `TYPO3_API_BASE_URL=${config.typo3ApiBaseUrl}\n`);
	emit({
		type: 'step:output',
		stepId: 'scaffold-env',
		data: `Set TYPO3_API_BASE_URL in frontend .env.app`,
		timestamp: Date.now()
	});

	emit({ type: 'phase:end', phase: 1, data: 'Project scaffolded', timestamp: Date.now() });
}

// ---------------------------------------------------------------------------
// Phase 2: Component Injection
// ---------------------------------------------------------------------------
async function componentPhase(
	config: PipelineConfig,
	projectRoot: string,
	projectDir: string,
	emit: Emit,
	signal: AbortSignal
): Promise<void> {
	emit({ type: 'phase:start', phase: 2, phaseLabel: 'Component Injection', timestamp: Date.now() });

	const { cmd, args: cliArgs } = parseLabCliBin(config.labCliBin);
	const backendSrc = resolve(projectDir, 'backend/app/src');
	const frontendSrc = resolve(projectDir, 'frontend/app/src');

	for (const component of config.componentsToTest) {
		// Backend
		const backendResult = await runCommand(
			cmd,
			[...cliArgs, 'factory:add', component, '--json'],
			backendSrc,
			emit,
			`inject-${component.toLowerCase()}-backend`,
			signal
		);
		if (backendResult.includes('"status":"error"')) {
			throw new Error(`factory:add ${component} failed (backend)`);
		}

		// Frontend
		const frontendResult = await runCommand(
			cmd,
			[...cliArgs, 'factory:add', component, '--json'],
			frontendSrc,
			emit,
			`inject-${component.toLowerCase()}-frontend`,
			signal
		);
		if (frontendResult.includes('"status":"error"')) {
			throw new Error(`factory:add ${component} failed (frontend)`);
		}

		emit({
			type: 'step:output',
			stepId: `inject-${component.toLowerCase()}-done`,
			data: `Injected ${component} into backend + frontend`,
			timestamp: Date.now()
		});
	}

	// Write active_record_types directly into factory.json (no CLI equivalent yet).
	if (config.activeRecordTypes.length > 0) {
		const recordStepId = 'inject-record-types';
		emit({ type: 'step:start', stepId: recordStepId, data: `Writing active_record_types: ${config.activeRecordTypes.join(', ')}`, timestamp: Date.now() });
		for (const subdir of ['backend/app/src', 'frontend/app/src']) {
			const factoryJsonPath = resolve(projectDir, subdir, 'factory.json');
			const raw = await readFile(factoryJsonPath, 'utf-8');
			const json = JSON.parse(raw);
			json.active_record_types = config.activeRecordTypes;
			await writeFile(factoryJsonPath, JSON.stringify(json, null, '\t') + '\n');
		}
		emit({ type: 'step:pass', stepId: recordStepId, data: 'active_record_types written', timestamp: Date.now() });
	}

	// Verify components in factory.json
	emit({
		type: 'step:output',
		stepId: 'verify-components',
		data: 'Verifying active_components...',
		timestamp: Date.now()
	});

	let ok = true;
	for (const component of config.componentsToTest) {
		ok = (await assertJsonContains(resolve(backendSrc, 'factory.json'), component, emit)) && ok;
		ok = (await assertJsonContains(resolve(frontendSrc, 'factory.json'), component, emit)) && ok;
	}

	if (!ok) throw new Error('Component injection assertions failed');

	emit({ type: 'phase:end', phase: 2, data: 'All components injected and verified', timestamp: Date.now() });
}

// ---------------------------------------------------------------------------
// Phase 3: Docker & Bootstrapping
// ---------------------------------------------------------------------------
async function dockerPhase(
	config: PipelineConfig,
	projectRoot: string,
	projectDir: string,
	emit: Emit,
	signal: AbortSignal
): Promise<void> {
	emit({ type: 'phase:start', phase: 3, phaseLabel: 'Docker & Bootstrapping', timestamp: Date.now() });

	// Pre-authenticate sudo so lab up can write /etc/hosts without blocking
	if (config.sudoPassword) {
		await authenticateSudo(config.sudoPassword, emit, signal);
	}

	const { cmd, args: cliArgs } = parseLabCliBin(config.labCliBin);
	const backendApp = resolve(projectDir, 'backend/app');
	const frontendApp = resolve(projectDir, 'frontend/app');

	// Start containers
	await runCommand(cmd, [...cliArgs, 'up', '--yes', '--import'], backendApp, emit, 'docker-backend-up', signal);
	await runCommand(cmd, [...cliArgs, 'up', '--yes'], frontendApp, emit, 'docker-frontend-up', signal);

	// Wait for composer install
	const waitStepId = 'docker-composer-wait';
	emit({ type: 'step:start', stepId: waitStepId, data: 'Waiting for composer install...', timestamp: Date.now() });

	const maxWait = 300;
	let waited = 0;
	while (waited < maxWait) {
		if (signal.aborted) throw new Error('Aborted');
		try {
			const result = spawn('docker', ['compose', 'exec', '-w', '/', 'app', 'test', '-f', '/var/www/html/vendor/autoload.php'], { cwd: backendApp });
			const code = await new Promise<number | null>((res) => result.on('close', res));
			if (code === 0) break;
		} catch {
			// keep waiting
		}
		await new Promise((res) => setTimeout(res, 1000));
		waited++;
		if (waited % 10 === 0) {
			emit({ type: 'step:output', stepId: waitStepId, data: `Still waiting... (${waited}s)`, timestamp: Date.now() });
			await assertContainerRunning('app', backendApp);
		}
	}
	if (waited >= maxWait) {
		emit({ type: 'step:fail', stepId: waitStepId, data: `Timed out after ${maxWait}s`, timestamp: Date.now() });
		throw new Error('Timed out waiting for composer install');
	}
	emit({ type: 'step:pass', stepId: waitStepId, data: 'Composer dependencies installed', timestamp: Date.now() });

	// TYPO3 setup — get env vars from container
	const getEnv = async (varName: string): Promise<string> => {
		return new Promise((res, rej) => {
			const child = spawn('docker', ['compose', 'exec', '-w', '/', 'app', 'printenv', varName], { cwd: backendApp });
			let out = '';
			child.stdout.on('data', (d: Buffer) => { out += d.toString(); });
			child.on('close', (code: number | null) => code === 0 ? res(out.trim()) : rej(new Error(`Failed to get ${varName}`)));
		});
	};

	const mysqlHost = await getEnv('APP_MYSQL_HOST');
	const mysqlDb = await getEnv('APP_MYSQL_DATABASE');
	const mysqlUser = await getEnv('APP_MYSQL_USER');
	const mysqlPass = await getEnv('APP_MYSQL_PASS');

	// Wait for MySQL to accept connections
	const mysqlWaitId = 'docker-mysql-wait';
	emit({ type: 'step:start', stepId: mysqlWaitId, data: 'Waiting for MySQL to be ready...', timestamp: Date.now() });
	let mysqlWaited = 0;
	const mysqlMaxWait = 60;
	while (mysqlWaited < mysqlMaxWait) {
		if (signal.aborted) throw new Error('Aborted');
		try {
			const result = spawn('docker', [
				'compose', 'exec', 'mysql',
				'mysqladmin', 'ping', '-u', mysqlUser, `-p${mysqlPass}`
			], { cwd: backendApp });
			const code = await new Promise<number | null>((res) => result.on('close', res));
			if (code === 0) break;
		} catch {
			// keep waiting
		}
		await new Promise((res) => setTimeout(res, 1000));
		mysqlWaited++;
		if (mysqlWaited % 5 === 0) {
			emit({ type: 'step:output', stepId: mysqlWaitId, data: `Still waiting... (${mysqlWaited}s)`, timestamp: Date.now() });
			await assertContainerRunning('mysql', backendApp);
		}
	}
	if (mysqlWaited >= mysqlMaxWait) {
		emit({ type: 'step:fail', stepId: mysqlWaitId, data: `MySQL not ready after ${mysqlMaxWait}s`, timestamp: Date.now() });
		throw new Error('Timed out waiting for MySQL');
	}
	emit({ type: 'step:pass', stepId: mysqlWaitId, data: `MySQL ready after ${mysqlWaited}s`, timestamp: Date.now() });

	await runCommand(
		'docker',
		[
			'compose', 'exec', '-w', '/var/www/html', 'app',
			'vendor/bin/typo3', 'setup',
			'--driver=mysqli',
			`--host=${mysqlHost}`,
			'--port=3306',
			`--dbname=${mysqlDb}`,
			`--username=${mysqlUser}`,
			`--password=${mysqlPass}`,
			`--admin-username=${config.typo3AdminUser}`,
			`--admin-user-password=${config.typo3AdminPassword}`,
			`--project-name=${config.testProjectName}`,
			'--server-type=apache',
			'--no-interaction',
			'--force'
		],
		backendApp,
		emit,
		'docker-typo3-setup',
		signal
	);

	await runCommand(
		'docker',
		['compose', 'exec', '-w', '/var/www/html', 'app', 'vendor/bin/typo3', 'cache:flush'],
		backendApp,
		emit,
		'docker-typo3-cache',
		signal
	);

	// Base seeder
	const seedInitArgs = [
		'compose', 'exec', '-w', '/var/www/html', 'app',
		'vendor/bin/typo3', 'factory:seed:init',
		'--lang', config.languages.join(',')
	];

	if (config.seedTemplate) {
		seedInitArgs.push('--seed-template', config.seedTemplate);
	} else {
		// Reverse order because TYPO3 sorts newest-first by default
		const homeElementsSlugs = [...config.homeElements].reverse().map(toKebab);
		seedInitArgs.push('--home-elements', homeElementsSlugs.join(','));
	}

	await runCommand(
		'docker',
		seedInitArgs,
		backendApp,
		emit,
		'docker-seed-init',
		signal
	);

	// Component seeders
	for (const component of config.componentsToTest) {
		const slug = toKebab(component);
		await runCommand(
			'docker',
			['compose', 'exec', '-w', '/var/www/html', 'app', 'vendor/bin/typo3', 'factory:seed:component', slug],
			backendApp,
			emit,
			`docker-seed-${slug}`,
			signal
		);
	}

	// Final cache flush after all seeders
	await runCommand(
		'docker',
		['compose', 'exec', '-w', '/var/www/html', 'app', 'vendor/bin/typo3', 'cache:flush'],
		backendApp,
		emit,
		'docker-typo3-cache-final',
		signal
	);

	// Fix permissions on var/ directory — TYPO3 CLI commands run as root inside the
	// container, leaving cache dirs (e.g. var/cache/code/di/) owned by root and
	// unwritable by the web server.
	await runCommand(
		'docker',
		['compose', 'exec', '-w', '/var/www/html', 'app', 'bash', '-c',
			'source /root/.bashrc && ensure_perms /var/www/html/var'],
		backendApp,
		emit,
		'docker-fix-permissions',
		signal
	);

	emit({ type: 'phase:end', phase: 3, data: 'Docker bootstrapped and seeded', timestamp: Date.now() });
}

// ---------------------------------------------------------------------------
// Main pipeline runner
// ---------------------------------------------------------------------------
export async function runPipeline(
	config: PipelineConfig,
	emit: Emit,
	signal: AbortSignal
): Promise<void> {
	const projectRoot = resolve(dirname(new URL(import.meta.url).pathname), '..', '..', '..', '..');
	const projectDir = resolve(projectRoot, config.testProjectName);

	// When a seed template is selected, ensure all its components AND record
	// types are in the config (in case the user changed selection manually).
	if (config.seedTemplate) {
		const factoryCoreAbs = resolve(projectRoot, config.factoryCorePath);
		const tplComponents = await getTemplateComponents(factoryCoreAbs, config.seedTemplate);
		for (const comp of tplComponents) {
			if (!config.componentsToTest.includes(comp)) {
				config.componentsToTest.push(comp);
			}
		}
		const tplRecordTypes = await getTemplateRecordTypes(factoryCoreAbs, config.seedTemplate);
		for (const rt of tplRecordTypes) {
			if (!config.activeRecordTypes.includes(rt)) {
				config.activeRecordTypes.push(rt);
			}
		}
	}

	try {
		await teardownPhase(config, projectRoot, projectDir, emit, signal);
		await scaffoldPhase(config, projectRoot, projectDir, emit, signal);
		await componentPhase(config, projectRoot, projectDir, emit, signal);

		if (config.includePhase3) {
			await dockerPhase(config, projectRoot, projectDir, emit, signal);
		} else {
			emit({
				type: 'step:output',
				stepId: 'skip-phase3',
				data: 'Skipping Phase 3 (Docker). Enable it in config to include.',
				timestamp: Date.now()
			});
		}

		emit({ type: 'pipeline:done', timestamp: Date.now() });
	} catch (err) {
		emit({
			type: 'pipeline:error',
			data: err instanceof Error ? err.message : String(err),
			timestamp: Date.now()
		});
	}
}
