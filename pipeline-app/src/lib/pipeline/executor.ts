import { spawn } from 'node:child_process';
import { rm, symlink, unlink, appendFile, stat, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import type { PipelineConfig, StepEvent, PhaseId, TenantSpec } from './types.js';
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

	// Always create the factory-core symlinks. lab-cli's factory:* commands
	// resolve the component manifest via `<cwd>/../factory-core/manifest.json`,
	// which only exists in the monorepo root — neither the published Composer
	// extension nor the npm nuxt-layer ships it. The symlink coexists
	// harmlessly with npm mode (where the actual application code is loaded
	// from the published packages); lab-cli reads only manifest.json from it.
	{
		const stepId = 'scaffold-symlink';
		emit({ type: 'step:start', stepId, data: 'Symlinking factory-core (lab-cli manifest lookup)', timestamp: Date.now() });
		await forceSymlink(factoryCoreAbs, resolve(projectDir, 'backend/app/factory-core'));
		await forceSymlink(factoryCoreAbs, resolve(projectDir, 'frontend/app/factory-core'));
		emit({ type: 'step:pass', stepId, data: 'factory-core symlinked to backend + frontend', timestamp: Date.now() });
	}

	// Wire factory-core source: local path symlinks (internal dev) or
	// published packages (real clients).
	if (config.factoryCoreSource === 'npm') {
		const stepId = 'scaffold-npm-source';
		emit({
			type: 'step:start',
			stepId,
			data: 'factoryCoreSource=npm — wiring published packages',
			timestamp: Date.now()
		});

		const nuxtConfigPath = resolve(projectDir, 'frontend/app/src/nuxt.config.ts');
		const nuxtConfigRaw = await readFile(nuxtConfigPath, 'utf-8');
		const nuxtConfigPatched = nuxtConfigRaw.replace(
			"'../modules/nuxt-layer'",
			"'@labor-digital/factory-nuxt-layer'"
		);
		if (nuxtConfigPatched === nuxtConfigRaw) {
			throw new Error(
				"npm-source patch: could not find '../modules/nuxt-layer' literal in scaffolded nuxt.config.ts"
			);
		}
		await writeFile(nuxtConfigPath, nuxtConfigPatched);
		emit({
			type: 'step:output',
			stepId,
			data: 'Patched nuxt.config.ts extends → @labor-digital/factory-nuxt-layer',
			timestamp: Date.now()
		});

		const fePkgPath = resolve(projectDir, 'frontend/app/src/package.json');
		const fePkg = JSON.parse(await readFile(fePkgPath, 'utf-8'));
		fePkg.dependencies = {
			...(fePkg.dependencies ?? {}),
			'@labor-digital/factory-nuxt-layer': config.factoryCoreNpmConstraint
		};
		await writeFile(fePkgPath, JSON.stringify(fePkg, null, '\t') + '\n');
		emit({
			type: 'step:output',
			stepId,
			data: `Added @labor-digital/factory-nuxt-layer@${config.factoryCoreNpmConstraint} to frontend package.json`,
			timestamp: Date.now()
		});

		const beComposerPath = resolve(projectDir, 'backend/app/src/composer.json');
		const beComposer = JSON.parse(await readFile(beComposerPath, 'utf-8'));
		if (Array.isArray(beComposer.repositories)) {
			beComposer.repositories = beComposer.repositories.filter(
				(r: { type?: string; url?: string }) =>
					!(r.type === 'path' && typeof r.url === 'string' && r.url.includes('typo3-extension'))
			);
			if (beComposer.repositories.length === 0) {
				delete beComposer.repositories;
			}
		}
		beComposer.require['labor-digital/factory-core'] = config.factoryCoreComposerConstraint;
		await writeFile(beComposerPath, JSON.stringify(beComposer, null, '\t') + '\n');
		emit({
			type: 'step:output',
			stepId,
			data: `Set labor-digital/factory-core:${config.factoryCoreComposerConstraint} in backend composer.json (path repo removed)`,
			timestamp: Date.now()
		});

		emit({
			type: 'step:pass',
			stepId,
			data: 'npm-source mode wired (composer + nuxt-layer set to published versions)',
			timestamp: Date.now()
		});
	}

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
// Phase 4: Publish to Bitbucket
// ---------------------------------------------------------------------------
const BITBUCKET_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;

function redactToken(text: string): string {
	return text.replace(/x-token-auth:[^@]+@/g, 'x-token-auth:***@');
}

async function provisionFlyIoFrontend(
	config: PipelineConfig,
	repoDir: string,
	workspace: string,
	slug: string,
	bitbucketToken: string,
	flyApiToken: string,
	emit: Emit,
	signal: AbortSignal
): Promise<void> {
	const appName = slug; // Reuse the Bitbucket repo slug as the Fly app name.

	// Step F1: flyctl apps create — idempotent-ish (fails if name taken).
	const flyEnv = { ...process.env, FLY_API_TOKEN: flyApiToken };
	const createId = 'fly-apps-create';
	emit({ type: 'step:start', stepId: createId, data: `flyctl apps create ${appName} --org ${config.flyIoOrgSlug}`, timestamp: Date.now() });
	await new Promise<void>((resolveFn, rejectFn) => {
		if (signal.aborted) { rejectFn(new Error('Aborted')); return; }
		const child = spawn('flyctl', ['apps', 'create', appName, '--org', config.flyIoOrgSlug], {
			cwd: repoDir, env: flyEnv, stdio: ['ignore', 'pipe', 'pipe'], signal
		});
		let stderr = '';
		child.stdout.on('data', (c: Buffer) => emit({ type: 'step:output', stepId: createId, data: c.toString(), timestamp: Date.now() }));
		child.stderr.on('data', (c: Buffer) => { stderr += c.toString(); emit({ type: 'step:output', stepId: createId, data: c.toString(), timestamp: Date.now() }); });
		child.on('error', rejectFn);
		child.on('close', (code: number | null) => {
			if (code === 0) { emit({ type: 'step:pass', stepId: createId, data: `App created: ${appName}`, timestamp: Date.now() }); resolveFn(); return; }
			// Treat "name taken" as non-fatal so a re-run doesn't wedge.
			if (/Name .* already/.test(stderr)) {
				emit({ type: 'step:pass', stepId: createId, data: `App ${appName} already exists — continuing`, timestamp: Date.now() });
				resolveFn(); return;
			}
			emit({ type: 'step:fail', stepId: createId, data: `flyctl apps create failed (exit ${code})`, timestamp: Date.now() });
			rejectFn(new Error(`flyctl apps create failed: ${stderr.slice(0, 300)}`));
		});
	});

	// Step F2: flyctl secrets set — populate runtime env.
	const secretsId = 'fly-secrets-set';
	emit({ type: 'step:start', stepId: secretsId, data: `flyctl secrets set TYPO3_API_BASE_URL=<redacted> --app ${appName}`, timestamp: Date.now() });
	await new Promise<void>((resolveFn, rejectFn) => {
		if (signal.aborted) { rejectFn(new Error('Aborted')); return; }
		const child = spawn('flyctl', ['secrets', 'set', `TYPO3_API_BASE_URL=${config.typo3ApiBaseUrl}`, '--app', appName, '--stage'], {
			cwd: repoDir, env: flyEnv, stdio: ['ignore', 'pipe', 'pipe'], signal
		});
		let stderr = '';
		child.stderr.on('data', (c: Buffer) => { stderr += c.toString(); });
		child.on('error', rejectFn);
		child.on('close', (code: number | null) => {
			if (code === 0) { emit({ type: 'step:pass', stepId: secretsId, data: 'Secrets staged (applied on next deploy)', timestamp: Date.now() }); resolveFn(); return; }
			emit({ type: 'step:fail', stepId: secretsId, data: `flyctl secrets set failed (exit ${code}): ${stderr.slice(0, 200)}`, timestamp: Date.now() });
			rejectFn(new Error(`flyctl secrets set failed: ${stderr.slice(0, 300)}`));
		});
	});

	// Step F3: first deploy — bootstrap so the app has a running machine before
	// Bitbucket Pipelines auto-deploys on subsequent pushes.
	const deployId = 'fly-first-deploy';
	emit({ type: 'step:start', stepId: deployId, data: `flyctl deploy --remote-only --app ${appName}`, timestamp: Date.now() });
	await new Promise<void>((resolveFn, rejectFn) => {
		if (signal.aborted) { rejectFn(new Error('Aborted')); return; }
		const child = spawn('flyctl', ['deploy', '--remote-only', '--app', appName], {
			cwd: repoDir, env: flyEnv, stdio: ['ignore', 'pipe', 'pipe'], signal
		});
		child.stdout.on('data', (c: Buffer) => emit({ type: 'step:output', stepId: deployId, data: c.toString(), timestamp: Date.now() }));
		child.stderr.on('data', (c: Buffer) => emit({ type: 'step:output', stepId: deployId, data: c.toString(), timestamp: Date.now() }));
		child.on('error', rejectFn);
		child.on('close', (code: number | null) => {
			if (code === 0) { emit({ type: 'step:pass', stepId: deployId, data: `Deployed: https://${appName}.fly.dev`, timestamp: Date.now() }); resolveFn(); return; }
			emit({ type: 'step:fail', stepId: deployId, data: `flyctl deploy failed (exit ${code})`, timestamp: Date.now() });
			rejectFn(new Error(`flyctl deploy failed`));
		});
	});

	// Step F4: enable Bitbucket Pipelines on the repo so subsequent pushes auto-deploy.
	const pipelinesId = 'fly-bb-enable-pipelines';
	emit({ type: 'step:start', stepId: pipelinesId, data: `PUT /repositories/${workspace}/${slug}/pipelines_config`, timestamp: Date.now() });
	const pipelinesRes = await fetch(`https://api.bitbucket.org/2.0/repositories/${workspace}/${slug}/pipelines_config`, {
		method: 'PUT',
		headers: { Authorization: `Bearer ${bitbucketToken}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({ enabled: true }),
		signal
	});
	if (!pipelinesRes.ok) {
		const body = await pipelinesRes.text();
		emit({ type: 'step:fail', stepId: pipelinesId, data: `Bitbucket ${pipelinesRes.status}: ${body.slice(0, 200)}`, timestamp: Date.now() });
		throw new Error(`Enable Bitbucket Pipelines failed (${pipelinesRes.status})`);
	}
	emit({ type: 'step:pass', stepId: pipelinesId, data: 'Bitbucket Pipelines enabled', timestamp: Date.now() });

	// Step F5: add FLY_API_TOKEN as a secured repo variable so CI can deploy.
	const varId = 'fly-bb-set-variable';
	emit({ type: 'step:start', stepId: varId, data: `POST /repositories/${workspace}/${slug}/pipelines_config/variables FLY_API_TOKEN (secured)`, timestamp: Date.now() });
	const varRes = await fetch(`https://api.bitbucket.org/2.0/repositories/${workspace}/${slug}/pipelines_config/variables/`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${bitbucketToken}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({ key: 'FLY_API_TOKEN', value: flyApiToken, secured: true }),
		signal
	});
	if (!varRes.ok && varRes.status !== 409) {
		const body = await varRes.text();
		emit({ type: 'step:fail', stepId: varId, data: `Bitbucket ${varRes.status}: ${body.slice(0, 200)}`, timestamp: Date.now() });
		throw new Error(`Set Bitbucket variable failed (${varRes.status})`);
	}
	emit({ type: 'step:pass', stepId: varId, data: varRes.status === 409 ? 'Variable already set — skipping' : 'FLY_API_TOKEN set as secured variable', timestamp: Date.now() });
}

async function stagingPhase(
	config: PipelineConfig,
	projectRoot: string,
	projectDir: string,
	emit: Emit,
	signal: AbortSignal,
	flyApiToken: string | null
): Promise<void> {
	emit({ type: 'phase:start', phase: 4, phaseLabel: 'Staging Deploy', timestamp: Date.now() });
	void projectRoot;

	const baseUrl = config.stagingApiBaseUrl.trim();
	const token = process.env.STAGING_API_TOKEN?.trim() ?? '';

	const validateId = 'staging-validate';
	emit({ type: 'step:start', stepId: validateId, data: 'Validating staging config', timestamp: Date.now() });
	if (!baseUrl) {
		emit({ type: 'step:fail', stepId: validateId, data: 'stagingApiBaseUrl is empty', timestamp: Date.now() });
		throw new Error('stagingApiBaseUrl is empty');
	}
	if (!token) {
		emit({ type: 'step:fail', stepId: validateId, data: 'STAGING_API_TOKEN missing on server', timestamp: Date.now() });
		throw new Error('STAGING_API_TOKEN missing on server');
	}
	if (config.tenants.length === 0 && !config.bitbucketRepoSlug && !config.testProjectName) {
		emit({ type: 'step:fail', stepId: validateId, data: 'No tenant slug source — set tenants[] or testProjectName', timestamp: Date.now() });
		throw new Error('No tenant slug source');
	}
	emit({ type: 'step:pass', stepId: validateId, data: `Target: ${baseUrl}`, timestamp: Date.now() });

	// Re-check version compat (defense in depth — the operator may have changed seed since the UI fetched).
	const compatId = 'staging-version-compat';
	emit({ type: 'step:start', stepId: compatId, data: `GET ${baseUrl}/api/multitenant/version`, timestamp: Date.now() });
	const { fetchDeployedVersion } = await import('$lib/staging/api.js');
	const { evaluate } = await import('$lib/staging/versionCompat.js');
	const factoryCoreAbs = resolve(projectRoot, config.factoryCorePath);
	const seedsRepoAbs = resolve(projectRoot, config.seedsRepoPath);
	const seedCoreVersion = await readSeedCoreVersion(factoryCoreAbs, seedsRepoAbs, config.seedTemplate);
	const deployed = await fetchDeployedVersion(baseUrl, token);
	const compat = evaluate(seedCoreVersion, deployed);
	emit({ type: 'step:output', stepId: compatId, data: `seed=${seedCoreVersion} deployed=${deployed.factoryCoreVersion} match=${compat.matches}`, timestamp: Date.now() });
	if (!compat.matches) {
		if (!config.forceVersionMismatch) {
			emit({ type: 'step:fail', stepId: compatId, data: `Version mismatch: ${compat.reason}. Set forceVersionMismatch to override.`, timestamp: Date.now() });
			throw new Error(`Version mismatch: ${compat.reason}`);
		}
		emit({ type: 'step:output', stepId: compatId, data: `version-mismatch (forced) — ${compat.reason}`, timestamp: Date.now() });
	}
	emit({ type: 'step:pass', stepId: compatId, data: compat.reason, timestamp: Date.now() });

	// Resolve the tenant payload. Priority: explicit config.tenants[0]; fallback: synthesize one from the project + seed.
	const tenant: TenantSpec = config.tenants[0] ?? {
		slug: (config.bitbucketRepoSlug.trim() || config.testProjectName).toLowerCase(),
		domain: deriveDomain(config),
		displayName: config.testProjectName,
		activeComponents: config.componentsToTest,
		activeRecordTypes: config.activeRecordTypes,
		adminEmail: ''
	};
	if (!tenant.adminEmail) {
		emit({ type: 'step:output', stepId: 'staging-validate', data: 'No adminEmail set; the multitenant API will reject the request — expect 400.', timestamp: Date.now() });
	}

	// POST /tenants
	const postId = 'staging-post-tenant';
	emit({ type: 'step:start', stepId: postId, data: `POST ${baseUrl}/api/multitenant/tenants slug=${tenant.slug}`, timestamp: Date.now() });
	const { createTenant, getTenant } = await import('$lib/staging/api.js');
	try {
		const result = await createTenant(baseUrl, token, {
			slug: tenant.slug,
			domain: tenant.domain,
			displayName: tenant.displayName,
			components: tenant.activeComponents,
			recordTypes: tenant.activeRecordTypes,
			adminEmail: tenant.adminEmail,
			coreVersion: seedCoreVersion
		});
		emit({ type: 'step:output', stepId: postId, data: JSON.stringify(result).slice(0, 500), timestamp: Date.now() });
	} catch (err) {
		emit({ type: 'step:fail', stepId: postId, data: (err as Error).message, timestamp: Date.now() });
		throw err;
	}
	emit({ type: 'step:pass', stepId: postId, data: 'Tenant submitted', timestamp: Date.now() });

	// Poll until ready (5 min budget)
	const pollId = 'staging-poll-tenant';
	emit({ type: 'step:start', stepId: pollId, data: `Polling GET /tenants/${tenant.slug}`, timestamp: Date.now() });
	const deadline = Date.now() + 5 * 60_000;
	let ready = false;
	while (Date.now() < deadline) {
		if (signal.aborted) throw new Error('Aborted');
		const t = (await getTenant(baseUrl, token, tenant.slug)) as { status?: string; slug?: string } | null;
		if (t && t.status === 'ready') {
			ready = true;
			break;
		}
		if (t) {
			emit({ type: 'step:output', stepId: pollId, data: `status=${t.status ?? '(missing)'}`, timestamp: Date.now() });
		}
		await new Promise((r) => setTimeout(r, 3000));
	}
	if (!ready) {
		emit({ type: 'step:fail', stepId: pollId, data: 'Tenant did not reach status=ready within 5 minutes', timestamp: Date.now() });
		throw new Error('Tenant ready timeout');
	}
	emit({ type: 'step:pass', stepId: pollId, data: 'Tenant ready', timestamp: Date.now() });

	// flyctl deploy the frontend (idempotent — fly app may already exist).
	if (!flyApiToken) {
		emit({ type: 'step:output', stepId: 'staging-fly-skip', data: 'FLY_API_TOKEN not set — skipping frontend deploy.', timestamp: Date.now() });
		return;
	}
	const appName = tenant.slug + '-frontend';
	const frontendDir = resolve(projectDir, 'frontend/app');
	const flyEnv = { ...process.env, FLY_API_TOKEN: flyApiToken };

	// Step S-fly-create: idempotent — succeeds whether the app already exists or not.
	const createId = 'staging-fly-apps-create';
	emit({ type: 'step:start', stepId: createId, data: `flyctl apps create ${appName} --org ${config.flyIoOrgSlug}`, timestamp: Date.now() });
	await new Promise<void>((resolveFn, rejectFn) => {
		if (signal.aborted) { rejectFn(new Error('Aborted')); return; }
		const child = spawn('flyctl', ['apps', 'create', appName, '--org', config.flyIoOrgSlug], {
			cwd: frontendDir, env: flyEnv, stdio: ['ignore', 'pipe', 'pipe'], signal
		});
		let stderr = '';
		child.stdout.on('data', (c: Buffer) => emit({ type: 'step:output', stepId: createId, data: c.toString(), timestamp: Date.now() }));
		child.stderr.on('data', (c: Buffer) => { stderr += c.toString(); emit({ type: 'step:output', stepId: createId, data: c.toString(), timestamp: Date.now() }); });
		child.on('error', rejectFn);
		child.on('close', (code: number | null) => {
			if (code === 0) { emit({ type: 'step:pass', stepId: createId, data: `App created: ${appName}`, timestamp: Date.now() }); resolveFn(); return; }
			if (/Name .* already|already exists|already taken/i.test(stderr)) {
				emit({ type: 'step:pass', stepId: createId, data: `App ${appName} already exists — continuing`, timestamp: Date.now() });
				resolveFn(); return;
			}
			emit({ type: 'step:fail', stepId: createId, data: `flyctl apps create failed (exit ${code}): ${stderr.slice(0, 300)}`, timestamp: Date.now() });
			rejectFn(new Error(`flyctl apps create failed: ${stderr.slice(0, 300)}`));
		});
	});

	// Step S-fly-secrets: stage runtime env. Critical — the Nuxt frontend needs to
	// know where to fetch TYPO3 content from. Without this, the deployed app boots
	// but returns 500 on every request. `--stage` defers the apply until the next
	// deploy (which is the next step), so we don't trigger an extra restart.
	const secretsId = 'staging-fly-secrets-set';
	emit({ type: 'step:start', stepId: secretsId, data: `flyctl secrets set TYPO3_API_BASE_URL=<redacted> --app ${appName}`, timestamp: Date.now() });
	await new Promise<void>((resolveFn, rejectFn) => {
		if (signal.aborted) { rejectFn(new Error('Aborted')); return; }
		const child = spawn('flyctl', ['secrets', 'set', `TYPO3_API_BASE_URL=${config.typo3ApiBaseUrl}`, '--app', appName, '--stage'], {
			cwd: frontendDir, env: flyEnv, stdio: ['ignore', 'pipe', 'pipe'], signal
		});
		let stderr = '';
		child.stderr.on('data', (c: Buffer) => { stderr += c.toString(); });
		child.on('error', rejectFn);
		child.on('close', (code: number | null) => {
			if (code === 0) { emit({ type: 'step:pass', stepId: secretsId, data: 'Secrets staged (applied on next deploy)', timestamp: Date.now() }); resolveFn(); return; }
			emit({ type: 'step:fail', stepId: secretsId, data: `flyctl secrets set failed (exit ${code}): ${stderr.slice(0, 200)}`, timestamp: Date.now() });
			rejectFn(new Error(`flyctl secrets set failed: ${stderr.slice(0, 300)}`));
		});
	});

	// Step S-fly-deploy: the actual rollout. `--remote-only` builds on Fly's
	// builder instead of locally, keeping the operator's machine free.
	const flyId = 'staging-fly-deploy';
	emit({ type: 'step:start', stepId: flyId, data: `flyctl deploy --remote-only --app ${appName}`, timestamp: Date.now() });
	await new Promise<void>((resolveFn, rejectFn) => {
		if (signal.aborted) {
			rejectFn(new Error('Aborted'));
			return;
		}
		const child = spawn('flyctl', ['deploy', '--remote-only', '--app', appName], {
			cwd: frontendDir,
			env: flyEnv,
			stdio: ['ignore', 'pipe', 'pipe'],
			signal
		});
		let stderr = '';
		child.stdout.on('data', (c: Buffer) => emit({ type: 'step:output', stepId: flyId, data: c.toString(), timestamp: Date.now() }));
		child.stderr.on('data', (c: Buffer) => {
			stderr += c.toString();
			emit({ type: 'step:output', stepId: flyId, data: c.toString(), timestamp: Date.now() });
		});
		child.on('error', rejectFn);
		child.on('close', (code: number | null) => {
			if (code === 0) {
				emit({ type: 'step:pass', stepId: flyId, data: `Frontend deployed at https://${appName}.fly.dev`, timestamp: Date.now() });
				resolveFn();
				return;
			}
			emit({ type: 'step:fail', stepId: flyId, data: `flyctl deploy exited ${code}: ${stderr.slice(0, 300)}`, timestamp: Date.now() });
			rejectFn(new Error(`flyctl deploy failed: ${stderr.slice(0, 300)}`));
		});
	});

	emit({ type: 'phase:end', phase: 4, timestamp: Date.now() });
}

async function readSeedCoreVersion(
	factoryCoreAbs: string,
	seedsRepoAbs: string,
	seedTemplate: string
): Promise<string> {
	if (!seedTemplate) return '';
	// Read from the seed template itself rather than the scaffolded
	// factory.json — the latter inherits its core_version from the public
	// frontend template (hardcoded "1.0.0"), which would always fail the
	// staging compat check. The seed is the contract; the scaffold is a
	// derivative. Check builtin first, then library (matches the seed
	// store's combined listing order).
	const candidates = [
		resolve(factoryCoreAbs, 'typo3-extension', 'SeedTemplates', `${seedTemplate}.json`),
		resolve(seedsRepoAbs, 'seeds', seedTemplate, 'seed.json')
	];
	for (const path of candidates) {
		try {
			const json = JSON.parse(await readFile(path, 'utf-8'));
			if (typeof json.core_version === 'string' && json.core_version.length > 0) {
				return json.core_version;
			}
		} catch {
			// try the next candidate
		}
	}
	return '';
}

function deriveDomain(config: PipelineConfig): string {
	if (config.tenants[0]?.domain) return config.tenants[0].domain;
	if (config.typo3ApiBaseUrl) {
		try {
			return new URL(config.typo3ApiBaseUrl).host;
		} catch {
			// fall through
		}
	}
	return `${config.testProjectName}.example.com`;
}

async function publishPhase(
	config: PipelineConfig,
	projectRoot: string,
	projectDir: string,
	emit: Emit,
	signal: AbortSignal,
	bitbucketToken: string,
	flyApiToken: string | null
): Promise<void> {
	emit({ type: 'phase:start', phase: 4, phaseLabel: 'Publish to Bitbucket', timestamp: Date.now() });

	const workspace = config.bitbucketWorkspace.trim();
	const projectKey = config.bitbucketProjectKey.trim();
	const frontendOnly = !config.publishBackend;
	const repoDir = frontendOnly ? resolve(projectDir, 'frontend/app') : projectDir;
	const defaultSlug = frontendOnly ? `${config.testProjectName}-frontend` : config.testProjectName;
	const slug = (config.bitbucketRepoSlug.trim() || defaultSlug).toLowerCase();

	// Step 1: validate
	const validateId = 'publish-validate';
	emit({ type: 'step:start', stepId: validateId, data: 'Validating Bitbucket config', timestamp: Date.now() });
	if (!bitbucketToken) {
		emit({ type: 'step:fail', stepId: validateId, data: 'Missing BITBUCKET_TOKEN on server', timestamp: Date.now() });
		throw new Error('Missing BITBUCKET_TOKEN on server');
	}
	if (!workspace || !projectKey) {
		emit({ type: 'step:fail', stepId: validateId, data: 'Workspace and project key are required', timestamp: Date.now() });
		throw new Error('Workspace and project key are required');
	}
	if (!BITBUCKET_SLUG_RE.test(slug)) {
		emit({ type: 'step:fail', stepId: validateId, data: `Invalid repo slug "${slug}" — must be lowercase kebab-case`, timestamp: Date.now() });
		throw new Error(`Invalid repo slug: ${slug}`);
	}
	emit({ type: 'step:pass', stepId: validateId, data: `Target: ${workspace}/${slug}`, timestamp: Date.now() });

	// Step 2: remove factory-core symlinks. In frontend-only mode only the
	// frontend symlink matters; the backend one might not even exist.
	const symlinkId = 'publish-remove-symlinks';
	emit({ type: 'step:start', stepId: symlinkId, data: 'Removing factory-core symlinks', timestamp: Date.now() });
	const symlinkTargets = frontendOnly
		? ['factory-core']
		: ['backend/app/factory-core', 'frontend/app/factory-core'];
	for (const rel of symlinkTargets) {
		const link = resolve(repoDir, rel);
		if (await fileExists(link)) {
			await unlink(link);
			emit({ type: 'step:output', stepId: symlinkId, data: `Removed ${rel}`, timestamp: Date.now() });
		}
	}
	emit({ type: 'step:pass', stepId: symlinkId, data: 'Symlinks removed', timestamp: Date.now() });

	// Step 3: write .gitignore at the repo root (either project root or frontend/app).
	const gitignoreId = 'publish-gitignore';
	emit({ type: 'step:start', stepId: gitignoreId, data: `Writing ${frontendOnly ? 'frontend' : 'root'} .gitignore`, timestamp: Date.now() });
	const factoryCoreAbs = resolve(projectRoot, config.factoryCorePath);
	let baseIgnore = '';
	if (!frontendOnly) {
		try {
			baseIgnore = await readFile(resolve(factoryCoreAbs, 'templates/backend/.gitignore'), 'utf-8');
		} catch {
			// fall back to empty base — additions below still cover the essentials
		}
	}
	const additions = frontendOnly
		? [
			'# Factory Pipeline additions (frontend-only publish)',
			'node_modules/',
			'.nuxt/',
			'.output/',
			'dist/',
			'.env',
			'factory-core',
			'.DS_Store'
		  ].join('\n')
		: [
			'# Factory Pipeline additions',
			'**/node_modules/',
			'**/vendor/',
			'**/.env',
			'**/.env.app',
			'backend/app/factory-core',
			'frontend/app/factory-core',
			'**/.unison*',
			'**/perms*.set',
			'**/.DS_Store'
		  ].join('\n');
	const gitignoreContent = (baseIgnore ? baseIgnore.trimEnd() + '\n\n' : '') + additions + '\n';
	await writeFile(resolve(repoDir, '.gitignore'), gitignoreContent);
	emit({ type: 'step:pass', stepId: gitignoreId, data: '.gitignore written', timestamp: Date.now() });

	// Step 4: create Bitbucket repo
	const createId = 'publish-create-repo';
	emit({ type: 'step:start', stepId: createId, data: `POST /repositories/${workspace}/${slug}`, timestamp: Date.now() });
	if (signal.aborted) throw new Error('Aborted');
	let createRes: Response;
	try {
		createRes = await fetch(`https://api.bitbucket.org/2.0/repositories/${workspace}/${slug}`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${bitbucketToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				scm: 'git',
				is_private: true,
				project: { key: projectKey },
				mainbranch: { type: 'branch', name: 'main' },
				description: 'Scaffolded by Factory Pipeline'
			}),
			signal
		});
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		emit({ type: 'step:fail', stepId: createId, data: `Network error: ${msg}`, timestamp: Date.now() });
		throw err;
	}
	if (!createRes.ok) {
		const body = await createRes.text();
		let hint: string;
		switch (createRes.status) {
			case 400: hint = 'slug may already exist or is invalid'; break;
			case 401: hint = 'token rejected — check BITBUCKET_TOKEN'; break;
			case 403: hint = 'token missing required scopes (repository:admin, project:write)'; break;
			case 404: hint = 'workspace or project key not found'; break;
			default: hint = 'unexpected Bitbucket response';
		}
		const msg = `Bitbucket API ${createRes.status}: ${hint} — ${body.slice(0, 200)}`;
		emit({ type: 'step:fail', stepId: createId, data: msg, timestamp: Date.now() });
		throw new Error(msg);
	}
	emit({ type: 'step:pass', stepId: createId, data: `Repo created: https://bitbucket.org/${workspace}/${slug}`, timestamp: Date.now() });

	// Step 5: git init + commit (runGit injects identity flags)
	const gitIdentity = [
		'-c', 'user.email=factory@labor.digital',
		'-c', 'user.name=Factory Pipeline',
		'-c', 'init.defaultBranch=main'
	];
	const runGit = (args: string[], stepId: string) =>
		runCommand('git', [...gitIdentity, ...args], repoDir, emit, stepId, signal);

	await runGit(['init', '-b', 'main'], 'publish-git-init');
	await runGit(['add', '-A'], 'publish-git-add');
	await runGit(['commit', '-m', 'Initial scaffold via Factory Pipeline'], 'publish-git-commit');

	// Step 6: add remote (token-bearing URL, redacted in output)
	const remoteId = 'publish-remote-add';
	const remoteWithToken = `https://x-token-auth:${bitbucketToken}@bitbucket.org/${workspace}/${slug}.git`;
	emit({ type: 'step:start', stepId: remoteId, data: `git remote add origin https://x-token-auth:***@bitbucket.org/${workspace}/${slug}.git`, timestamp: Date.now() });
	// Run without streaming emit, so the token never appears in output
	await new Promise<void>((resolveFn, rejectFn) => {
		if (signal.aborted) { rejectFn(new Error('Aborted')); return; }
		const child = spawn('git', [...gitIdentity, 'remote', 'add', 'origin', remoteWithToken], {
			cwd: repoDir,
			env: { ...process.env },
			stdio: ['ignore', 'pipe', 'pipe'],
			signal
		});
		let stderr = '';
		child.stderr.on('data', (c: Buffer) => { stderr += c.toString(); });
		child.on('error', rejectFn);
		child.on('close', (code: number | null) => {
			if (code === 0) {
				resolveFn();
			} else {
				rejectFn(new Error(`git remote add failed (exit ${code}): ${redactToken(stderr).trim()}`));
			}
		});
	});
	emit({ type: 'step:pass', stepId: remoteId, data: 'Remote added', timestamp: Date.now() });

	// Step 7: push
	try {
		await runGit(['push', '-u', 'origin', 'main'], 'publish-git-push');
	} catch (err) {
		const pushMsg = `Repo was created at https://bitbucket.org/${workspace}/${slug} but push failed. Delete the repo in Bitbucket and re-run, or push manually.`;
		emit({ type: 'step:fail', stepId: 'publish-git-push', data: pushMsg, timestamp: Date.now() });
		throw err instanceof Error ? new Error(`${err.message} — ${pushMsg}`) : new Error(pushMsg);
	}

	// Step 8: rewrite remote to token-less URL so .git/config doesn't retain secrets
	await runGit(
		['remote', 'set-url', 'origin', `https://bitbucket.org/${workspace}/${slug}.git`],
		'publish-remote-rewrite'
	);

	// Step 9: Fly.io frontend provisioning (only for frontend-only publishes).
	// Full-monorepo publishes put the frontend under frontend/app/; Fly.io
	// expects fly.toml + bitbucket-pipelines.yml at the repo root, so this
	// path only makes sense when frontend/app/ IS the repo root.
	if (config.frontendHostingTarget === 'fly-io') {
		if (!frontendOnly) {
			emit({
				type: 'step:output',
				stepId: 'fly-skip',
				data: 'Skipping Fly.io provisioning: full-monorepo publish (publishBackend=true) is not supported. Set publishBackend=false for frontend-only + Fly.io.',
				timestamp: Date.now()
			});
		} else if (!flyApiToken) {
			emit({
				type: 'step:output',
				stepId: 'fly-skip',
				data: 'Skipping Fly.io provisioning: FLY_API_TOKEN not set on pipeline-app server.',
				timestamp: Date.now()
			});
		} else if (!config.flyIoOrgSlug.trim()) {
			emit({
				type: 'step:output',
				stepId: 'fly-skip',
				data: 'Skipping Fly.io provisioning: flyIoOrgSlug is empty.',
				timestamp: Date.now()
			});
		} else {
			await provisionFlyIoFrontend(config, repoDir, workspace, slug, bitbucketToken, flyApiToken, emit, signal);
		}
	}

	emit({ type: 'phase:end', phase: 4, data: `https://bitbucket.org/${workspace}/${slug}`, timestamp: Date.now() });
}

