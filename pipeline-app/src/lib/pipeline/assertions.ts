import { access, readFile, constants } from 'node:fs/promises';
import type { StepEvent } from './types.js';

export async function assertFileExists(
	filePath: string,
	label: string,
	emit: (event: StepEvent) => void
): Promise<boolean> {
	const stepId = `assert-file-${label.replace(/\s+/g, '-').toLowerCase()}`;
	emit({ type: 'step:start', stepId, data: `Assert file exists: ${label}`, timestamp: Date.now() });

	try {
		await access(filePath, constants.F_OK);
		emit({ type: 'step:pass', stepId, data: `File exists: ${label}`, timestamp: Date.now() });
		return true;
	} catch {
		emit({
			type: 'step:fail',
			stepId,
			data: `Expected file not found: ${label} (${filePath})`,
			timestamp: Date.now()
		});
		return false;
	}
}

export async function assertJsonContains(
	filePath: string,
	value: string,
	emit: (event: StepEvent) => void
): Promise<boolean> {
	const stepId = `assert-json-${value.toLowerCase()}`;
	emit({
		type: 'step:start',
		stepId,
		data: `Assert active_components contains '${value}'`,
		timestamp: Date.now()
	});

	try {
		const content = await readFile(filePath, 'utf-8');
		const json = JSON.parse(content);
		const components: string[] = json.active_components ?? [];

		if (components.includes(value)) {
			emit({
				type: 'step:pass',
				stepId,
				data: `active_components contains '${value}' in ${filePath}`,
				timestamp: Date.now()
			});
			return true;
		} else {
			emit({
				type: 'step:fail',
				stepId,
				data: `active_components in ${filePath} does not contain '${value}'`,
				timestamp: Date.now()
			});
			return false;
		}
	} catch (err) {
		emit({
			type: 'step:fail',
			stepId,
			data: `Failed to read/parse ${filePath}: ${err}`,
			timestamp: Date.now()
		});
		return false;
	}
}
