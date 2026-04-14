import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {addPlugin, addTemplate, defineNuxtModule, useLogger} from '@nuxt/kit';

interface FactorySettings {
	colors?: Record<string, string>
	radius?: string
	fonts?: { sans?: string; mono?: string }
	breakpoints?: Record<string, string>
	colorMode?: 'system' | 'light' | 'dark'
	placeholderImageBaseUrl?: string
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

// --- Hex → oklch palette generation ---

function hexToRgb(hex: string): [number, number, number] {
	const h = hex.replace('#', '');
	return [
		parseInt(h.substring(0, 2), 16) / 255,
		parseInt(h.substring(2, 4), 16) / 255,
		parseInt(h.substring(4, 6), 16) / 255,
	];
}

function linearize(c: number): number {
	return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function rgbToOklch(r: number, g: number, b: number): [number, number, number] {
	const lr = linearize(r), lg = linearize(g), lb = linearize(b);

	const l_ = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
	const m_ = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
	const s_ = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

	const l = Math.cbrt(l_), m = Math.cbrt(m_), s = Math.cbrt(s_);

	const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
	const a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
	const bVal = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;

	const C = Math.sqrt(a * a + bVal * bVal);
	let h = Math.atan2(bVal, a) * (180 / Math.PI);
	if (h < 0) h += 360;

	return [L, C, h];
}

const SHADE_LIGHTNESS: Record<number, number> = {
	50: 0.97, 100: 0.94, 200: 0.88, 300: 0.80, 400: 0.70,
	500: 0.59, 600: 0.50, 700: 0.42, 800: 0.35, 900: 0.30, 950: 0.25,
};

function generatePalette(hex: string): Record<number, string> {
	const [r, g, b] = hexToRgb(hex);
	const [, baseC, baseH] = rgbToOklch(r, g, b);

	const palette: Record<number, string> = {};
	for (const [shade, targetL] of Object.entries(SHADE_LIGHTNESS)) {
		// Scale chroma: full at mid-lightness, reduced at extremes
		const midDistance = Math.abs(targetL - 0.5);
		const chromaScale = Math.max(0.1, 1 - midDistance * 1.2);
		const c = baseC * chromaScale;

		palette[Number(shade)] = `oklch(${(targetL * 100).toFixed(1)}% ${c.toFixed(3)} ${baseH.toFixed(3)})`;
	}
	return palette;
}

function isHexColor(value: string): boolean {
	return /^#[0-9a-fA-F]{6}$/.test(value);
}

// --- CSS generation ---

function buildThemeCss(settings: FactorySettings): string {
	const lines: string[] = [];

	if (settings.radius) {
		lines.push(`:root { --ui-radius: ${settings.radius}; }`);
	}

	// Generate palettes for hex colors
	if (settings.colors) {
		const rootVars: string[] = [];
		const darkVars: string[] = [];

		for (const [semantic, value] of Object.entries(settings.colors)) {
			if (!isHexColor(value)) continue;

			const palette = generatePalette(value);
			for (const [shade, oklch] of Object.entries(palette)) {
				rootVars.push(`  --ui-color-${semantic}-${shade}: ${oklch};`);
			}
			// Light mode: use 500 shade, dark mode: use 400 shade
			rootVars.push(`  --ui-${semantic}: var(--ui-color-${semantic}-500);`);
			darkVars.push(`  --ui-${semantic}: var(--ui-color-${semantic}-400);`);
		}

		if (rootVars.length > 0) {
			lines.push(`:root {\n${rootVars.join('\n')}\n}`);
		}
		if (darkVars.length > 0) {
			lines.push(`.dark {\n${darkVars.join('\n')}\n}`);
		}
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

		if (settings.colors || settings.placeholderImageBaseUrl) {
			// Only pass Tailwind-named colors to updateAppConfig (hex colors are handled via CSS)
			const namedColors: Record<string, string> = {};
			if (settings.colors) {
				for (const [key, value] of Object.entries(settings.colors)) {
					if (!isHexColor(value)) {
						namedColors[key] = value;
					}
				}
			}
			const colorsJson = Object.keys(namedColors).length > 0 ? JSON.stringify(namedColors) : null;
			const placeholderUrl = settings.placeholderImageBaseUrl || '';
			const {dst} = addTemplate({
				filename: 'factory-app-config.ts',
				write: true,
				getContents: () => `
import { defineNuxtPlugin, updateAppConfig } from '#imports'

export default defineNuxtPlugin(() => {
	updateAppConfig({
		${colorsJson ? `ui: { colors: ${colorsJson} },` : ''}
		factory: {
			placeholderImageBaseUrl: '${placeholderUrl}'
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
