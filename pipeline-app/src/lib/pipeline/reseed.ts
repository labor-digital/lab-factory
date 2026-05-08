import { spawn } from 'node:child_process';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import type {
	AppliedSeedSnapshot,
	FactorySettings,
	ReseedRequest,
	SeedDiff,
	StepEvent
} from './types.js';
import { diffSeeds } from '$lib/seeds/diff.js';
import { listSeeds, loadSeedPayload } from '$lib/seeds/store.js';
import { DEFAULT_CONFIG } from './config.js';

type Emit = (event: StepEvent) => void;

function factoryMonorepoRoot(): string {
	return resolve(dirname(new URL(import.meta.url).pathname), '..', '..', '..', '..');
}

function resolveFromMonorepo(maybeRelative: string): string {
	if (maybeRelative.startsWith('/')) return maybeRelative;
	return resolve(factoryMonorepoRoot(), maybeRelative);
}

function kebabToPascal(kebab: string): string {
	return kebab.replace(/(^|-)([a-z])/g, (_: string, __: string, c: string) => c.toUpperCase());
}

async function readApplied(projectDir: string, projectName: string, seedSlug: string): Promise<AppliedSeedSnapshot | null> {
	try {
		const path = resolve(projectDir, 'frontend/app/src/factory.json');
		const json = JSON.parse(await readFile(path, 'utf-8'));
		const components = (json.active_components ?? []) as string[];
		const recordTypes = (json.active_record_types ?? []) as string[];
		const settings = (json.settings ?? {}) as Partial<FactorySettings>;
		return {
			projectName,
			seedSlug,
			source: 'library',
			activeComponents: components,
			activeRecordTypes: recordTypes,
			settings,
			appliedAt: ''
		};
	} catch {
		return null;
	}
}

interface SpawnOptions {
	cwd: string;
	emit: Emit;
	stepId: string;
	signal: AbortSignal;
}

async function runCommand(cmd: string, args: string[], opts: SpawnOptions): Promise<void> {
	return new Promise((resolveP, reject) => {
		if (opts.signal.aborted) {
			reject(new Error('Aborted'));
			return;
		}

		const display = `${cmd} ${args.join(' ')}`;
		opts.emit({ type: 'step:start', stepId: opts.stepId, data: display, timestamp: Date.now() });

		const child = spawn(cmd, args, {
			cwd: opts.cwd,
			env: { ...process.env },
			stdio: ['ignore', 'pipe', 'pipe'],
			signal: opts.signal
		});

		const onLine = (chunk: Buffer) => {
			for (const line of chunk.toString().split('\n')) {
				if (line.trim()) {
					opts.emit({ type: 'step:output', stepId: opts.stepId, data: line, timestamp: Date.now() });
				}
			}
		};
		child.stdout.on('data', onLine);
		child.stderr.on('data', onLine);

		child.on('error', reject);
		child.on('close', (code) => {
			if (code === 0) {
				opts.emit({ type: 'step:pass', stepId: opts.stepId, timestamp: Date.now() });
				resolveP();
			} else {
				opts.emit({
					type: 'step:fail',
					stepId: opts.stepId,
					data: `exit ${code}`,
					timestamp: Date.now()
				});
				reject(new Error(`${display} exited with code ${code}`));
			}
		});
	});
}

interface RewriteResult {
	frontendChanged: boolean;
	backendChanged: boolean;
}

async function rewriteFactoryJson(
	projectDir: string,
	patch: { active_components?: string[]; active_record_types?: string[]; settings?: Partial<FactorySettings> },
	emit: Emit,
	stepId: string
): Promise<RewriteResult> {
	const result: RewriteResult = { frontendChanged: false, backendChanged: false };
	for (const subdir of ['frontend/app/src/factory.json', 'backend/app/src/factory.json'] as const) {
		const path = resolve(projectDir, subdir);
		try {
			const current = JSON.parse(await readFile(path, 'utf-8'));
			const next = { ...current };
			if (patch.active_components) next.active_components = patch.active_components;
			if (patch.active_record_types) next.active_record_types = patch.active_record_types;
			if (patch.settings) next.settings = { ...(current.settings ?? {}), ...patch.settings };
			await writeFile(path, JSON.stringify(next, null, '\t') + '\n', 'utf-8');
			emit({
				type: 'step:output',
				stepId,
				data: `wrote ${subdir}`,
				timestamp: Date.now()
			});
			if (subdir.startsWith('frontend')) result.frontendChanged = true;
			if (subdir.startsWith('backend')) result.backendChanged = true;
		} catch (err) {
			emit({
				type: 'step:output',
				stepId,
				data: `skip ${subdir}: ${(err as Error).message}`,
				timestamp: Date.now()
			});
		}
	}
	return result;
}

async function projectDirExists(projectDir: string): Promise<boolean> {
	try {
		const s = await stat(projectDir);
		return s.isDirectory();
	} catch {
		return false;
	}
}

export interface ReseedResult {
	mode: SeedDiff['mode'];
	reasons: string[];
}

/**
 * Re-applies a seed to a running local stack without `docker compose down`
 * + rebuild. Picks `theming-only` (rewrite factory.json + nudge Nuxt HMR)
 * or `db-reseed` (rewrite factory.json + run `factory:seed:reset` in the
 * backend container) based on the diff. The operator can force either
 * path via `request.force`.
 */
