import type { AppliedSeedSnapshot, FactorySettings, SeedDiff } from '$lib/pipeline/types.js';

/**
 * Shape of the inputs to `diffSeeds()`. We only look at the fields that
 * actually change between two seeds at apply time — `name`/`description`/
 * thumbnail edits don't trigger a reseed, intentionally.
 */
export interface CandidateSeed {
	activeComponents: string[];
	activeRecordTypes: string[];
	settings?: Partial<FactorySettings>;
	/** Optional: when present, structural changes here are routed to db-reseed. */
	elements?: Array<{ component?: string; data?: Record<string, unknown> }>;
}

/**
 * Decides what kind of reseed (if any) is needed to move a running stack
 * from `current` to `next`.
 *
 * - `db-reseed` when `active_components`, `active_record_types`, or the
 *   template `elements` array changes — those drive page-tree / TCA / DB
 *   state and need `factory:seed:reset`.
 * - `theming-only` when only `settings.colors|fonts|breakpoints|radius|
 *   colorMode|placeholderImageBaseUrl` change — those flow through
 *   factory.json and Nuxt HMR; no DB touch.
 * - `no-op` when both are equal. The operator can still force-apply.
 *
 * `current` is null when the project has never been seeded (or when the
 * tracked snapshot was lost). In that case we always recommend `db-reseed`.
 */
export function diffSeeds(current: AppliedSeedSnapshot | null, next: CandidateSeed): SeedDiff {
	if (current === null) {
		return { mode: 'db-reseed', reasons: ['No applied-seed snapshot — assuming first apply.'] };
	}

	const reasons: string[] = [];

	if (!arraysEqualIgnoringOrder(current.activeComponents, next.activeComponents)) {
		reasons.push('active_components changed');
	}
	if (!arraysEqualIgnoringOrder(current.activeRecordTypes, next.activeRecordTypes)) {
		reasons.push('active_record_types changed');
	}
	if (next.elements && elementsShapeChanged(current.activeComponents, next.elements)) {
		reasons.push('seed elements changed (page-tree shape)');
	}

	if (reasons.length > 0) {
		return { mode: 'db-reseed', reasons };
	}

	const themingReasons = themingChanges(current.settings, next.settings);
	if (themingReasons.length > 0) {
		return { mode: 'theming-only', reasons: themingReasons };
	}

	return { mode: 'no-op', reasons: ['No applicable changes detected.'] };
}

function arraysEqualIgnoringOrder(a: string[], b: string[]): boolean {
	if (a.length !== b.length) return false;
	const sa = [...a].sort();
	const sb = [...b].sort();
	for (let i = 0; i < sa.length; i++) {
		if (sa[i] !== sb[i]) return false;
	}
	return true;
}

/**
 * Heuristic: if `next.elements` includes a component slug not in
 * `current.activeComponents`, the page tree shape will change. This is a
 * fast structural check; v2 may compare element-by-element.
 */
function elementsShapeChanged(
	currentActive: string[],
	nextElements: Array<{ component?: string }>
): boolean {
	const activeKebab = new Set(currentActive.map((c) => c.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()));
	for (const el of nextElements) {
		if (!el.component) continue;
		if (!activeKebab.has(el.component)) return true;
	}
	return false;
}

const THEMING_KEYS: Array<keyof FactorySettings> = [
	'colors',
	'radius',
	'fonts',
	'breakpoints',
	'colorMode',
	'placeholderImageBaseUrl'
];

function themingChanges(
	current: Partial<FactorySettings> | undefined,
	next: Partial<FactorySettings> | undefined
): string[] {
	if (!current && !next) return [];
	const reasons: string[] = [];
	for (const key of THEMING_KEYS) {
		const a = current?.[key];
		const b = next?.[key];
		if (!deepEqual(a, b)) {
			reasons.push(`settings.${key} changed`);
		}
	}
	return reasons;
}

function deepEqual(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (a === undefined || b === undefined) return a === b;
	if (a === null || b === null) return a === b;
	if (typeof a !== typeof b) return false;
	if (typeof a !== 'object') return false;
	const ka = Object.keys(a as object).sort();
	const kb = Object.keys(b as object).sort();
	if (ka.length !== kb.length) return false;
	for (let i = 0; i < ka.length; i++) {
		if (ka[i] !== kb[i]) return false;
		if (!deepEqual((a as Record<string, unknown>)[ka[i]], (b as Record<string, unknown>)[kb[i]])) return false;
	}
	return true;
}