// ---------------------------------------------------------------------------
// Shared-tenant provisioning
// ---------------------------------------------------------------------------

async function sharedTenantPhase(
	config: PipelineConfig,
	emit: Emit,
	signal: AbortSignal
): Promise<void> {
	if (signal.aborted) throw new Error('Aborted');

	emit({
		type: 'phase:start',
		phase: 1,
		phaseLabel: 'Shared-Tenant Provisioning',
		timestamp: Date.now()
	});

	if (!config.sharedInstanceRepoPath) {
		throw new Error('sharedInstanceRepoPath is required in shared-tenant mode.');
	}
	if (!config.tenants || config.tenants.length === 0) {
		throw new Error('At least one tenant must be specified in shared-tenant mode.');
	}

	const stackDir = resolve(config.sharedInstanceRepoPath);
	try {
		const s = await stat(stackDir);
		if (!s.isDirectory()) {
			throw new Error(`sharedInstanceRepoPath is not a directory: ${stackDir}`);
		}
	} catch {
		throw new Error(`sharedInstanceRepoPath does not exist: ${stackDir}`);
	}

	const service = config.stackServiceName?.trim() || 'app';

	if (config.autoStartStack) {
		await runCommand(
			'docker',
			['compose', 'up', '-d', '--wait'],
			stackDir,
			emit,
			'stack:up',
			signal
		);
	} else {
		try {
			await assertContainerRunning(service, stackDir);
			emit({
				type: 'step:pass',
				stepId: 'stack:check',
				data: `Stack is running (service=${service}).`,
				timestamp: Date.now()
			});
		} catch (err) {
			throw new Error(
				`Shared-tenant stack not running and autoStartStack=false. ${
					err instanceof Error ? err.message : String(err)
				}`
			);
		}
	}

	for (const tenant of config.tenants) {
		validateTenant(tenant);
		const args = [
			'compose',
			'exec',
			'-T',
			service,
			'vendor/bin/typo3',
			'factory:tenant:provision',
			`--slug=${tenant.slug}`,
			`--domain=${tenant.domain}`,
			`--display-name=${tenant.displayName}`,
			`--components=${tenant.activeComponents.join(',')}`,
			`--record-types=${tenant.activeRecordTypes.join(',')}`,
			`--admin-email=${tenant.adminEmail}`
		];
		await runCommand('docker', args, stackDir, emit, `tenant:provision:${tenant.slug}`, signal);
	}

	emit({
		type: 'phase:end',
		phase: 1,
		data: `Provisioned ${config.tenants.length} tenant(s) into ${service}.`,
		timestamp: Date.now()
	});
}