export async function runReseed(
	request: ReseedRequest,
	emit: Emit,
	signal: AbortSignal,
	overrides?: { seedsRepoPath?: string; factoryCorePath?: string }
): Promise<ReseedResult> {
	const seedsRepoPath = overrides?.seedsRepoPath ?? DEFAULT_CONFIG.seedsRepoPath;
	const factoryCorePath = overrides?.factoryCorePath ?? DEFAULT_CONFIG.factoryCorePath;
	const projectName = request.projectName || DEFAULT_CONFIG.testProjectName;
	const projectDir = resolve(factoryMonorepoRoot(), projectName);

	emit({ type: 'phase:start', phase: 0, phaseLabel: 'Reseed', timestamp: Date.now() });

	if (!(await projectDirExists(projectDir))) {
		emit({
			type: 'pipeline:error',
			data: `Project directory ${projectDir} does not exist. Run a full pipeline first.`,
			timestamp: Date.now()
		});
		throw new Error('project_not_scaffolded');
	}

	const stepLoad = 'reseed:load-seed';
	emit({ type: 'step:start', stepId: stepLoad, data: `load seed "${request.seedSlug}"`, timestamp: Date.now() });
	const payload = await loadSeedPayload({ seedsRepoPath, factoryCorePath }, request.source, request.seedSlug);
	if (!payload) {
		emit({ type: 'step:fail', stepId: stepLoad, data: 'seed not found', timestamp: Date.now() });
		throw new Error('seed_not_found');
	}
	emit({ type: 'step:pass', stepId: stepLoad, timestamp: Date.now() });

	// Resolve the entry to know how the unified store named the components
	const { entries } = await listSeeds({ seedsRepoPath, factoryCorePath });
	const entry = entries.find((e) => e.slug === request.seedSlug && e.source === request.source);
	const candidate = {
		activeComponents: entry?.components ?? [],
		activeRecordTypes: entry?.recordTypes ?? [],
		settings: payload.settings,
		elements: payload.elements
	};

	const stepDiff = 'reseed:diff';
	emit({ type: 'step:start', stepId: stepDiff, data: 'compute diff', timestamp: Date.now() });
	const current = await readApplied(projectDir, projectName, request.seedSlug);
	const diff = diffSeeds(current, candidate);
	const mode: SeedDiff['mode'] = request.force ?? diff.mode;
	emit({
		type: 'step:output',
		stepId: stepDiff,
		data: `auto=${diff.mode} chosen=${mode} reasons=${diff.reasons.join('; ')}`,
		timestamp: Date.now()
	});
	emit({ type: 'step:pass', stepId: stepDiff, timestamp: Date.now() });

	if (mode === 'no-op') {
		emit({ type: 'pipeline:done', data: 'no changes', timestamp: Date.now() });
		emit({ type: 'phase:end', phase: 0, timestamp: Date.now() });
		return { mode, reasons: diff.reasons };
	}

	const stepWrite = 'reseed:rewrite-factory-json';
	emit({ type: 'step:start', stepId: stepWrite, data: 'rewrite factory.json', timestamp: Date.now() });
	await rewriteFactoryJson(
		projectDir,
		{
			active_components: candidate.activeComponents,
			active_record_types: candidate.activeRecordTypes,
			settings: candidate.settings
		},
		emit,
		stepWrite
	);
	emit({ type: 'step:pass', stepId: stepWrite, timestamp: Date.now() });

	if (mode === 'theming-only') {
		const stepHmr = 'reseed:nudge-nuxt-hmr';
		try {
			await runCommand(
				'docker',
				['compose', 'exec', '-T', 'frontend', 'touch', '/var/www/html/factory.json'],
				{ cwd: resolve(projectDir, 'frontend/app'), emit, stepId: stepHmr, signal }
			);
		} catch (err) {
			emit({
				type: 'step:output',
				stepId: stepHmr,
				data: `HMR nudge failed: ${(err as Error).message} (file write succeeded; reload manually)`,
				timestamp: Date.now()
			});
		}
		emit({ type: 'pipeline:done', data: 'theming-only reseed complete', timestamp: Date.now() });
		emit({ type: 'phase:end', phase: 0, timestamp: Date.now() });
		return { mode, reasons: diff.reasons };
	}

	// db-reseed path
	const componentSlugs = candidate.activeComponents.map((c) => c.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()).join(',');
	const stepReset = 'reseed:factory-seed-reset';
	await runCommand(
		'docker',
		[
			'compose',
			'exec',
			'-T',
			'-w',
			'/var/www/html',
			'app',
			'vendor/bin/typo3',
			'factory:seed:reset',
			'--seed-template',
			request.seedSlug,
			'-y'
		],
		{ cwd: resolve(projectDir, 'backend/app'), emit, stepId: stepReset, signal }
	);

	const stepCacheFlush = 'reseed:cache-flush';
	await runCommand(
		'docker',
		['compose', 'exec', '-T', 'app', 'vendor/bin/typo3', 'cache:flush'],
		{ cwd: resolve(projectDir, 'backend/app'), emit, stepId: stepCacheFlush, signal }
	);

	void componentSlugs; // reserved for future seed-reset flag
	emit({ type: 'pipeline:done', data: 'db-reseed complete', timestamp: Date.now() });
	emit({ type: 'phase:end', phase: 0, timestamp: Date.now() });
	return { mode, reasons: diff.reasons };
}
