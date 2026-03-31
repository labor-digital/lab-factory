<script lang="ts">
	import { RefreshCw } from 'lucide-svelte';
	import type { PipelineConfig, Manifest } from '$lib/pipeline/types.js';
	import ComponentPicker from './ComponentPicker.svelte';
	import PasswordInput from './PasswordInput.svelte';

	interface Props {
		config: PipelineConfig;
		manifest: Manifest | null;
		disabled: boolean;
		collapsed?: boolean;
		onchange: (config: PipelineConfig) => void;
	}

	let { config, manifest, disabled, collapsed: collapsedProp = false, onchange }: Props = $props();
	let showSecrets = $state(false);
	let collapsed = $state(false);

	$effect(() => {
		collapsed = collapsedProp;
	});

	function update<K extends keyof PipelineConfig>(key: K, value: PipelineConfig[K]) {
		onchange({ ...config, [key]: value });
	}

	function generateEncryptionKey() {
		const bytes = crypto.getRandomValues(new Uint8Array(32));
		const key = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
		update('appEncryptionKey', key);
	}
</script>

<div class="terminal-box overflow-hidden">
	<button
		type="button"
		class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-900/50 transition-colors"
		onclick={() => (collapsed = !collapsed)}
	>
		<span class="text-xs text-zinc-400 uppercase tracking-wider font-medium">Configuration</span>
		<span class="text-zinc-600 text-xs">{collapsed ? '▸ expand' : '▾ collapse'}</span>
	</button>

	{#if !collapsed}
		<div class="px-4 pb-4 space-y-4 border-t border-zinc-800/50">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
				<div class="space-y-1">
					<label for="projectName" class="text-xs text-zinc-400 uppercase tracking-wider">Project Name</label>
					<input
						id="projectName"
						type="text"
						value={config.testProjectName}
						oninput={(e) => update('testProjectName', e.currentTarget.value)}
						{disabled}
						class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
					/>
				</div>

				<div class="space-y-1">
					<label for="labCli" class="text-xs text-zinc-400 uppercase tracking-wider">Lab CLI Binary</label>
					<input
						id="labCli"
						type="text"
						value={config.labCliBin}
						oninput={(e) => update('labCliBin', e.currentTarget.value)}
						{disabled}
						class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
					/>
				</div>

				<div class="space-y-1">
					<label for="factoryCore" class="text-xs text-zinc-400 uppercase tracking-wider">Factory Core Path</label>
					<input
						id="factoryCore"
						type="text"
						value={config.factoryCorePath}
						oninput={(e) => update('factoryCorePath', e.currentTarget.value)}
						{disabled}
						class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
					/>
				</div>

				<div class="space-y-1">
					<label for="apiBaseUrl" class="text-xs text-zinc-400 uppercase tracking-wider">TYPO3 API Base URL</label>
					<input
						id="apiBaseUrl"
						type="text"
						value={config.typo3ApiBaseUrl}
						oninput={(e) => update('typo3ApiBaseUrl', e.currentTarget.value)}
						{disabled}
						class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
					/>
				</div>
			</div>

			<ComponentPicker
				selected={config.componentsToTest}
				{manifest}
				onchange={(v) => update('componentsToTest', v)}
			/>

			<div class="flex items-center gap-3">
				<label class="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						checked={config.includePhase3}
						onchange={(e) => update('includePhase3', e.currentTarget.checked)}
						{disabled}
						class="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-cyan-500 focus:ring-cyan-500/30"
					/>
					<span class="text-sm text-zinc-300">Include Phase 3 (Docker & Bootstrapping)</span>
				</label>
			</div>

			{#if config.includePhase3}
				<div class="space-y-3">
					<div class="space-y-1">
						<label for="sudoPassword" class="text-xs text-zinc-400 uppercase tracking-wider">Sudo Password</label>
						<PasswordInput
							id="sudoPassword"
							value={config.sudoPassword}
							{disabled}
							oninput={(v) => update('sudoPassword', v)}
						/>
						<p class="text-[10px] text-zinc-600">Required for /etc/hosts access during <code class="bg-zinc-800 px-1 rounded">lab up</code></p>
					</div>
				</div>
			{/if}

			<div>
				<button
					type="button"
					class="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
					onclick={() => (showSecrets = !showSecrets)}
				>
					{showSecrets ? '▾ Hide' : '▸ Show'} Secrets
				</button>

				{#if showSecrets}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
						<div class="space-y-1">
							<label for="adminUser" class="text-xs text-zinc-400 uppercase tracking-wider">TYPO3 Admin User</label>
							<input
								id="adminUser"
								type="text"
								value={config.typo3AdminUser}
								oninput={(e) => update('typo3AdminUser', e.currentTarget.value)}
								{disabled}
								class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
							/>
						</div>

						<div class="space-y-1">
							<label for="adminPass" class="text-xs text-zinc-400 uppercase tracking-wider">TYPO3 Admin Password</label>
							<PasswordInput
								id="adminPass"
								value={config.typo3AdminPassword}
								{disabled}
								oninput={(v) => update('typo3AdminPassword', v)}
							/>
						</div>

						<div class="space-y-1">
							<label for="encKey" class="text-xs text-zinc-400 uppercase tracking-wider">Encryption Key</label>
							<div class="flex gap-2">
								<div class="flex-1">
									<PasswordInput
										id="encKey"
										value={config.appEncryptionKey}
										{disabled}
										oninput={(v) => update('appEncryptionKey', v)}
									/>
								</div>
								<button
									type="button"
									title="Generate random key"
									onclick={generateEncryptionKey}
									{disabled}
									class="px-2.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors disabled:opacity-50"
								>
									<RefreshCw size={14} />
								</button>
							</div>
						</div>

						<div class="space-y-1">
							<label for="installPw" class="text-xs text-zinc-400 uppercase tracking-wider">Install Tool Password</label>
							<PasswordInput
								id="installPw"
								value={config.appInstallToolPassword}
								{disabled}
								oninput={(v) => update('appInstallToolPassword', v)}
							/>
							<p class="text-[10px] text-zinc-600">Plaintext — hashed to Argon2id before use</p>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
