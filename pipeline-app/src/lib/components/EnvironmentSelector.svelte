<script lang="ts">
	import type { TargetEnvironment, VersionCompatResult, PipelineConfig } from '$lib/pipeline/types.js';
	import VersionCompatBadge from './VersionCompatBadge.svelte';

	interface Props {
		target: TargetEnvironment;
		stagingApiBaseUrl: string;
		stagingApiTokenConfigured: boolean;
		seedCoreVersion: string;
		forceVersionMismatch: boolean;
		operatingMode: PipelineConfig['operatingMode'];
		existingTenantSlug: string;
		updateOps: PipelineConfig['updateOps'];
		retireFirst: boolean;
		disabled: boolean;
		onchange: (target: TargetEnvironment) => void;
		onbaseurl: (url: string) => void;
		oncompat: (result: VersionCompatResult) => void;
		onforcechange: (force: boolean) => void;
		onmodechange: (mode: PipelineConfig['operatingMode']) => void;
		onslugchange: (slug: string) => void;
		onopschange: (ops: PipelineConfig['updateOps']) => void;
		onretireFirstChange: (v: boolean) => void;
	}

	let {
		target,
		stagingApiBaseUrl,
		stagingApiTokenConfigured,
		seedCoreVersion,
		forceVersionMismatch,
		operatingMode,
		existingTenantSlug,
		updateOps,
		retireFirst,
		disabled,
		onchange,
		onbaseurl,
		oncompat,
		onforcechange,
		onmodechange,
		onslugchange,
		onopschange,
		onretireFirstChange
	}: Props = $props();

	const segments: Array<{ value: TargetEnvironment; label: string; tooltip?: string; locked?: boolean }> = [
		{ value: 'local', label: 'Local' },
		{ value: 'staging', label: 'Staging' },
		{ value: 'prod', label: 'Prod', tooltip: 'Disabled until 1.0', locked: true }
	];

	function pick(value: TargetEnvironment, locked: boolean | undefined) {
		if (locked || disabled) return;
		onchange(value);
	}
</script>

<div class="terminal-box p-4 space-y-3">
	<div class="flex items-center gap-3">
		<span class="text-xs text-zinc-400 uppercase tracking-wider">Target</span>
		<div class="inline-flex rounded overflow-hidden border border-zinc-800">
			{#each segments as seg (seg.value)}
				<button
					type="button"
					title={seg.tooltip ?? ''}
					class="px-3 py-1 text-xs transition-colors
						{target === seg.value && !seg.locked ? 'bg-cyan-700 text-cyan-50' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}
						{seg.locked ? 'opacity-40 cursor-not-allowed' : ''}"
					onclick={() => pick(seg.value, seg.locked)}
					disabled={disabled || seg.locked}
				>{seg.label}</button>
			{/each}
		</div>
	</div>

	{#if target === 'staging'}
		<div class="space-y-2">
			<label class="block text-xs text-zinc-500">
				Staging API base URL
				<input
					type="url"
					value={stagingApiBaseUrl}
					oninput={(e) => onbaseurl(e.currentTarget.value)}
					placeholder="https://staging.labor-factory.example"
					{disabled}
					class="mt-1 w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
				/>
			</label>
			<VersionCompatBadge baseUrl={stagingApiBaseUrl} {seedCoreVersion} {stagingApiTokenConfigured} {oncompat} />
			<label class="flex items-center gap-2 text-[11px] text-zinc-500 mt-2">
				<input
					type="checkbox"
					checked={forceVersionMismatch}
					onchange={(e) => onforcechange(e.currentTarget.checked)}
					{disabled}
				/>
				Force run despite version mismatch (tagged `version-mismatch` in the log)
			</label>

			<div class="pt-3 mt-2 border-t border-zinc-800/50 space-y-2">
				<div class="flex items-center gap-3">
					<span class="text-xs text-zinc-400 uppercase tracking-wider">Operating Mode</span>
					<div class="inline-flex rounded overflow-hidden border border-zinc-800">
						<button
							type="button"
							class="px-3 py-1 text-xs transition-colors {operatingMode === 'create' ? 'bg-cyan-700 text-cyan-50' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}"
							onclick={() => onmodechange('create')}
							{disabled}
						>Create new</button>
						<button
							type="button"
							class="px-3 py-1 text-xs transition-colors {operatingMode === 'update' ? 'bg-cyan-700 text-cyan-50' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}"
							onclick={() => onmodechange('update')}
							{disabled}
						>Update existing</button>
					</div>
				</div>

				{#if operatingMode === 'create'}
					<label class="flex items-center gap-2 text-[11px] text-zinc-500">
						<input
							type="checkbox"
							checked={retireFirst}
							onchange={(e) => onretireFirstChange(e.currentTarget.checked)}
							{disabled}
						/>
						Retire existing tenant on this slug first (DELETE before POST — useful for cleaning orphans)
					</label>
				{:else}
					<label class="block text-xs text-zinc-500">
						Existing tenant slug
						<input
							type="text"
							value={existingTenantSlug}
							oninput={(e) => onslugchange(e.currentTarget.value)}
							placeholder="heckelsmueller-test-1"
							{disabled}
							class="mt-1 w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 font-mono focus:outline-none focus:border-cyan-500 disabled:opacity-50"
						/>
					</label>
					<div class="space-y-1 pt-1">
						<p class="text-[10px] text-zinc-500 uppercase tracking-wider">Operations</p>
						<label class="flex items-center gap-2 text-[11px] text-zinc-300">
							<input
								type="checkbox"
								checked={updateOps.settings}
								onchange={(e) => onopschange({ ...updateOps, settings: e.currentTarget.checked })}
								{disabled}
							/>
							Update settings + active components (PATCH)
						</label>
						<label class="flex items-center gap-2 text-[11px] text-zinc-300">
							<input
								type="checkbox"
								checked={updateOps.content}
								onchange={(e) => onopschange({ ...updateOps, content: e.currentTarget.checked })}
								{disabled}
							/>
							Re-seed content from selected seed (POST /content; wipes existing tt_content on root page)
						</label>
						<label class="flex items-center gap-2 text-[11px] text-zinc-300">
							<input
								type="checkbox"
								checked={updateOps.redeploy}
								onchange={(e) => onopschange({ ...updateOps, redeploy: e.currentTarget.checked })}
								{disabled}
							/>
							Re-deploy frontend (flyctl deploy)
						</label>
					</div>
				{/if}
			</div>
		</div>
	{:else if target === 'local'}
		<p class="text-[11px] text-zinc-600">Local stack, full Docker scaffold (default).</p>
	{:else}
		<p class="text-[11px] text-zinc-600">Production target is disabled until the prod multitenant instance is provisioned.</p>
	{/if}
</div>
