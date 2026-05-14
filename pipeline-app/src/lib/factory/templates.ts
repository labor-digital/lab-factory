import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Recursively walks `dir` and replaces literal placeholder strings in every
 * UTF-8 readable file. Binaries and unreadable files are skipped silently —
 * matches the lab-cli behavior so scaffolded template asset files don't break.
 */
export function replaceInDir(dir: string, replacements: Record<string, string>): void {
	const entries = fs.readdirSync(dir);
	for (const name of entries) {
		const filePath = path.join(dir, name);
		const st = fs.statSync(filePath);
		if (st.isDirectory()) {
			replaceInDir(filePath, replacements);
			continue;
		}
		if (!st.isFile()) continue;
		try {
			let content = fs.readFileSync(filePath, 'utf-8');
			let changed = false;
			for (const [needle, value] of Object.entries(replacements)) {
				if (content.includes(needle)) {
					content = content.replaceAll(needle, value);
					changed = true;
				}
			}
			if (changed) fs.writeFileSync(filePath, content, 'utf-8');
		} catch {
			// non-utf8 or unreadable file — skip
		}
	}
}
