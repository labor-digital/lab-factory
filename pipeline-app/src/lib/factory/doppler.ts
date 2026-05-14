import { runSync } from './exec.js';
import { FactoryError } from './types.js';

/**
 * Thin wrapper around the Doppler CLI used by `factory:create`. The wrapper
 * shells out via `execFile` (no shell interpolation), so each argument is
 * passed unmodified — no command-injection from project names or secret
 * values.
 */
export class Doppler {
	isInstalled(): boolean {
		try {
			runSync('doppler', ['--version']);
			return true;
		} catch {
			return false;
		}
	}

	isLoggedIn(): boolean {
		try {
			runSync('doppler', ['me', '--json']);
			return true;
		} catch {
			return false;
		}
	}

	projectExists(projectName: string): boolean {
		try {
			runSync('doppler', ['projects', 'get', '-p', projectName, '--json']);
			return true;
		} catch {
			return false;
		}
	}

	createProject(projectName: string): void {
		try {
			runSync('doppler', ['projects', 'create', projectName, '--json']);
		} catch (e) {
			throw new FactoryError(
				`Failed to create Doppler project "${projectName}": ${(e as Error).message}`
			);
		}
	}

	deleteProject(projectName: string): void {
		try {
			runSync('doppler', ['projects', 'delete', '-p', projectName, '--yes']);
		} catch (e) {
			throw new FactoryError(
				`Failed to delete Doppler project "${projectName}": ${(e as Error).message}`
			);
		}
	}

	createEnvironment(projectName: string, envName: string, slug?: string): void {
		const envSlug = slug ?? envName;
		try {
			runSync('doppler', ['environments', 'create', envName, envSlug, '-p', projectName, '--json']);
		} catch (e) {
			throw new FactoryError(
				`Failed to create Doppler environment "${envName}" in project "${projectName}": ${(e as Error).message}`
			);
		}
	}

	setSecrets(projectName: string, configName: string, secrets: Record<string, string>): void {
		const pairs = Object.entries(secrets).map(([k, v]) => `${k}=${v}`);
		if (pairs.length === 0) return;
		try {
			runSync('doppler', ['secrets', 'set', ...pairs, '-p', projectName, '-c', configName]);
		} catch (e) {
			throw new FactoryError(
				`Failed to set Doppler secrets in ${projectName}/${configName}: ${(e as Error).message}`
			);
		}
	}
}
