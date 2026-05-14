#!/usr/bin/env tsx
/**
 * Headless CLI wrapper around the pipeline-app factory module. Lets shell
 * scripts (test-pipeline.sh, CI) drive `factory:create`, `factory:add`,
 * and `factory:upgrade` without booting SvelteKit.
 *
 * Output: each step emits one NDJSON line to stdout. The final line is the
 * subcommand's success/error result. Errors exit non-zero.
 *
 *   npx tsx bin/factory.ts create my-client --template-path /abs/path --force \
 *       --secret APP_ENCRYPTION_KEY=abc --secret TYPO3_API_BASE_URL=https://...
 *   npx tsx bin/factory.ts add hero --cwd ./backend/app/src
 *   npx tsx bin/factory.ts upgrade --cwd ./backend/app/src --target 1.6.0
 */

import * as path from 'node:path';
import { addComponent, createProject, upgradeCore, FactoryError } from '../src/lib/factory/index.js';
import type { StepEvent } from '../src/lib/pipeline/types.js';

const emit = (event: StepEvent) => {
	process.stdout.write(JSON.stringify(event) + '\n');
};

interface ParsedArgs {
	positional: string[];
	flags: Record<string, string | boolean>;
	multi: Record<string, string[]>;
}

function parseArgs(argv: string[]): ParsedArgs {
	const positional: string[] = [];
	const flags: Record<string, string | boolean> = {};
	const multi: Record<string, string[]> = {};
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg.startsWith('--')) {
			const key = arg.slice(2);
			const next = argv[i + 1];
			if (next !== undefined && !next.startsWith('--')) {
				// Allow repeats for --secret
				if (key === 'secret') {
					(multi[key] ??= []).push(next);
				} else {
					flags[key] = next;
				}
				i++;
			} else {
				flags[key] = true;
			}
		} else {
			positional.push(arg);
		}
	}
	return { positional, flags, multi };
}

function parseSecrets(entries: string[]): Record<string, string> {
	const out: Record<string, string> = {};
	for (const entry of entries) {
		const eq = entry.indexOf('=');
		if (eq <= 0) continue;
		out[entry.slice(0, eq)] = entry.slice(eq + 1);
	}
	return out;
}

async function run() {
	const argv = process.argv.slice(2);
	const subcommand = argv[0];
	const rest = argv.slice(1);

	if (!subcommand || subcommand === '--help' || subcommand === '-h') {
		process.stdout.write(
			'Usage:\n' +
				'  factory create <project-name> --template-path <abs> [--force] [--secret K=V ...]\n' +
				'  factory add <component-name> [--cwd <dir>] [--factory <path>]\n' +
				'  factory upgrade [--cwd <dir>] [--factory <path>] [--target <version>]\n'
		);
		process.exit(subcommand ? 0 : 1);
	}

	const { positional, flags, multi } = parseArgs(rest);
	const cwd = typeof flags.cwd === 'string' ? path.resolve(flags.cwd) : process.cwd();

	try {
		if (subcommand === 'create') {
			const projectName = positional[0];
			if (!projectName) throw new FactoryError('Project name is required.');
			const templatePath = typeof flags['template-path'] === 'string' ? flags['template-path'] : '';
			if (!templatePath) throw new FactoryError('--template-path is required.');
			const targetDir = path.resolve(cwd, projectName);
			const result = await createProject(
				{
					projectName,
					targetDir,
					templatePath: path.resolve(cwd, templatePath),
					force: flags.force === true,
					secrets: parseSecrets(multi.secret ?? [])
				},
				emit
			);
			process.stdout.write(JSON.stringify(result) + '\n');
		} else if (subcommand === 'add') {
			const componentName = positional[0];
			if (!componentName) throw new FactoryError('Component name is required.');
			const factoryJsonPath =
				typeof flags.factory === 'string' ? flags.factory : undefined;
			const result = await addComponent({ componentName, cwd, factoryJsonPath }, emit);
			process.stdout.write(JSON.stringify(result) + '\n');
		} else if (subcommand === 'upgrade') {
			const targetVersion = typeof flags.target === 'string' ? flags.target : undefined;
			const factoryJsonPath =
				typeof flags.factory === 'string' ? flags.factory : undefined;
			const result = await upgradeCore({ cwd, factoryJsonPath, targetVersion }, emit);
			process.stdout.write(JSON.stringify(result) + '\n');
		} else {
			throw new FactoryError(`Unknown subcommand: ${subcommand}`);
		}
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		process.stdout.write(JSON.stringify({ status: 'error', message }) + '\n');
		process.exit(1);
	}
}

run();
