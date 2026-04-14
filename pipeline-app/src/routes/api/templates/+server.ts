import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import type { SeedTemplate } from '$lib/pipeline/types.js';

export const GET: RequestHandler = async () => {
	const projectRoot = resolve(dirname(new URL(import.meta.url).pathname), '..', '..', '..', '..', '..');
	const templatesDir = resolve(projectRoot, 'factory-core', 'typo3-extension', 'SeedTemplates');

	try {
		const files = await readdir(templatesDir);
		const templates: SeedTemplate[] = [];

		for (const file of files) {
			if (!file.endsWith('.json')) continue;
			const slug = file.replace('.json', '');
			const content = await readFile(resolve(templatesDir, file), 'utf-8');
			const parsed = JSON.parse(content);

			// Extract unique component slugs and convert to PascalCase
			const slugs: string[] = (parsed.elements || [])
				.map((e: { component?: string }) => e.component)
				.filter(Boolean);
			const components = [...new Set(slugs)].map(
				(s: string) => s.replace(/(^|-)([a-z])/g, (_: string, __: string, c: string) => c.toUpperCase())
			);

			const recordTypes: string[] = Array.isArray(parsed.record_types)
				? parsed.record_types.filter((r: unknown): r is string => typeof r === 'string')
				: [];

			templates.push({
				name: parsed.name ?? slug,
				slug,
				description: parsed.description ?? '',
				components,
				recordTypes,
				...(parsed.settings ? { settings: parsed.settings } : {})
			});
		}

		return json(templates);
	} catch {
		return json([]);
	}
};