/**
 * Placeholder for per-tenant frontend publishing in shared-tenant mode.
 * Today's pipeline doesn't scaffold per-tenant Nuxt frontends yet (the
 * scaffoldPhase only builds a single `{testProjectName}/frontend/app`),
 * so there's nothing tenant-specific to publish. When per-tenant frontend
 * scaffolding lands, this phase will iterate `config.tenants` and call a
 * factored `publishRepo()` helper for each, using the tenant slug as the
 * Bitbucket repo name.
 */
async function publishTenantFrontendsPhase(
	config: PipelineConfig,
	_projectRoot: string,
	emit: Emit,
	signal: AbortSignal
): Promise<void> {
	if (signal.aborted) throw new Error('Aborted');
	emit({ type: 'phase:start', phase: 4, phaseLabel: 'Publish Tenant Frontends', timestamp: Date.now() });
	for (const tenant of config.tenants) {
		emit({
			type: 'step:output',
			stepId: `publish:${tenant.slug}`,
			data: `Skipped: per-tenant frontend scaffolding for "${tenant.slug}" is not yet implemented. Scaffold the Nuxt app under ${config.testProjectName}/${tenant.slug}/frontend/app, then re-run Phase 4.`,
			timestamp: Date.now()
		});
	}
	emit({
		type: 'phase:end',
		phase: 4,
		data: 'No tenant frontends scaffolded — skipped.',
		timestamp: Date.now()
	});
}

