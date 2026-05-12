<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowLeft } from 'lucide-svelte';
	import type { PipelineConfig, StepEvent, Manifest, SeedTemplate, PhaseId, StepStatus, PhaseInfo, TargetEnvironment, VersionCompatResult } from '$lib/pipeline/types.js';
	import { PHASES } from '$lib/pipeline/types.js';
	import { DEFAULT_CONFIG } from '$lib/pipeline/config.js';
	import { toastSuccess, toastError, toastInfo } from '$lib/toast.js';
	import Banner from '$lib/components/Banner.svelte';
	import ConfigForm from '$lib/components/ConfigForm.svelte';
	import EnvironmentSelector from '$lib/components/EnvironmentSelector.svelte';
	import PhaseCard from '$lib/components/PhaseCard.svelte';

	interface StepData {
		id: string;
		label: string;
		status: StepStatus;
		output: string[];
	}

	interface PhaseState {
		info: PhaseInfo;
		status: StepStatus;
		steps: StepData[];
	}

	// --- State ---
	let config = $state<PipelineConfig>({ ...DEFAULT_CONFIG });
	let manifest = $state<Manifest | null>(null);
	let templates = $state<SeedTemplate[]>([]);
	let bitbucketTokenConfigured = $state(false);
	let flyApiTokenConfigured = $state(false);
	let running = $state(false);
	let pipelineStatus = $state<'idle' | 'running' | 'done' | 'error'>('idle');
	let errorMessage = $state('');
	let phases = $state<PhaseState[]>(createInitialPhases());
	let currentPhase = $state<number>(0);
	let activeSlide = $state<'config' | 'pipeline'>('config');
	let pipelineContainer: HTMLElement | undefined = $state();

	function createInitialPhases(): PhaseState[] {
		return PHASES.map((info) => ({
			info,
			status: 'pending' as StepStatus,
			steps: []
		}));
	}

	function findOrCreateStep(phaseIdx: number, stepId: string): StepData {
		const phase = phases[phaseIdx];
		let step = phase.steps.find((s) => s.id === stepId);
		if (!step) {
			step = { id: stepId, label: stepId, status: 'pending', output: [] };
			phase.steps = [...phase.steps, step];
		}
		return step;
	}

	// --- Event handling ---
	function handleEvent(event: StepEvent) {
		switch (event.type) {
			case 'phase:start': {
				const idx = event.phase ?? 0;
				currentPhase = idx;
				phases[idx].status = 'running';
				break;
			}
			case 'phase:end': {
				const idx = event.phase ?? currentPhase;
				const hasFailed = phases[idx].steps.some((s) => s.status === 'failed');
				phases[idx].status = hasFailed ? 'failed' : 'passed';
				const label = phases[idx].info.label;
				if (hasFailed) {
					toastError(`Phase ${idx}: ${label} failed`);
				} else {
					toastSuccess(`Phase ${idx}: ${label} passed`);
				}
				break;
			}
			case 'step:start': {
				if (event.stepId) {
					const step = findOrCreateStep(currentPhase, event.stepId);
					step.status = 'running';
					step.label = event.data ?? event.stepId;
					phases[currentPhase].steps = [...phases[currentPhase].steps];
				}
				break;
			}
			case 'step:output': {
				if (event.stepId) {
					const step = findOrCreateStep(currentPhase, event.stepId);
					step.output = [...step.output, event.data ?? ''];
					phases[currentPhase].steps = [...phases[currentPhase].steps];
				}
				break;
			}
			case 'step:pass': {
				if (event.stepId) {
					const step = findOrCreateStep(currentPhase, event.stepId);
					step.status = 'passed';
					phases[currentPhase].steps = [...phases[currentPhase].steps];
				}
				break;
			}
			case 'step:fail': {
				if (event.stepId) {
					const step = findOrCreateStep(currentPhase, event.stepId);
					step.status = 'failed';
					if (event.data) step.output = [...step.output, event.data];
					phases[currentPhase].steps = [...phases[currentPhase].steps];
				}
				break;
			}
			case 'pipeline:done': {
				pipelineStatus = 'done';
				running = false;
				toastSuccess('Pipeline completed — all tests passed!');
				break;
			}
			case 'pipeline:error': {
				pipelineStatus = 'error';
				errorMessage = event.data ?? 'Unknown error';
				running = false;
				toastError(`Pipeline failed: ${errorMessage}`);
				break;
			}
		}

		// Auto-scroll to bottom of pipeline view
		if (pipelineContainer) {
			requestAnimationFrame(() => {
				pipelineContainer?.scrollTo({ top: pipelineContainer.scrollHeight, behavior: 'smooth' });
			});
		}
	}

	// --- Actions ---
	async function startPipeline() {
		phases = createInitialPhases();
		pipelineStatus = 'running';
		errorMessage = '';
		running = true;
		currentPhase = 0;
		activeSlide = 'pipeline';

		// Save config to localStorage (exclude sudoPassword)
		try {
			const { sudoPassword, ...persistable } = config;
			localStorage.setItem('pipeline-config', JSON.stringify(persistable));
		} catch {
			// ignore
		}

		try {
			const response = await fetch('/api/pipeline', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(config)
			});

			if (response.status === 409) {
				errorMessage = 'A pipeline is already running';
				pipelineStatus = 'error';
				running = false;
				toastError('A pipeline is already running');
				return;
			}

			if (!response.body) {
				throw new Error('No response body');
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() ?? '';

				for (const line of lines) {
					if (line.trim()) {
						try {
							const event: StepEvent = JSON.parse(line);
							handleEvent(event);
						} catch {
							// ignore malformed lines
						}
					}
				}
			}

			// Process remaining buffer
			if (buffer.trim()) {
				try {
					handleEvent(JSON.parse(buffer));
				} catch {
					// ignore
				}
			}
		} catch (err) {
			pipelineStatus = 'error';
			errorMessage = err instanceof Error ? err.message : 'Connection failed';
		} finally {
			running = false;
		}
	}

	async function stopPipeline() {
		try {
			await fetch('/api/pipeline', { method: 'DELETE' });
		} catch {
			// ignore
		}
		running = false;
		pipelineStatus = 'error';
		errorMessage = 'Pipeline cancelled';
		toastInfo('Pipeline cancelled');
	}

	function backToConfig() {
		activeSlide = 'config';
	}

	// --- Init ---
	onMount(async () => {
		try {
			const saved = localStorage.getItem('pipeline-config');
			if (saved) config = { ...config, ...JSON.parse(saved) };
		} catch {
			// ignore
		}

		try {
			const res = await fetch('/api/manifest');
			if (res.ok) manifest = await res.json();
		} catch {
			// ignore
		}

		try {
			// /api/seeds returns the unified list (builtin + library, source-tagged).
			// We assign it directly into `templates` — SeedLibraryEntry is a
			// structural superset of SeedTemplate, so the picker + form just work.
			const res = await fetch('/api/seeds');
			if (res.ok) {
				const data = await res.json();
				templates = Array.isArray(data?.entries) ? data.entries : [];
			}
		} catch {
			// ignore
		}

		// Pre-fill seed selection from /seeds picker (?seed=…&source=…)
		try {
			const params = new URLSearchParams(window.location.search);
			const seedSlug = params.get('seed');
			if (seedSlug) {
				config = { ...config, seedTemplate: seedSlug };
				toastInfo(`Selected seed: ${seedSlug}`);
				const url = new URL(window.location.href);
				url.searchParams.delete('seed');
				url.searchParams.delete('source');
				window.history.replaceState({}, '', url.toString());
			}
		} catch {
			// ignore
		}

		try {
			const res = await fetch('/api/pipeline');
			if (res.ok) {
				const data = await res.json();
				bitbucketTokenConfigured = !!data.bitbucketTokenConfigured;
				flyApiTokenConfigured = !!data.flyApiTokenConfigured;
				config = { ...config, stagingApiTokenConfigured: !!data.stagingApiTokenConfigured };
			}
		} catch {
			// ignore
		}
	});

	// Selected seed's core_version, fed into the env selector for the version-compat badge.
	let selectedSeedCoreVersion = $state('');
	$effect(() => {
		const tpl = templates.find((t) => t.slug === config.seedTemplate);
		selectedSeedCoreVersion = tpl?.coreVersion ?? '';
	});

	let lastCompat = $state<VersionCompatResult | null>(null);

	// --- Derived ---
	let passedCount = $derived(phases.filter((p) => p.status === 'passed').length);
	let totalPhases = $derived(3 + (config.includePhase3 ? 1 : 0) + (config.includePhase4 ? 1 : 0));
	let visiblePhases = $derived(
		phases.filter((p) =>
			(p.info.id !== 3 || config.includePhase3) &&
			(p.info.id !== 4 || config.includePhase4)
		)
	);
	let backendUrl = $derived(config.typo3ApiBaseUrl);
	let frontendUrl = $derived(config.typo3ApiBaseUrl.replace(/-bac\./, '-fro.'));
	let bitbucketRepoUrl = $derived(() => {
		if (!config.includePhase4) return '';
		const slug = (config.bitbucketRepoSlug.trim() || config.testProjectName).toLowerCase();
		return `https://bitbucket.org/${config.bitbucketWorkspace}/${slug}`;
	});
	let stagingReady = $derived(
		config.targetEnvironment !== 'staging' ||
		(
			config.stagingApiBaseUrl.trim().length > 0 &&
			config.stagingApiTokenConfigured &&
			(lastCompat?.matches === true || config.forceVersionMismatch)
		)
	);
	let canStart = $derived(
		config.targetEnvironment !== 'prod' &&
		(!config.includePhase3 || config.sudoPassword.trim().length > 0) &&
		(!config.includePhase4 || (
			bitbucketTokenConfigured &&
			config.bitbucketWorkspace.trim().length > 0 &&
			config.bitbucketProjectKey.trim().length > 0
		)) &&
		stagingReady
	);
