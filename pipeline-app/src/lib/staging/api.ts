import type { DeployedVersionInfo } from '$lib/pipeline/types.js';

/**
 * Server-side helpers for talking to a deployed multitenant API. Lives
 * outside the route files so the executor can reuse them without going
 * through the local proxy. Browser code MUST NOT import this module
 * (would leak the bearer); only `+server.ts` and `executor.ts` may.
 */

export class StagingApiError extends Error {
	constructor(message: string, public readonly status: number) {
		super(message);
	}
}

function ensureBaseUrl(baseUrl: string): string {
	const trimmed = baseUrl.replace(/\/+$/, '');
	if (!/^https?:\/\//.test(trimmed)) {
		throw new StagingApiError(`stagingApiBaseUrl must be http(s) URL, got "${baseUrl}"`, 400);
	}
	return trimmed;
}

function authHeaders(token: string): Record<string, string> {
	return { Authorization: `Bearer ${token}`, Accept: 'application/json' };
}

export async function fetchDeployedVersion(baseUrl: string, token: string): Promise<DeployedVersionInfo> {
	const base = ensureBaseUrl(baseUrl);
	const res = await fetch(`${base}/api/multitenant/version`, {
		headers: authHeaders(token)
	});
	if (!res.ok) {
		throw new StagingApiError(`GET /version returned ${res.status}`, res.status);
	}
	const raw = (await res.json()) as Record<string, unknown>;
	return {
		factoryCoreVersion: String(raw.factory_core_version ?? ''),
		factoryMultitenantApiVersion: String(raw.factory_multitenant_api_version ?? ''),
		typo3Version: String(raw.typo3_version ?? ''),
		supportedSeedSchema: {
			min: String((raw.supported_seed_schema as { min?: unknown })?.min ?? ''),
			max: String((raw.supported_seed_schema as { max?: unknown })?.max ?? '')
		}
	};
}

export interface CreateTenantRequest {
	slug: string;
	domain: string;
	displayName: string;
	components: string[];
	recordTypes: string[];
	adminEmail: string;
	coreVersion?: string;
	// Full TYPO3 site base URL. For shared-host staging, pipeline-app sets
	// this to `${stagingApiBaseUrl}/${slug}` so the TYPO3 site resolver
	// matches incoming requests by subpath. Omit for single-tenant clients
	// (the server falls back to `https://${domain}`).
	base?: string;
	// Public Nuxt frontend URL. friendsoftypo3/headless uses this to build
	// menu/page link hrefs that the Nuxt frontend can resolve at its own
	// origin (without inheriting the TYPO3 host's subpath prefix). Omit
	// for single-tenant clients where TYPO3 and the frontend share a host.
	frontendBase?: string;
}

export async function createTenant(
	baseUrl: string,
	token: string,
	body: CreateTenantRequest
): Promise<unknown> {
	const base = ensureBaseUrl(baseUrl);
	const res = await fetch(`${base}/api/multitenant/tenants`, {
		method: 'POST',
		headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	const text = await res.text();
	if (!res.ok) {
		throw new StagingApiError(`POST /tenants returned ${res.status}: ${text}`, res.status);
	}
	try {
		return JSON.parse(text);
	} catch {
		return { raw: text };
	}
}

export async function getTenant(baseUrl: string, token: string, slug: string): Promise<unknown> {
	const base = ensureBaseUrl(baseUrl);
	const res = await fetch(`${base}/api/multitenant/tenants/${encodeURIComponent(slug)}`, {
		headers: authHeaders(token)
	});
	if (res.status === 404) return null;
	const text = await res.text();
	if (!res.ok) {
		throw new StagingApiError(`GET /tenants/${slug} returned ${res.status}: ${text}`, res.status);
	}
	try {
		return JSON.parse(text);
	} catch {
		return { raw: text };
	}
}

export interface SeedContentRequest {
	elements: Array<{ component?: string; data?: Record<string, unknown> }>;
	// Optional subpages — each entry becomes a `pages` row under the
	// tenant's root with its own tt_content. Requires factory-core >= 0.6
	// on the receiving side; older API versions silently ignore this field.
	pages?: Array<{
		title?: string;
		slug?: string;
		elements?: Array<{ component?: string; data?: Record<string, unknown> }>;
	}>;
	wipe?: boolean;
}

export async function seedTenantContent(
	baseUrl: string,
	token: string,
	slug: string,
	body: SeedContentRequest
): Promise<unknown> {
	const base = ensureBaseUrl(baseUrl);
	const res = await fetch(`${base}/api/multitenant/tenants/${encodeURIComponent(slug)}/content`, {
		method: 'POST',
		headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	const text = await res.text();
	if (!res.ok) {
		throw new StagingApiError(`POST /tenants/${slug}/content returned ${res.status}: ${text}`, res.status);
	}
	try {
		return JSON.parse(text);
	} catch {
		return { raw: text };
	}
}

export async function deleteTenant(baseUrl: string, token: string, slug: string): Promise<unknown> {
	const base = ensureBaseUrl(baseUrl);
	const res = await fetch(`${base}/api/multitenant/tenants/${encodeURIComponent(slug)}`, {
		method: 'DELETE',
		headers: authHeaders(token)
	});
	const text = await res.text();
	if (!res.ok) {
		throw new StagingApiError(`DELETE /tenants/${slug} returned ${res.status}: ${text}`, res.status);
	}
	try {
		return JSON.parse(text);
	} catch {
		return { raw: text };
	}
}

interface CacheEntry {
	at: number;
	data: DeployedVersionInfo;
}
const versionCache = new Map<string, CacheEntry>();
const VERSION_TTL_MS = 30_000;

/**
 * 30s in-memory cache around `/version`. Pipeline-app calls it on every
 * form change while the operator types into stagingApiBaseUrl; without
 * this, the dev experience hammers the staging API. Cache is keyed by
 * baseUrl+token so swapping either invalidates.
 */
export async function fetchDeployedVersionCached(baseUrl: string, token: string): Promise<DeployedVersionInfo> {
	const key = `${baseUrl}::${token}`;
	const hit = versionCache.get(key);
	if (hit && Date.now() - hit.at < VERSION_TTL_MS) {
		return hit.data;
	}
	const data = await fetchDeployedVersion(baseUrl, token);
	versionCache.set(key, { at: Date.now(), data });
	return data;
}
