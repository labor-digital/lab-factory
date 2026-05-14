<script lang="ts">
	import { ExternalLink, RefreshCw, Server } from 'lucide-svelte';

	const { data } = $props();

	function relativeTime(iso: string | null | undefined): string {
		if (!iso) return '—';
		const diff = Date.now() - new Date(iso).getTime();
		const m = Math.floor(diff / 60_000);
		if (m < 1) return 'just now';
		if (m < 60) return `${m}m ago`;
		const h = Math.floor(m / 60);
		if (h < 24) return `${h}h ago`;
		return `${Math.floor(h / 24)}d ago`;
	}

	const statusColor: Record<string, string> = {
		ready: 'text-emerald-400 bg-emerald-950/40',
		'tracked-only': 'text-amber-300 bg-amber-950/40',
		orphan: 'text-zinc-400 bg-zinc-800'
	};

	const statusLabel: Record<string, string> = {
		ready: 'live',
		'tracked-only': 'tracked only',
		orphan: 'orphan'
	};
</script>

<svelte:head>
	<title>Tenants — Factory</title>
</svelte:head>

<div class="max-w-6xl mx-auto px-6 py-8 space-y-6">
	<header class="flex items-center justify-between">
		<div>
			<h1 class="text-zinc-100 text-lg font-semibold">Tenants</h1>
			<p class="text-zinc-500 text-xs mt-0.5">
				Live from the multitenant API
				{#if data.baseUrl}
					<code class="text-zinc-400">{data.baseUrl}</code>
				{/if}
				, joined with what pipeline-app provisioned.
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

	{#if data.liveError}
		<div class="terminal-box px-4 py-3 text-xs text-amber-300 bg-amber-950/30 border-amber-900/50">
			⚠ {data.liveError}
		</div>
	{/if}

	{#if data.rows.length === 0}
		<div class="terminal-box px-6 py-12 text-center">
			<Server size={28} class="mx-auto text-zinc-700 mb-3" strokeWidth={1.5} />
			<p class="text-sm text-zinc-400">No tenants found.</p>
			<p class="text-xs text-zinc-600 mt-1">
				{#if data.liveError}
					Couldn't reach the multitenant API — check the warning above.
				{:else}
					Run a <a href="/pipeline" class="text-cyan-400 hover:text-cyan-300">staging pipeline</a> to provision the first one.
				{/if}
			</p>
		</div>
	{:else}
		<div class="terminal-box overflow-hidden">
			<table class="w-full text-sm">
				<thead class="text-xs text-zinc-500 uppercase tracking-wider">
					<tr class="border-b border-zinc-900">
						<th class="text-left font-normal px-5 py-2.5">Status</th>
						<th class="text-left font-normal px-2 py-2.5">Tenant</th>
						<th class="text-left font-normal px-2 py-2.5">Domain</th>
						<th class="text-left font-normal px-2 py-2.5">Client</th>
						<th class="text-left font-normal px-2 py-2.5">Seed</th>
						<th class="text-left font-normal px-2 py-2.5">Core</th>
						<th class="text-right font-normal px-5 py-2.5">Applied</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-zinc-900">
					{#each data.rows as row (row.slug)}
						{@const liveCore = row.live?.core_version ?? ''}
						{@const provCore = row.provisioned?.factory_core_version ?? ''}
						{@const seed = row.provisioned?.seed ?? null}
						{@const client = seed?.client ?? null}
						<tr class="hover:bg-zinc-900/40 transition-colors">
							<td class="px-5 py-2.5">
								<span class="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded {statusColor[row.status] ?? ''}">
									{statusLabel[row.status] ?? row.status}
								</span>
							</td>
							<td class="px-2 py-2.5">
								<code class="text-xs text-zinc-200">{row.slug}</code>
							</td>
							<td class="px-2 py-2.5 text-xs">
								{#if row.domain}
									<a href={`https://${row.domain}`} target="_blank" rel="noopener noreferrer" class="text-zinc-400 hover:text-cyan-300 inline-flex items-center gap-1">
										{row.domain}
										<ExternalLink size={11} strokeWidth={1.75} />
									</a>
								{:else}
									<span class="text-zinc-600">—</span>
								{/if}
							</td>
							<td class="px-2 py-2.5 text-xs text-zinc-400">
								{client ? client.display_name : '—'}
							</td>
							<td class="px-2 py-2.5 text-xs">
								{#if seed}
									<a href={`/seeds/${seed.slug}`} class="text-zinc-400 hover:text-cyan-300">{seed.name}</a>
								{:else}
									<span class="text-zinc-600">—</span>
								{/if}
							</td>
							<td class="px-2 py-2.5 text-xs text-zinc-500">
								{liveCore || provCore || '—'}
							</td>
							<td class="px-5 py-2.5 text-right text-xs text-zinc-500">
								{relativeTime(row.provisioned?.applied_at)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
