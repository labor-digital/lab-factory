const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/;

interface ParsedSemver {
	major: number;
	minor: number;
	patch: number;
	prerelease: string | null;
}

function parse(version: string): ParsedSemver | null {
	if (typeof version !== 'string') return null;
	const m = version.trim().match(SEMVER_RE);
	if (!m) return null;
	return {
		major: Number(m[1]),
		minor: Number(m[2]),
		patch: Number(m[3]),
		prerelease: m[4] ?? null
	};
}

export function valid(version: string): string | null {
	const p = parse(version);
	if (!p) return null;
	return `${p.major}.${p.minor}.${p.patch}${p.prerelease ? '-' + p.prerelease : ''}`;
}

function compareIdentifiers(a: string, b: string): number {
	const aNum = /^\d+$/.test(a);
	const bNum = /^\d+$/.test(b);
	if (aNum && bNum) return Number(a) - Number(b);
	if (aNum) return -1;
	if (bNum) return 1;
	if (a === b) return 0;
	return a < b ? -1 : 1;
}

function comparePrerelease(a: string | null, b: string | null): number {
	if (a === b) return 0;
	if (a === null) return 1;
	if (b === null) return -1;
	const aParts = a.split('.');
	const bParts = b.split('.');
	const len = Math.max(aParts.length, bParts.length);
	for (let i = 0; i < len; i++) {
		const ai = aParts[i];
		const bi = bParts[i];
		if (ai === undefined) return -1;
		if (bi === undefined) return 1;
		const cmp = compareIdentifiers(ai, bi);
		if (cmp !== 0) return cmp;
	}
	return 0;
}

export function compare(a: string, b: string): number {
	const pa = parse(a);
	const pb = parse(b);
	if (!pa || !pb) throw new Error(`Invalid semver: ${!pa ? a : b}`);
	if (pa.major !== pb.major) return pa.major - pb.major;
	if (pa.minor !== pb.minor) return pa.minor - pb.minor;
	if (pa.patch !== pb.patch) return pa.patch - pb.patch;
	return comparePrerelease(pa.prerelease, pb.prerelease);
}

export function gt(a: string, b: string): boolean {
	return compare(a, b) > 0;
}

export function lte(a: string, b: string): boolean {
	return compare(a, b) <= 0;
}
