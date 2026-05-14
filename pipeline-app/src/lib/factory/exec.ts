import { spawn, type SpawnOptions } from 'node:child_process';
import { execFileSync } from 'node:child_process';
import type { FactoryEmit } from './types.js';

export interface RunOptions {
	cwd?: string;
	stepId?: string;
	emit?: FactoryEmit;
	signal?: AbortSignal;
	env?: NodeJS.ProcessEnv;
}

export interface RunResult {
	stdout: string;
	stderr: string;
}

/**
 * Streaming child-process runner. Pipes stdout/stderr line-by-line into the
 * optional emit() so callers see live progress, and resolves with the full
 * buffered output. Rejects on non-zero exit with an Error whose message
 * carries the failing command line.
 */
export function runStreaming(cmd: string, args: string[], opts: RunOptions = {}): Promise<RunResult> {
	const { cwd, stepId, emit, signal, env } = opts;
	return new Promise((res, rej) => {
		if (signal?.aborted) {
			rej(new Error('Aborted'));
			return;
		}

		const spawnOpts: SpawnOptions = {
			cwd,
			env: { ...process.env, ...(env ?? {}) },
			stdio: ['ignore', 'pipe', 'pipe']
		};
		if (signal) spawnOpts.signal = signal;

		const child = spawn(cmd, args, spawnOpts);
		let stdout = '';
		let stderr = '';

		child.stdout?.on('data', (chunk: Buffer) => {
			const text = chunk.toString();
			stdout += text;
			if (emit && stepId) {
				for (const line of text.split('\n')) {
					if (line.trim()) emit({ type: 'step:output', stepId, data: line, timestamp: Date.now() });
				}
			}
		});

		child.stderr?.on('data', (chunk: Buffer) => {
			const text = chunk.toString();
			stderr += text;
			if (emit && stepId) {
				for (const line of text.split('\n')) {
					if (line.trim()) emit({ type: 'step:output', stepId, data: line, timestamp: Date.now() });
				}
			}
		});

		child.on('error', (err) => rej(err));
		child.on('close', (code) => {
			if (code === 0) res({ stdout, stderr });
			else rej(new Error(`${cmd} ${args.join(' ')} exited with code ${code}: ${stderr.trim() || stdout.trim()}`));
		});
	});
}

/**
 * Sync command runner for short, non-interactive Doppler/CLI calls where we
 * only care about success/failure or a single JSON payload. Throws on
 * non-zero exit. Caller handles the catch.
 */
export function runSync(cmd: string, args: string[], cwd?: string): string {
	return execFileSync(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf-8' }).toString();
}

export function emitStart(emit: FactoryEmit | undefined, stepId: string, data: string): void {
	emit?.({ type: 'step:start', stepId, data, timestamp: Date.now() });
}

export function emitOutput(emit: FactoryEmit | undefined, stepId: string, data: string): void {
	emit?.({ type: 'step:output', stepId, data, timestamp: Date.now() });
}

export function emitPass(emit: FactoryEmit | undefined, stepId: string, data: string): void {
	emit?.({ type: 'step:pass', stepId, data, timestamp: Date.now() });
}

export function emitFail(emit: FactoryEmit | undefined, stepId: string, data: string): void {
	emit?.({ type: 'step:fail', stepId, data, timestamp: Date.now() });
}
