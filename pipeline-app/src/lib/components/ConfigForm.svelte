<script lang="ts">
	import { RefreshCw } from 'lucide-svelte';
	import type { PipelineConfig, Manifest, SeedTemplate } from '$lib/pipeline/types.js';
	import ComponentPicker from './ComponentPicker.svelte';
	import PasswordInput from './PasswordInput.svelte';
	import SettingsCard from './SettingsCard.svelte';
	import HomeEditor from './HomeEditor.svelte';
	import ExtendedConfigCard from './ExtendedConfigCard.svelte';
	import TemplatePicker from './TemplatePicker.svelte';

	interface Props {
		config: PipelineConfig;
		manifest: Manifest | null;
		templates: SeedTemplate[];
		disabled: boolean;
		collapsed?: boolean;
		bitbucketTokenConfigured?: boolean;
		flyApiTokenConfigured?: boolean;
		onchange: (config: PipelineConfig) => void;
	}

	let { config, manifest, templates, disabled, collapsed: collapsedProp = false, bitbucketTokenConfigured = false, flyApiTokenConfigured = false, onchange }: Props = $props();

	let hasTemplate = $derived(config.seedTemplate !== '');
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
		<div class="px-4 pb-4 space-y-6 border-t border-zinc-800/50">
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
				selectedComponents={config.componentsToTest}
				selectedRecordTypes={config.activeRecordTypes}
				{manifest}
				onchange={(sel) => onchange({ ...config, componentsToTest: sel.components, activeRecordTypes: sel.recordTypes })}
			/>

			<TemplatePicker
				selected={config.seedTemplate}
				{templates}
				{disabled}
				onchange={(slug) => {
					const tpl = templates.find((t) => t.slug === slug);
					if (tpl) {
						// Auto-activate components required by the template
						const merged = [...config.componentsToTest];
						for (const comp of tpl.components) {
							if (!merged.includes(comp)) merged.push(comp);
						}
						// Auto-activate record types required by the template
						const mergedRecordTypes = [...config.activeRecordTypes];
						for (const rt of tpl.recordTypes ?? []) {
							if (!mergedRecordTypes.includes(rt)) mergedRecordTypes.push(rt);
						}
						// Merge template settings (colors, fonts, etc.) if provided
						const settings = tpl.settings
							? {
								...config.settings,
								...tpl.settings,
								colors: { ...config.settings.colors, ...(tpl.settings.colors ?? {}) },
								fonts: { ...config.settings.fonts, ...(tpl.settings.fonts ?? {}) }
							}
							: config.settings;
						onchange({
							...config,
							seedTemplate: slug,
							componentsToTest: merged,
							activeRecordTypes: mergedRecordTypes,
							settings
						});
					} else {
						update('seedTemplate', slug);
					}
				}}
			/>

			<div>
				<p class="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Languages</p>
				<div class="flex items-center gap-4">
					{#each [{ code: 'de', label: 'German (de)' }, { code: 'en', label: 'English (en)' }] as lang}
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={config.languages.includes(lang.code)}
								onchange={() => {
									const has = config.languages.includes(lang.code);
									const next = has
										? config.languages.filter((l) => l !== lang.code)
										: [...config.languages, lang.code];
									if (next.length > 0) update('languages', next);
								}}
								{disabled}
								class="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-cyan-500 focus:ring-cyan-500/30"
							/>
							<span class="text-sm text-zinc-300">{lang.label}</span>
						</label>
					{/each}
				</div>
			</div>

			<div>
				<p class="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Factory Core Source</p>
				<div class="flex gap-4">
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="radio"
							name="factoryCoreSource"
							value="local"
							checked={config.factoryCoreSource === 'local'}
							onchange={() => update('factoryCoreSource', 'local')}
							{disabled}
							class="w-4 h-4 border-zinc-600 bg-zinc-800 text-cyan-500 focus:ring-cyan-500/30"
						/>
						<span class="text-sm text-zinc-300">Local (path repo + symlinks)</span>
					</label>
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="radio"
							name="factoryCoreSource"
							value="npm"
							checked={config.factoryCoreSource === 'npm'}
							onchange={() => update('factoryCoreSource', 'npm')}
							{disabled}
							class="w-4 h-4 border-zinc-600 bg-zinc-800 text-cyan-500 focus:ring-cyan-500/30"
						/>
						<span class="text-sm text-zinc-300">Published packages (npm + Packagist)</span>
					</label>
				</div>
				<p class="text-[10px] text-zinc-600 mt-1">
					<code class="bg-zinc-800 px-1 rounded">local</code> uses symlinks into this monorepo — right for internal Factory dev. <code class="bg-zinc-800 px-1 rounded">npm</code> consumes published <code class="bg-zinc-800 px-1 rounded">@labor-digital/factory-nuxt-layer</code> + <code class="bg-zinc-800 px-1 rounded">labor-digital/factory-core</code>; consumer wiring lands after the first release.
				</p>
			</div>

			<div>
				<p class="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Deployment Mode</p>
				<div class="flex gap-4">
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="radio"
							name="deploymentMode"
							value="standalone"
							checked={config.deploymentMode === 'standalone'}
							onchange={() => update('deploymentMode', 'standalone')}
							{disabled}
							class="w-4 h-4 border-zinc-600 bg-zinc-800 text-cyan-500 focus:ring-cyan-500/30"
						/>
						<span class="text-sm text-zinc-300">Standalone (one Docker stack per client)</span>
					</label>
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="radio"
							name="deploymentMode"
							value="shared-tenant"
							checked={config.deploymentMode === 'shared-tenant'}
							onchange={() => update('deploymentMode', 'shared-tenant')}
							{disabled}
							class="w-4 h-4 border-zinc-600 bg-zinc-800 text-cyan-500 focus:ring-cyan-500/30"
						/>
						<span class="text-sm text-zinc-300">Shared tenant (provision into existing instance)</span>
					</label>
				</div>
			</div>

			{#if config.deploymentMode === 'shared-tenant'}
				<div class="space-y-3">
					<div class="space-y-1">
						<label for="sharedInstanceRepoPath" class="text-xs text-zinc-400 uppercase tracking-wider">Shared Instance Repo Path</label>
						<input
							id="sharedInstanceRepoPath"
							type="text"
							value={config.sharedInstanceRepoPath}
							oninput={(e) => update('sharedInstanceRepoPath', e.currentTarget.value)}
							{disabled}
							placeholder="../labor-factory-multitenant"
							class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50 font-mono"
						/>
						<p class="text-[10px] text-zinc-600">Directory containing the shared instance's <code class="bg-zinc-800 px-1 rounded">docker-compose.yml</code>. Defaults to the sibling-cloned <code class="bg-zinc-800 px-1 rounded">../labor-factory-multitenant</code> deploy repo.</p>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={config.autoStartStack}
								onchange={(e) => update('autoStartStack', e.currentTarget.checked)}
								{disabled}
								class="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-cyan-500 focus:ring-cyan-500/30"
							/>
							<span class="text-sm text-zinc-300">Auto-start stack if it's down (<code class="bg-zinc-800 px-1 rounded">docker compose up -d --wait</code>)</span>
						</label>
						<div class="space-y-1">
							<label for="stackServiceName" class="text-xs text-zinc-400 uppercase tracking-wider">Stack Service</label>
							<input
								id="stackServiceName"
								type="text"
								value={config.stackServiceName}
								oninput={(e) => update('stackServiceName', e.currentTarget.value)}
								{disabled}
								placeholder="app"
								class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50 font-mono"
							/>
							<p class="text-[10px] text-zinc-600">docker-compose service name for <code class="bg-zinc-800 px-1 rounded">exec</code>.</p>
						</div>
					</div>
				</div>
			{/if}

			{#if config.deploymentMode === 'shared-tenant' || config.targetEnvironment === 'staging'}
				<div class="space-y-1">
					<label for="tenantsJson" class="text-xs text-zinc-400 uppercase tracking-wider">Tenants (JSON)</label>
					<textarea
						id="tenantsJson"
						value={JSON.stringify(config.tenants, null, 2)}
						oninput={(e) => {
							try {
								const parsed = JSON.parse(e.currentTarget.value);
								if (Array.isArray(parsed)) update('tenants', parsed);
							} catch {
								/* ignore — wait for valid JSON */
							}
						}}
						{disabled}
						rows={10}
						placeholder={'[\n  {\n    "slug": "acme",\n    "domain": "acme.example.com",\n    "displayName": "ACME GmbH",\n    "activeComponents": ["PageHero", "Text"],\n    "activeRecordTypes": [],\n    "adminEmail": "ops@acme.example.com"\n  }\n]'}
						class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50 font-mono"
					></textarea>
					<p class="text-[10px] text-zinc-600">One entry per site. Picking a seed pre-fills this from its <code class="bg-zinc-800 px-1 rounded">meta.json</code> <code class="bg-zinc-800 px-1 rounded">suggestedTenants</code> — edit, add more, or paste your own.</p>
				</div>
			{/if}

			<div>
				<p class="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Docker</p>
				<label class="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						checked={config.includePhase3}
						onchange={(e) => update('includePhase3', e.currentTarget.checked)}
						disabled={disabled || config.deploymentMode === 'shared-tenant'}
						class="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-cyan-500 focus:ring-cyan-500/30"
					/>
					<span class="text-sm text-zinc-300">Include Phase 3 (Docker & Bootstrapping)</span>
				</label>
				{#if config.deploymentMode === 'shared-tenant'}
					<p class="text-[10px] text-zinc-600 ml-6 mt-1">Disabled in shared-tenant mode — no per-client Docker stack.</p>
				{/if}
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
				<p class="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Bitbucket</p>
				<label class="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						checked={config.includePhase4}
						onchange={(e) => update('includePhase4', e.currentTarget.checked)}
						{disabled}
						class="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-cyan-500 focus:ring-cyan-500/30"
					/>
					<span class="text-sm text-zinc-300">Include Phase 4 (Publish to Bitbucket)</span>
				</label>
			</div>

			{#if config.includePhase4}
				<div class="space-y-3">
					{#if config.deploymentMode === 'standalone'}
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={config.publishBackend}
								onchange={(e) => update('publishBackend', e.currentTarget.checked)}
								{disabled}
								class="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-cyan-500 focus:ring-cyan-500/30"
							/>
							<span class="text-sm text-zinc-300">Include backend in published repo</span>
						</label>
						<p class="text-[10px] text-zinc-600 ml-6 -mt-1">
							Off = publish only <code class="bg-zinc-800 px-1 rounded">frontend/app/</code> (appropriate when backend is hosted in a shared instance). Slug suffix <code class="bg-zinc-800 px-1 rounded">-frontend</code> is added automatically.
						</p>
					{:else}
						<div class="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded px-3 py-2">
							Per-tenant frontend publishing is not yet implemented for shared-tenant mode. Scaffold per-tenant frontends first, then publish each separately. Phase 4 will run but emit a notice per tenant.
						</div>
					{/if}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div class="space-y-1">
							<label for="bbWorkspace" class="text-xs text-zinc-400 uppercase tracking-wider">Workspace</label>
							<input
								id="bbWorkspace"
								type="text"
								value={config.bitbucketWorkspace}
								oninput={(e) => update('bitbucketWorkspace', e.currentTarget.value)}
								{disabled}
								placeholder="labor-digital"
								class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
							/>
						</div>
						<div class="space-y-1">
							<label for="bbProjectKey" class="text-xs text-zinc-400 uppercase tracking-wider">Project Key</label>
							<input
								id="bbProjectKey"
								type="text"
								value={config.bitbucketProjectKey}
								oninput={(e) => update('bitbucketProjectKey', e.currentTarget.value)}
								{disabled}
								placeholder="FAC"
								class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
							/>
						</div>
						<div class="space-y-1 md:col-span-2">
							<label for="bbRepoSlug" class="text-xs text-zinc-400 uppercase tracking-wider">Repo Slug</label>
							<input
								id="bbRepoSlug"
								type="text"
								value={config.bitbucketRepoSlug}
								oninput={(e) => update('bitbucketRepoSlug', e.currentTarget.value)}
								{disabled}
								placeholder={config.testProjectName}
								class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
							/>
							<p class="text-[10px] text-zinc-600">Empty = use project name ({config.testProjectName}). Must be lowercase kebab-case.</p>
						</div>
					</div>
					<div class="text-xs">
						{#if bitbucketTokenConfigured}
							<span class="text-green-400">✓ BITBUCKET_TOKEN configured</span>
						{:else}
							<span class="text-red-400">✗ BITBUCKET_TOKEN missing — add it to <code class="bg-zinc-800 px-1 rounded">pipeline-app/.env</code> and restart the dev server</span>
						{/if}
					</div>
				</div>
			{/if}

			{#if (config.includePhase4 && !config.publishBackend && config.deploymentMode === 'standalone') || config.targetEnvironment === 'staging'}
				<div>
					<p class="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Frontend Hosting</p>
					<div class="space-y-3">
						<div class="flex items-center gap-4">
							<label class="flex items-center gap-2 cursor-pointer">
								<input
									type="radio"
									name="frontendHostingTarget"
									value="fly-io"
									checked={config.frontendHostingTarget === 'fly-io'}
									onchange={() => update('frontendHostingTarget', 'fly-io')}
									{disabled}
									class="w-4 h-4 border-zinc-600 bg-zinc-800 text-cyan-500 focus:ring-cyan-500/30"
								/>
								<span class="text-sm text-zinc-300">Fly.io (default)</span>
							</label>
							<label class="flex items-center gap-2 cursor-pointer">
								<input
									type="radio"
									name="frontendHostingTarget"
									value="aws-ecs"
									checked={config.frontendHostingTarget === 'aws-ecs'}
									onchange={() => update('frontendHostingTarget', 'aws-ecs')}
									{disabled}
									class="w-4 h-4 border-zinc-600 bg-zinc-800 text-cyan-500 focus:ring-cyan-500/30"
								/>
								<span class="text-sm text-zinc-400">AWS ECS (opt-in; stubbed)</span>
							</label>
						</div>

						{#if config.frontendHostingTarget === 'fly-io'}
							<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div class="space-y-1">
									<label for="flyOrgSlug" class="text-xs text-zinc-400 uppercase tracking-wider">Org Slug</label>
									<input
										id="flyOrgSlug"
										type="text"
										value={config.flyIoOrgSlug}
										oninput={(e) => update('flyIoOrgSlug', e.currentTarget.value)}
										{disabled}
										placeholder="labor-digital"
										class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
									/>
								</div>
								<div class="space-y-1">
									<label for="flyRegion" class="text-xs text-zinc-400 uppercase tracking-wider">Region</label>
									<input
										id="flyRegion"
										type="text"
										value={config.flyIoRegion}
										oninput={(e) => update('flyIoRegion', e.currentTarget.value)}
										{disabled}
										placeholder="ams"
										class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
									/>
								</div>
								<div class="space-y-1">
									<label for="flyMachineSize" class="text-xs text-zinc-400 uppercase tracking-wider">Machine Size</label>
									<select
										id="flyMachineSize"
										value={config.flyIoMachineSize}
										onchange={(e) => update('flyIoMachineSize', e.currentTarget.value as 'shared-cpu-1x-512' | 'shared-cpu-2x-1024')}
										{disabled}
										class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
									>
										<option value="shared-cpu-1x-512">shared-cpu-1x / 512 MB</option>
										<option value="shared-cpu-2x-1024">shared-cpu-2x / 1 GB</option>
									</select>
								</div>
							</div>
							<div class="text-xs">
								{#if flyApiTokenConfigured}
									<span class="text-green-400">✓ FLY_API_TOKEN configured</span>
								{:else}
									<span class="text-amber-400">⚠ FLY_API_TOKEN missing — add it to <code class="bg-zinc-800 px-1 rounded">pipeline-app/.env</code> to enable Fly.io provisioning. Phase 4 will skip Fly steps without it.</span>
								{/if}
							</div>
							<p class="text-[10px] text-zinc-600">
								Fly.io provisioning only runs when backend is excluded from the published repo (<code class="bg-zinc-800 px-1 rounded">publishBackend=false</code>) so <code class="bg-zinc-800 px-1 rounded">fly.toml</code> and <code class="bg-zinc-800 px-1 rounded">bitbucket-pipelines.yml</code> land at the repo root.
							</p>
						{:else}
							<div class="text-xs text-zinc-500 bg-zinc-900/50 border border-zinc-800 rounded px-3 py-2">
								AWS ECS frontend hosting is not implemented yet. Phase 4 will create the Bitbucket repo and stop; ship the frontend manually via the reference workflow in DL #012 Part A.
							</div>
						{/if}
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

<div class="mt-4">
	<HomeEditor
		elements={config.homeElements}
		{manifest}
		disabled={disabled || hasTemplate}
		onchange={(els) => update('homeElements', els)}
		onautoactivate={(comp) => {
			if (!config.componentsToTest.includes(comp)) {
				update('componentsToTest', [...config.componentsToTest, comp]);
			}
		}}
	/>
	{#if hasTemplate}
		<p class="text-[10px] text-zinc-500 mt-1 px-1">Disabled — homepage content is defined by the selected seed template.</p>
	{/if}
</div>

<div class="mt-4">
	<SettingsCard
		settings={config.settings}
		{disabled}
		onchange={(s) => update('settings', s)}
	/>
</div>

<div class="mt-4">
	<ExtendedConfigCard
		settings={config.settings}
		{disabled}
		onchange={(s) => update('settings', s)}
	/>
</div>
