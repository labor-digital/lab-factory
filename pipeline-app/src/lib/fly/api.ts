/**
 * Thin wrapper over the fly.io Machines REST API. Server-only — the API
 * token must never reach the browser. Used by /api/fly/* server routes
 * and (eventually) the executor for provisioning.
 */

const FLY_BASE = 'https://api.machines.dev/v1';

export class FlyApiError extends Error {
	constructor(message: string, public readonly status: number) {
		super(message);
	}
}

function headers(token: string): Record<string, string> {
	return {
		Authorization: `Bearer ${token}`,
		Accept: 'application/json',
		'Content-Type': 'application/json'
	};
}

export interface FlyApp {
	name: string;
	id: string;
	status: string;
	organization?: { slug: string };
}

export interface FlyMachine {
	id: string;
	name: string;
	state: string;
	region: string;
	instance_id?: string;
	private_ip?: string;
	config?: { image?: string; env?: Record<string, string> };
	created_at?: string;
	updated_at?: string;
}

export async function listApps(token: string, orgSlug: string): Promise<FlyApp[]> {
	const url = `${FLY_BASE}/apps?org_slug=${encodeURIComponent(orgSlug)}`;
	const res = await fetch(url, { headers: headers(token) });
	if (!res.ok) throw new FlyApiError(`fly listApps ${res.status}: ${await res.text()}`, res.status);
	const data = (await res.json()) as { apps?: FlyApp[] };
	return data.apps ?? [];
}

export async function getApp(token: string, name: string): Promise<FlyApp | null> {
	const res = await fetch(`${FLY_BASE}/apps/${encodeURIComponent(name)}`, { headers: headers(token) });
	if (res.status === 404) return null;
	if (!res.ok) throw new FlyApiError(`fly getApp ${res.status}: ${await res.text()}`, res.status);
	return (await res.json()) as FlyApp;
}

export async function listMachines(token: string, appName: string): Promise<FlyMachine[]> {
	const res = await fetch(`${FLY_BASE}/apps/${encodeURIComponent(appName)}/machines`, {
		headers: headers(token)
	});
	if (!res.ok) throw new FlyApiError(`fly listMachines ${res.status}: ${await res.text()}`, res.status);
	return (await res.json()) as FlyMachine[];
}
