import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {addPlugin, addTemplate, defineNuxtModule, useLogger} from '@nuxt/kit';

interface FactorySettings {
	colors?: Record<string, string>
	radius?: string
	fonts?: { sans?: string; mono?: string }
	breakpoints?: Record<string, string>
	colorMode?: 'system' | 'light' | 'dark'
}

interface FactoryConfig {
	settings?: FactorySettings
}

const logger = useLogger('factory-settings');

function readSettings(configPath: string): FactorySettings | null {
	try {
		const raw = readFileSync(configPath, 'utf-8');
		const parsed = JSON.parse(raw) as FactoryConfig;
		return parsed.settings ?? null;
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		logger.warn(`Unable to read factory settings from ${configPath}: ${message}`);
		return null;
	}
}

function buildThemeCss(settings: FactorySettings): string {
	const lines: string[] = [];

	if (settings.radius) {
		lines.push(`:root { --ui-radius: ${settings.radius}; }`);
	}

	const themeLines: string[] = [];

	if (settings.fonts?.sans) {
		themeLines.push(`  --font-sans: '${settings.fonts.sans}', system-ui, sans-serif;`);
	}
	if (settings.fonts?.mono) {
		themeLines.push(`  --font-mono: '${settings.fonts.mono}', monospace;`);
	}

	if (settings.breakpoints) {
		for (const [name, value] of Object.entries(settings.breakpoints)) {
			themeLines.push(`  --breakpoint-${name}: ${value};`);
		}
	}

	if (themeLines.length > 0) {
		lines.push(`@theme {\n${themeLines.join('\n')}\n}`);
	}

	return lines.join('\n\n');
}

export default defineNuxtModule({
	meta: {
		name: 'factory-settings',
		configKey: 'factorySettings'
	},
	setup(_options, nuxt) {
		const configPath = resolve(nuxt.options.rootDir, 'factory.json');
		const settings = readSettings(configPath);

		if (!settings) {
			logger.info('No settings found in factory.json — using defaults');
			return;
		}

		if (settings.colors) {
			const colorsJson = JSON.stringify(settings.colors);
			const {dst} = addTemplate({
				filename: 'factory-colors.ts',
				write: true,
				getContents: () => `
import { defineNuxtPlugin, updateAppConfig } from '#imports'

export default defineNuxtPlugin(() => {
	updateAppConfig({
		ui: {
			colors: ${colorsJson}
		}
	})
})
`
			});
			addPlugin(dst);
		}

		if (settings.colorMode) {
			nuxt.options.colorMode = nuxt.options.colorMode || {};
			nuxt.options.colorMode.preference = settings.colorMode;

			// When forcing light or dark, add a plugin that overrides the user's
			// stored preference on every page load so the mode cannot be toggled.
			if (settings.colorMode !== 'system') {
				const {dst} = addTemplate({
					filename: 'factory-force-color-mode.ts',
					write: true,
					getContents: () => `
import { defineNuxtPlugin, useColorMode } from '#imports'

export default defineNuxtPlugin(() => {
	const colorMode = useColorMode()
	colorMode.preference = '${settings.colorMode}'
	colorMode.forced = true
})
`
				});
				addPlugin(dst);
			}
		}

		const themeCss = buildThemeCss(settings);
		if (themeCss) {
			const {dst} = addTemplate({
				filename: 'factory-settings.css',
				write: true,
				getContents: () => themeCss
			});
			nuxt.options.css.push(dst);
		}
	}
});
