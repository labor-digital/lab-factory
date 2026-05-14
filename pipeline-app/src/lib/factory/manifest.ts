import * as fs from 'node:fs';
import * as path from 'node:path';
import { FactoryError, type FactoryComponentManifest } from './types.js';

/**
 * Reads `<cwd>/../factory-core/manifest.json`. In a Factory-scaffolded project
 * the parent of the cwd (`backend/app/` or `frontend/app/`) has a `factory-core`
 * symlink to the monorepo's `factory-core/` directory, so this resolves.
 */
export async function fetchComponentManifest(cwd: string): Promise<FactoryComponentManifest> {
	const manifestPath = path.resolve(cwd, '../factory-core/manifest.json');

	if (!fs.existsSync(manifestPath)) {
		throw new FactoryError(
			`Factory component manifest not found at ${manifestPath}. ` +
				`Run factory commands from a scaffolded project's backend/app/src or frontend/app/src ` +
				`(the parent directory must contain a factory-core symlink to the monorepo's factory-core/).`
		);
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
	} catch (e) {
		throw new FactoryError(
			`Failed to parse Factory component manifest at ${manifestPath}: ${(e as Error).message}`
		);
	}

	if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
		throw new FactoryError(`Factory component manifest at ${manifestPath} is not a JSON object.`);
	}

	return parsed as FactoryComponentManifest;
}
