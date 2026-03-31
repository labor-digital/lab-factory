import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

export const GET: RequestHandler = async () => {
	const projectRoot = resolve(dirname(new URL(import.meta.url).pathname), '..', '..', '..', '..', '..');
	const manifestPath = resolve(projectRoot, 'factory-core', 'manifest.json');

	try {
		const content = await readFile(manifestPath, 'utf-8');
		return json(JSON.parse(content));
	} catch (err) {
		return json(
			{ error: `Failed to read manifest: ${err}` },
			{ status: 500 }
		);
	}
};
