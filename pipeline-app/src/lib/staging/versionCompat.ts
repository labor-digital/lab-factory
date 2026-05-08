import type { DeployedVersionInfo, VersionCompatResult } from '$lib/pipeline/types.js';

/**
 * Composer-style caret semantics in JS, narrowed to the cases the seed
 * library actually uses. We deliberately reject exact pins (`0.2.0`) and
 * tilde ranges (`~0.2.0`): the seed schema (DL #014 _schema.json) calls
 * `core_version` "Composer-style range — NOT an exact pin," and pipeline-app
 * surfaces a clear error rather than silently accepting an underspecified
 * constraint.
 *
 * Supported forms:
 *   ^0.2        → >= 0.2 < 1.0  (BUT see "0.x special case" below)
 *   ^0.2.1      → >= 0.2.1 < 0.3.0  (0.x special — locked to 0.x.0)
 *   ^1.2        → >= 1.2 < 2.0
 *   ^1.2.3      → >= 1.2.3 < 2.0.0
 *
 * 0.x special case (matches Composer):
 *   On the 0.x line, ^0.y is treated as >= 0.y.0 < 0.(y+1).0 — a minor bump
 *   IS a breaking change while pre-1.0. This matches our release-please
 *   config (`bump-patch-for-minor-pre-major: false`) and is exactly the
 *   reason factory-core 0.1 → 0.2 needed an explicit constraint bump on
 *   the multitenant-api dep.
 */

interface CaretConstraint {
	kind: 'caret';
	major: number;
	minor: number;
	patch: number | null;
}

interface ParsedVersion {
	major: number;
	minor: number;
	patch: number;
}

export function parseConstraint(input: string): CaretConstraint | null {
	const trimmed = input.trim();
	if (!trimmed.startsWith('^')) return null;
	const m = trimmed.slice(1).match(/^(\d+)\.(\d+)(?:\.(\d+))?$/);
	if (!m) return null;
	return {
		kind: 'caret',
		major: Number(m[1]),
		minor: Number(m[2]),
		patch: m[3] !== undefined ? Number(m[3]) : null
	};
}

export function parseVersion(input: string): ParsedVersion | null {
	const m = input.trim().match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/);
	if (!m) return null;
	return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
}

/**
 * True iff the deployed version satisfies the caret constraint.
 *
 * Test fixtures (kept here as a comment for quick reference):
 *   satisfies("0.1.1", "^0.2")   === false   // 0.x: minor bump is breaking
 *   satisfies("0.2.0", "^0.2")   === true
 *   satisfies("0.2.5", "^0.2")   === true
 *   satisfies("0.3.0", "^0.2")   === false
 *   satisfies("1.0.0", "^0.2")   === false
 *   satisfies("0.2.5", "^0.2.3") === true
 *   satisfies("0.2.2", "^0.2.3") === false
 *   satisfies("1.5.0", "^1.2")   === true
 *   satisfies("2.0.0", "^1.2")   === false
 */
export function satisfies(deployedVersion: string, constraintInput: string): boolean {
	const constraint = parseConstraint(constraintInput);
	const deployed = parseVersion(deployedVersion);
	if (!constraint || !deployed) return false;

	if (constraint.major !== deployed.major) return false;

	if (constraint.major === 0) {
		// 0.x special: lock to the same minor
		if (constraint.minor !== deployed.minor) return false;
		if (constraint.patch !== null && deployed.patch < constraint.patch) return false;
		return true;
	}

	if (deployed.minor < constraint.minor) return false;
	if (deployed.minor === constraint.minor && constraint.patch !== null && deployed.patch < constraint.patch) {
		return false;
	}
	return true;
}

/**
 * Top-level entry point used by the UI + executor. Bundles the deployed
 * version, the seed's declared constraint, the match verdict, a
 * human-readable reason, and (on mismatch) a copy-paste remediation.
 */
export function evaluate(
	seedCoreVersion: string,
	deployed: DeployedVersionInfo | null
): VersionCompatResult {
	const seedConstraint = (seedCoreVersion ?? '').trim();

	if (!deployed) {
		return {
			deployed: null,
			seedConstraint,
			matches: false,
			reason: 'Staging API unreachable or token unset.'
		};
	}

	if (seedConstraint === '') {
		return {
			deployed,
			seedConstraint,
			matches: false,
			reason: 'Seed declares no core_version. Update the seed before deploying to a non-local target.'
		};
	}

	const constraint = parseConstraint(seedConstraint);
	if (!constraint) {
		return {
			deployed,
			seedConstraint,
			matches: false,
			reason: `Unsupported constraint "${seedConstraint}". Use a caret form like "^0.2".`
		};
	}

	if (satisfies(deployed.factoryCoreVersion, seedConstraint)) {
		return {
			deployed,
			seedConstraint,
			matches: true,
			reason: `factory-core ${deployed.factoryCoreVersion} satisfies ${seedConstraint}.`
		};
	}

	return {
		deployed,
		seedConstraint,
		matches: false,
		reason: `factory-core ${deployed.factoryCoreVersion} does NOT satisfy ${seedConstraint}.`,
		remediation: {
			composerRequire: `cd ../labor-factory-multitenant/src && composer require labor-digital/factory-core:${seedConstraint} && git commit -am "bump factory-core" && git push`,
			renovateLinkHint:
				'Open the deploy repo on Bitbucket → Pull requests → filter by "renovate" to merge an existing version-bump PR if there is one.'
		}
	};
}
