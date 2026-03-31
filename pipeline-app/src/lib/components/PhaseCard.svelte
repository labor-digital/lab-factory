<script lang="ts">
	import type { StepStatus, PhaseInfo } from '$lib/pipeline/types.js';
	import StepLine from './StepLine.svelte';

	interface StepData {
		id: string;
		label: string;
		status: StepStatus;
		output: string[];
	}

	interface Props {
		phase: PhaseInfo;
		status: StepStatus;
		steps: StepData[];
	}

	let { phase, status, steps }: Props = $props();
	let collapsed = $state(false);

	const statusBadge: Record<StepStatus, { text: string; color: string }> = {
		pending: { text: 'pending', color: 'text-zinc-600' },
		running: { text: 'running', color: 'text-cyan-400' },
		passed: { text: 'passed', color: 'text-green-400' },
		failed: { text: 'failed', color: 'text-red-400' },
		skipped: { text: 'skipped', color: 'text-zinc-600' }
	};

	$effect(() => {
		if (status === 'running') collapsed = false;
		if (status === 'passed' || status === 'failed') collapsed = true;
	});
</script>

<div class="terminal-box overflow-hidden {status === 'running' ? 'ring-1 ring-cyan-500/20' : ''}">
	<button
		type="button"
		class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-900/50 transition-colors"
		onclick={() => (collapsed = !collapsed)}
	>
		<span class="text-lg">{phase.icon}</span>
		<span class="text-sm font-medium text-yellow-400">Phase {phase.id}:</span>
		<span class="text-sm text-zinc-200">{phase.label}</span>
		<span class="ml-auto text-xs {statusBadge[status].color}">{statusBadge[status].text}</span>
	</button>

	{#if !collapsed && steps.length > 0}
		<div class="border-t border-zinc-800/50 px-2 py-2 space-y-0.5">
			{#each steps as step}
				<StepLine label={step.label} status={step.status} output={step.output} />
			{/each}
		</div>
	{/if}
</div>