function validateTenant(t: TenantSpec): void {
	if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(t.slug)) {
		throw new Error(`Invalid tenant slug "${t.slug}" — must match /^[a-z0-9][a-z0-9-]{0,62}$/.`);
	}
	if (!/^[a-z0-9.-]+$/i.test(t.domain)) {
		throw new Error(`Invalid tenant domain "${t.domain}".`);
	}
	if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t.adminEmail)) {
		throw new Error(`Invalid tenant adminEmail "${t.adminEmail}".`);
	}
	if (t.displayName.trim() === '') {
		throw new Error(`Tenant "${t.slug}" requires a non-empty displayName.`);
	}
}

// ---------------------------------------------------------------------------
// Main pipeline runner
// ---------------------------------------------------------------------------
export async function runPipeline(
	config: PipelineConfig,
	emit: Emit,
	signal: AbortSignal,
	bitbucketToken: string | null = null,
	flyApiToken: string | null = null
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
		// Target environment takes precedence over deploymentMode. Picking
		// `shared-tenant` for the form's tenants[] UI shouldn't bypass the
		// staging POST when the operator explicitly chose Staging as the
		// destination — staging is the live API, shared-tenant (local) is
		// the legacy script-emitter flow.
		if (config.targetEnvironment === 'prod') {
			emit({
				type: 'pipeline:error',
				data: 'Production target is disabled until the prod multitenant instance is provisioned (DL #015).',
				timestamp: Date.now()
			});
			return;
		}

		if (config.targetEnvironment === 'staging') {
			await teardownPhase(config, projectRoot, projectDir, emit, signal);
			await scaffoldPhase(config, projectRoot, projectDir, emit, signal);
			await componentPhase(config, projectRoot, projectDir, emit, signal);
			await stagingPhase(config, projectRoot, projectDir, emit, signal, flyApiToken);
			emit({ type: 'pipeline:done', timestamp: Date.now() });
			return;
		}

		if (config.deploymentMode === 'shared-tenant') {
			await sharedTenantPhase(config, emit, signal);
			if (config.includePhase4) {
				await publishTenantFrontendsPhase(config, projectRoot, emit, signal);
			}
			emit({ type: 'pipeline:done', timestamp: Date.now() });
			return;
		}

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

		if (config.includePhase4) {
			await publishPhase(config, projectRoot, projectDir, emit, signal, bitbucketToken ?? '', flyApiToken);
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
