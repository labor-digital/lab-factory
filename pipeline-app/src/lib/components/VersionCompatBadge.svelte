<script lang="ts">
	import type { DeployedVersionInfo, VersionCompatResult } from '$lib/pipeline/types.js';
	import { evaluate } from '$lib/staging/versionCompat.js';

	interface Props {
		baseUrl: string;
		seedCoreVersion: string;
		stagingApiTokenConfigured: boolean;
		oncompat: (result: VersionCompatResult) => void;
	}

	let { baseUrl, seedCoreVersion, stagingApiTokenConfigured, oncompat }: Props = $props();

	let deployed = $state<DeployedVersionInfo | null>(null);
	let loading = $state(false);
	let lastError = $state<string>('');

	const result = $derived.by(() => evaluate(seedCoreVersion, deployed));

	$effect(() => {
		oncompat(result);
	});

	async function refresh() {
		if (!stagingApiTokenConfigured) {
			deployed = null;
			lastError = 'STAGING_API_TOKEN not set on the server.';
			return;
		}
		if (!baseUrl) {
			deployed = null;
			lastError = '';
			return;
		}
		loading = true;
		lastError = '';
		try {
			const res = await fetch(`/api/staging/version?baseUrl=${encodeURIComponent(baseUrl)}`);
			if (!res.ok) {
				const txt = await res.text();
				throw new Error(`HTTP ${res.status} ${txt}`);
			}
			deployed = (await res.json()) as DeployedVersionInfo;
		} catch (err) {
			deployed = null;
			lastError = (err as Error).message;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		// re-fetch whenever the base URL or token-configured flag changes
		void baseUrl;
		void stagingApiTokenConfigured;
		refresh();
	});
</script>

<div class="space-y-2">
	<div class="flex items-center gap-2 text-xs">
		{#if loading}
			<span class="w-2 h-2 rounded-full bg-zinc-500 animate-pulse"></span>
			<span class="text-zinc-400">checking staging…</span>
		{:else if !baseUrl}
			<span class="w-2 h-2 rounded-full bg-zinc-700"></span>
			<span class="text-zinc-500">enter the staging URL above</span>
		{:else if !stagingApiTokenConfigured}
			<span class="w-2 h-2 rounded-full bg-amber-500"></span>
			<span class="text-amber-300">STAGING_API_TOKEN missing on server</span>
		{:else if !deployed}
			<span class="w-2 h-2 rounded-full bg-red-500"></span>
			<span class="text-red-300">{lastError || 'staging unreachable'}</span>
		{:else if result.matches}
			<span class="w-2 h-2 rounded-full bg-green-500"></span>
			<span class="text-zinc-300">staging factory-core <span class="text-zinc-100">{deployed.factoryCoreVersion}</span> · seed needs <span class="text-zinc-100">{result.seedConstraint || '—'}</span> ✓</span>
		{:else}
			<span class="w-2 h-2 rounded-full bg-red-500"></span>
			<span class="text-red-300">{result.reason}</span>
		{/if}
	</div>

	{#if result.remediation}
		<div class="terminal-box p-3 text-[11px] space-y-2">
			<p class="text-zinc-400">Bump factory-core in the deploy repo first:</p>
			<pre class="text-zinc-200 whitespace-pre-wrap">{result.remediation.composerRequire}</pre>
			<p class="text-zinc-500 text-[10px]">{result.remediation.renovateLinkHint}</p>
		</div>
	{/if}
</div>
