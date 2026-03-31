<script lang="ts">
	import type { StepStatus } from '$lib/pipeline/types.js';

	interface Props {
		label: string;
		status: StepStatus;
		output: string[];
		expanded?: boolean;
	}

	let { label, status, output, expanded = false }: Props = $props();
	let isExpanded = $state(false);

	$effect(() => {
		isExpanded = expanded;
	});

	const statusIcon: Record<StepStatus, string> = {
		pending: '○',
		running: '◉',
		passed: '✔',
		failed: '✘',
		skipped: '⊘'
	};

	const statusColor: Record<StepStatus, string> = {
		pending: 'text-zinc-600',
		running: 'text-cyan-400 animate-pulse-dot',
		passed: 'text-green-400',
		failed: 'text-red-400',
		skipped: 'text-zinc-600'
	};

	$effect(() => {
		if (status === 'running') isExpanded = true;
	});
</script>

<div class="group">
	<button
		type="button"
		class="w-full flex items-start gap-2 py-1 px-2 text-left hover:bg-zinc-800/30 rounded transition-colors"
		onclick={() => (isExpanded = !isExpanded)}
	>
		<span class="shrink-0 w-4 text-center {statusColor[status]}">{statusIcon[status]}</span>
		<span class="text-xs {status === 'pending' ? 'text-zinc-600' : 'text-zinc-300'} truncate">{label}</span>
		{#if output.length > 0}
			<span class="ml-auto text-zinc-700 text-xs shrink-0">{isExpanded ? '▾' : '▸'}</span>
		{/if}
	</button>

	{#if isExpanded && output.length > 0}
		<div class="ml-6 mt-1 mb-2 bg-zinc-950 rounded border border-zinc-800/50 p-2 max-h-48 overflow-y-auto scrollbar-thin">
			{#each output as line}
				<div class="text-[11px] text-zinc-500 leading-relaxed whitespace-pre-wrap break-all">{line}</div>
			{/each}
		</div>
	{/if}
</div>
