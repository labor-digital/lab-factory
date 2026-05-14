<script lang="ts">
	import { ExternalLink, RefreshCw, Cloud } from 'lucide-svelte';

	const { data } = $props();

	const stateColor: Record<string, string> = {
		started: 'text-emerald-400 bg-emerald-950/40',
		starting: 'text-cyan-400 bg-cyan-950/40',
		stopped: 'text-zinc-400 bg-zinc-800',
		stopping: 'text-amber-400 bg-amber-950/40',
		suspended: 'text-zinc-500 bg-zinc-800',
		destroyed: 'text-rose-400 bg-rose-950/40'
	};

	function machineSummary(states: string[]): string {
		if (states.length === 0) return 'no machines';
		const counts = new Map<string, number>();
		for (const s of states) counts.set(s, (counts.get(s) ?? 0) + 1);
		return [...counts.entries()].map(([s, n]) => `${n} ${s}`).join(', ');
	}
</script>

<svelte:head>
	<title>Fly.io — Factory</title>
</svelte:head>

<div class="max-w-6xl mx-auto px-6 py-8 space-y-6">
	<header class="flex items-center justify-between">
		<div>
			<h1 class="text-zinc-100 text-lg font-semibold">Fly.io</h1>
			<p class="text-zinc-500 text-xs mt-0.5">
				Apps in org <code class="text-zinc-400">{data.orgSlug || '—'}</code>. Live from
				<code class="text-zinc-400">api.machines.dev</code>.
			</p>
		</div>
		<button
			type="button"
			onclick={() => location.reload()}
			class="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
		>
			<RefreshCw size={13} strokeWidth={1.75} /> Refresh
		</button>
	</header>

	{#if data.error}
		<div class="terminal-box px-4 py-3 text-xs text-amber-300 bg-amber-950/30 border-amber-900/50">
			⚠ {data.error}
		</div>
	{/if}

	{#if data.apps.length === 0 && !data.error}
		<div class="terminal-box px-6 py-12 text-center">
			<Cloud size={28} class="mx-auto text-zinc-700 mb-3" strokeWidth={1.5} />
			<p class="text-sm text-zinc-400">No fly.io apps in org "{data.orgSlug}".</p>
		</div>
	{:else if data.apps.length > 0}
		<div class="terminal-box overflow-hidden">
			<table class="w-full text-sm">
				<thead class="text-xs text-zinc-500 uppercase tracking-wider">
					<tr class="border-b border-zinc-900">
						<th class="text-left font-normal px-5 py-2.5">App</th>
						<th class="text-left font-normal px-2 py-2.5">Status</th>
						<th class="text-left font-normal px-2 py-2.5">Machines</th>
						<th class="text-right font-normal px-5 py-2.5"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-zinc-900">
					{#each data.apps as app (app.id)}
						{@const states = app.machines.map((m) => m.state)}
						{@const regions = [...new Set(app.machines.map((m) => m.region))].join(', ')}
						<tr class="hover:bg-zinc-900/40 transition-colors">
							<td class="px-5 py-2.5">
								<a href="/fly/{app.name}" class="text-zinc-200 hover:text-cyan-300">
									<code class="text-xs">{app.name}</code>
								</a>
								{#if regions}
									<span class="text-[10px] text-zinc-600 ml-2">{regions}</span>
								{/if}
							</td>
							<td class="px-2 py-2.5">
								<span class="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded {stateColor[app.status] ?? 'text-zinc-500 bg-zinc-900'}">
									{app.status}
								</span>
							</td>
							<td class="px-2 py-2.5">
								<div class="flex flex-wrap gap-1.5">
									{#each states as s}
										<span class="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded {stateColor[s] ?? 'text-zinc-500 bg-zinc-900'}">
											{s}
										</span>
									{:else}
										<span class="text-[10px] text-zinc-600">{machineSummary(states)}</span>
									{/each}
								</div>
							</td>
							<td class="px-5 py-2.5 text-right">
								<a
									href="https://fly.io/apps/{app.name}"
									target="_blank"
									rel="noopener noreferrer"
									class="text-zinc-600 hover:text-cyan-300 transition-colors inline-flex"
									aria-label="Open in fly.io"
								>
									<ExternalLink size={13} strokeWidth={1.75} />
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
