<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowLeft } from 'lucide-svelte';
	import type { PipelineConfig, StepEvent, Manifest, PhaseId, StepStatus, PhaseInfo } from '$lib/pipeline/types.js';
	import { PHASES } from '$lib/pipeline/types.js';
	import { DEFAULT_CONFIG } from '$lib/pipeline/config.js';
	import { toastSuccess, toastError, toastInfo } from '$lib/toast.js';
	import Banner from '$lib/components/Banner.svelte';
	import ConfigForm from '$lib/components/ConfigForm.svelte';
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
	});

	// --- Derived ---
	let passedCount = $derived(phases.filter((p) => p.status === 'passed').length);
	let totalPhases = $derived(config.includePhase3 ? 4 : 3);
	let visiblePhases = $derived(
		config.includePhase3 ? phases : phases.filter((p) => p.info.id !== 3)
	);
	let backendUrl = $derived(config.typo3ApiBaseUrl);
	let frontendUrl = $derived(config.typo3ApiBaseUrl.replace(/-bac\./, '-fro.'));
	let canStart = $derived(!config.includePhase3 || config.sudoPassword.trim().length > 0);
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

				<div class="mb-6">
					<ConfigForm {config} {manifest} disabled={false} onchange={(c) => (config = c)} />
				</div>

				<div class="flex items-center justify-end gap-3">
					{#if !canStart}
						<span class="text-xs text-zinc-600">Sudo password required for Phase 3</span>
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
									<a
										href={frontendUrl}
										target="_blank"
										rel="noopener noreferrer"
										class="text-cyan-400 hover:text-cyan-300 text-sm underline underline-offset-2 break-all"
									>{frontendUrl}</a>
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