</script>

<div class="h-screen overflow-hidden">
	<div
		class="flex transition-transform duration-500 ease-in-out h-full"
		style="transform: translateX({activeSlide === 'pipeline' ? '-100%' : '0'})"
	>
		<!-- ============================================================= -->
		<!-- Slide 1: Configuration                                        -->
		<!-- ============================================================= -->
		<div class="w-full shrink-0 overflow-y-auto">
			<div class="max-w-4xl mx-auto px-4 py-8">
				<Banner />

				<div class="mb-4">
					<EnvironmentSelector
						target={config.targetEnvironment}
						stagingApiBaseUrl={config.stagingApiBaseUrl}
						stagingApiTokenConfigured={config.stagingApiTokenConfigured}
						seedCoreVersion={selectedSeedCoreVersion}
						forceVersionMismatch={config.forceVersionMismatch}
						disabled={running}
						onchange={(t: TargetEnvironment) => (config = { ...config, targetEnvironment: t })}
						onbaseurl={(u) => (config = { ...config, stagingApiBaseUrl: u })}
						oncompat={(r) => (lastCompat = r)}
						onforcechange={(f) => (config = { ...config, forceVersionMismatch: f })}
					/>
				</div>

				<div class="mb-6">
					<ConfigForm {config} {manifest} {templates} {bitbucketTokenConfigured} {flyApiTokenConfigured} disabled={false} onchange={(c) => (config = c)} />
				</div>

				<div class="flex items-center justify-end gap-3">
					{#if !canStart}
						<span class="text-xs text-zinc-600">
							{#if config.targetEnvironment === 'prod'}
								Production target is disabled until 1.0
							{:else if config.targetEnvironment === 'staging' && config.stagingApiBaseUrl.trim().length === 0}
								Staging API base URL required
							{:else if config.targetEnvironment === 'staging' && !config.stagingApiTokenConfigured}
								STAGING_API_TOKEN not set in pipeline-app/.env
							{:else if config.targetEnvironment === 'staging' && lastCompat && !lastCompat.matches && !config.forceVersionMismatch}
								Version mismatch — bump factory-core in the deploy repo or force-override
							{:else if config.includePhase3 && config.sudoPassword.trim().length === 0}
								Sudo password required for Phase 3
							{:else if config.includePhase4 && !bitbucketTokenConfigured}
								BITBUCKET_TOKEN missing on server
							{:else if config.includePhase4}
								Bitbucket workspace and project key required
							{/if}
						</span>
					{/if}
					<button
						type="button"
						onclick={startPipeline}
						disabled={!canStart}
						class="px-6 py-2.5 bg-cyan-500/20 text-cyan-300 rounded-lg text-sm font-medium
							hover:bg-cyan-500/30 transition-colors ring-1 ring-cyan-500/30
							disabled:opacity-40 disabled:pointer-events-none"
					>
						Run Pipeline
					</button>
				</div>
			</div>
		</div>

		<!-- ============================================================= -->
		<!-- Slide 2: Pipeline execution                                   -->
		<!-- ============================================================= -->
		<div class="w-full shrink-0 overflow-y-auto" bind:this={pipelineContainer}>
			<div class="max-w-4xl mx-auto px-4 py-8">
				<!-- Header bar -->
				<div class="flex items-center justify-between mb-6">
					<button
						type="button"
						onclick={backToConfig}
						disabled={running}
						class="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-200 transition-colors disabled:opacity-30 disabled:pointer-events-none"
					>
						<ArrowLeft size={16} />
						<span>Configuration</span>
					</button>

					<div class="flex items-center gap-4">
						{#if pipelineStatus === 'done'}
							<div class="flex items-center gap-2 text-green-400 text-sm">
								<span>✔</span>
								<span class="font-medium">All tests passed</span>
							</div>
						{:else if pipelineStatus === 'error'}
							<div class="flex items-center gap-2 text-red-400 text-sm">
								<span>✘</span>
								<span>{errorMessage}</span>
							</div>
						{:else if pipelineStatus === 'running'}
							<div class="flex items-center gap-2 text-cyan-400 text-sm">
								<span class="animate-pulse-dot">◉</span>
								<span>Running... ({passedCount}/{totalPhases} phases)</span>
							</div>
						{/if}

						{#if running}
							<button
								type="button"
								onclick={stopPipeline}
								class="px-4 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium
									hover:bg-red-500/30 transition-colors ring-1 ring-red-500/30"
							>
								Stop
							</button>
						{/if}
					</div>
				</div>

				<!-- Phase cards -->
				<div class="space-y-3">
					{#each visiblePhases as phase}
						<PhaseCard phase={phase.info} status={phase.status} steps={phase.steps} />
					{/each}
				</div>

				<!-- Success section -->
				{#if pipelineStatus === 'done'}
					<div class="mt-8 space-y-6">
						<div class="terminal-box border-green-500/30 px-6 py-5">
							<div class="flex items-center gap-3 mb-5">
								<span class="text-green-400 text-xl">✔</span>
								<h2 class="text-green-400 font-bold text-lg">All tests passed successfully!</h2>
							</div>

							<!-- URLs -->
							<div class="space-y-3 mb-5">
								<div class="flex items-start gap-3">
									<span class="text-zinc-500 text-xs uppercase tracking-wider w-20 shrink-0 pt-0.5">Frontend</span>
									<div class="space-y-1">
										<a
											href={frontendUrl}
											target="_blank"
											rel="noopener noreferrer"
											class="text-cyan-400 hover:text-cyan-300 text-sm underline underline-offset-2 break-all block"
										>{frontendUrl}</a>
										<a
											href="{frontendUrl}/contentblocks-collection"
											target="_blank"
											rel="noopener noreferrer"
											class="text-cyan-400/70 hover:text-cyan-300 text-xs underline underline-offset-2 break-all block"
										>{frontendUrl}/contentblocks-collection</a>
									</div>
								</div>
								<div class="flex items-start gap-3">
									<span class="text-zinc-500 text-xs uppercase tracking-wider w-20 shrink-0 pt-0.5">Backend</span>
									<a
										href={backendUrl}
										target="_blank"
										rel="noopener noreferrer"
										class="text-cyan-400 hover:text-cyan-300 text-sm underline underline-offset-2 break-all"
									>{backendUrl}</a>
								</div>
								{#if config.includePhase4 && bitbucketRepoUrl()}
									<div class="flex items-start gap-3">
										<span class="text-zinc-500 text-xs uppercase tracking-wider w-20 shrink-0 pt-0.5">Bitbucket</span>
										<a
											href={bitbucketRepoUrl()}
											target="_blank"
											rel="noopener noreferrer"
											class="text-cyan-400 hover:text-cyan-300 text-sm underline underline-offset-2 break-all"
										>{bitbucketRepoUrl()}</a>
									</div>
								{/if}
							</div>

							<!-- Login credentials -->
							<div class="border-t border-zinc-800 pt-4">
								<h3 class="text-zinc-400 text-xs uppercase tracking-wider mb-3">TYPO3 Login</h3>
								<div class="bg-zinc-950 rounded-lg border border-zinc-800/50 p-4 space-y-2">
									<div class="flex items-center gap-3">
										<span class="text-zinc-500 text-xs w-20 shrink-0">User</span>
										<code class="text-zinc-200 text-sm">{config.typo3AdminUser}</code>
									</div>
									<div class="flex items-center gap-3">
										<span class="text-zinc-500 text-xs w-20 shrink-0">Password</span>
										<code class="text-zinc-200 text-sm">{config.typo3AdminPassword}</code>
									</div>
									<div class="flex items-center gap-3">
										<span class="text-zinc-500 text-xs w-20 shrink-0">Login URL</span>
										<a
											href="{backendUrl}/typo3"
											target="_blank"
											rel="noopener noreferrer"
											class="text-cyan-400 hover:text-cyan-300 text-sm underline underline-offset-2"
										>{backendUrl}/typo3</a>
									</div>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
