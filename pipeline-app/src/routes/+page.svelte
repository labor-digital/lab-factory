<script lang="ts">
	import { Sprout, Building2, CheckCircle2, Clock, ArrowUpRight, Server } from 'lucide-svelte';

	const { data } = $props();

	function relativeTime(iso: string): string {
		const then = new Date(iso).getTime();
		const diff = Date.now() - then;
		const m = Math.floor(diff / 60_000);
		if (m < 1) return 'just now';
		if (m < 60) return `${m}m ago`;
		const h = Math.floor(m / 60);
		if (h < 24) return `${h}h ago`;
		return `${Math.floor(h / 24)}d ago`;
	}

	const envColor: Record<string, string> = {
		local: 'text-zinc-400 bg-zinc-800',
		staging: 'text-amber-300 bg-amber-950/40',
		prod: 'text-rose-300 bg-rose-950/40'
	};
</script>

<svelte:head>
	<title>Overview — Factory</title>
</svelte:head>

<div class="max-w-6xl mx-auto px-6 py-8 space-y-8">
	<header>
		<h1 class="text-zinc-100 text-lg font-semibold">Overview</h1>
		<p class="text-zinc-500 text-xs mt-0.5">Seeds, clients and tenants across all environments.</p>
	</header>

	<!-- Stat cards (pastel accent per section, matching the nav) -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
		<a
			href="/seeds"
			class="terminal-box px-5 py-4 transition-all group"
			style="--accent: var(--color-pastel-mint);"
			onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--color-pastel-mint) 45%, transparent)')}
			onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '')}
		>
			<div class="flex items-center justify-between mb-2">
				<div
					class="rounded-md p-1.5"
					style="background: color-mix(in srgb, var(--color-pastel-mint) 18%, transparent); color: var(--color-pastel-mint);"
				>
					<Sprout size={16} strokeWidth={1.75} />
				</div>
				<ArrowUpRight
					size={14}
					strokeWidth={1.75}
					style="color: var(--color-text-faint); transition: color .15s;"
				/>
			</div>
			<div class="text-2xl font-semibold" style="color: var(--color-text-primary);">{data.stats.seeds}</div>
			<div class="text-xs mt-1" style="color: var(--color-text-secondary);">
				Seeds <span style="color: var(--color-text-faint);">·</span>
				<span style="color: var(--color-pastel-mint);">{data.stats.published}</span> published
			</div>
		</a>

		<a
			href="/clients"
			class="terminal-box px-5 py-4 transition-all group"
			style="--accent: var(--color-pastel-lavender);"
			onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--color-pastel-lavender) 45%, transparent)')}
			onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '')}
		>
			<div class="flex items-center justify-between mb-2">
				<div
					class="rounded-md p-1.5"
					style="background: color-mix(in srgb, var(--color-pastel-lavender) 18%, transparent); color: var(--color-pastel-lavender);"
				>
					<Building2 size={16} strokeWidth={1.75} />
				</div>
				<ArrowUpRight size={14} strokeWidth={1.75} style="color: var(--color-text-faint);" />
			</div>
			<div class="text-2xl font-semibold" style="color: var(--color-text-primary);">{data.stats.clients}</div>
			<div class="text-xs mt-1" style="color: var(--color-text-secondary);">Clients</div>
		</a>

		<a
			href="/tenants"
			class="terminal-box px-5 py-4 transition-all group"
			style="--accent: var(--color-pastel-peach);"
			onmouseenter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'color-mix(in srgb, var(--color-pastel-peach) 45%, transparent)')}
			onmouseleave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '')}
		>
			<div class="flex items-center justify-between mb-2">
				<div
					class="rounded-md p-1.5"
					style="background: color-mix(in srgb, var(--color-pastel-peach) 20%, transparent); color: var(--color-pastel-peach);"
				>
					<Server size={16} strokeWidth={1.75} />
				</div>
				<ArrowUpRight size={14} strokeWidth={1.75} style="color: var(--color-text-faint);" />
			</div>
			<div class="text-2xl font-semibold" style="color: var(--color-text-primary);">{data.appliedSeeds.length}</div>
			<div class="text-xs mt-1" style="color: var(--color-text-secondary);">
				Applied tracked <span style="color: var(--color-text-faint);">·</span> live count in Tenants
			</div>
		</a>
	</div>

	<!-- Two-column body -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Recent seeds -->
		<section class="terminal-box">
			<header class="flex items-center justify-between px-5 py-3 border-b border-zinc-900">
				<h2 class="text-xs text-zinc-400 uppercase tracking-wider">Recent seeds</h2>
				<a href="/seeds" class="text-xs text-zinc-500 hover:text-zinc-300">View all →</a>
			</header>
			<ul class="divide-y divide-zinc-900">
				{#each data.recentSeeds as seed (seed.id)}
					<li>
						<a href="/seeds/{seed.slug}" class="flex items-center justify-between px-5 py-3 hover:bg-zinc-900/50 transition-colors">
							<div class="min-w-0">
								<div class="text-sm text-zinc-200 truncate">{seed.name}</div>
								<div class="text-xs text-zinc-500 mt-0.5">
									<code class="text-zinc-600">{seed.slug}</code>
									<span class="text-zinc-700 mx-1.5">·</span>
									{relativeTime(seed.updated_at)}
								</div>
							</div>
							<div class="flex items-center gap-2 shrink-0 ml-3">
								{#if seed.immutable}
									<span class="text-[10px] uppercase tracking-wider text-zinc-500">builtin</span>
								{/if}
								<span
									class="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded"
									class:bg-emerald-950={seed.status === 'published'}
									class:text-emerald-400={seed.status === 'published'}
									class:bg-amber-950={seed.status === 'draft'}
									class:text-amber-400={seed.status === 'draft'}
									class:bg-zinc-800={seed.status === 'archived'}
									class:text-zinc-500={seed.status === 'archived'}
								>
									{seed.status}
								</span>
							</div>
						</a>
					</li>
				{:else}
					<li class="px-5 py-6 text-xs text-zinc-500 text-center">
						No seeds yet. <a href="/seeds/new" class="text-cyan-400 hover:text-cyan-300">Create one</a> or run the migration script.
					</li>
				{/each}
			</ul>
		</section>

		<!-- Recent activity -->
		<section class="terminal-box">
			<header class="flex items-center justify-between px-5 py-3 border-b border-zinc-900">
				<h2 class="text-xs text-zinc-400 uppercase tracking-wider">Recent activity</h2>
				<Clock size={14} class="text-zinc-600" strokeWidth={1.75} />
			</header>
			<ul class="divide-y divide-zinc-900">
				{#each data.recentAudits as audit (audit.id)}
					<li class="px-5 py-3 flex items-center gap-3">
						<CheckCircle2 size={14} class="text-zinc-600 shrink-0" strokeWidth={1.75} />
						<div class="min-w-0 flex-1">
							<div class="text-xs text-zinc-300">
								<span class="text-zinc-100 font-medium">{audit.action}</span>
								<span class="text-zinc-500"> on seed</span>
							</div>
							<div class="text-xs text-zinc-500 mt-0.5">{relativeTime(audit.at)}</div>
						</div>
					</li>
				{:else}
					<li class="px-5 py-6 text-xs text-zinc-500 text-center">No activity yet.</li>
				{/each}
			</ul>
		</section>
	</div>

	<!-- Currently applied seeds -->
	<section class="terminal-box">
		<header class="flex items-center justify-between px-5 py-3 border-b border-zinc-900">
			<h2 class="text-xs text-zinc-400 uppercase tracking-wider">Applied seeds — what's running</h2>
			<a href="/tenants" class="text-xs text-zinc-500 hover:text-zinc-300">Live tenants →</a>
		</header>
		{#if data.appliedSeeds.length === 0}
			<div class="px-5 py-8 text-xs text-zinc-500 text-center">No applied seeds tracked yet. Run a pipeline to populate.</div>
		{:else}
			<table class="w-full text-sm">
				<thead class="text-xs text-zinc-500 uppercase tracking-wider">
					<tr>
						<th class="text-left font-normal px-5 py-2">Env</th>
						<th class="text-left font-normal px-2 py-2">Target</th>
						<th class="text-left font-normal px-2 py-2">Core</th>
						<th class="text-right font-normal px-5 py-2">When</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-zinc-900">
					{#each data.appliedSeeds as applied (applied.id)}
						<tr class="hover:bg-zinc-900/40 transition-colors">
							<td class="px-5 py-2">
								<span class="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded {envColor[applied.environment] ?? ''}">
									{applied.environment}
								</span>
							</td>
							<td class="px-2 py-2 text-zinc-300 text-xs">
								<code>{applied.tenant_slug ?? applied.project_name ?? '—'}</code>
							</td>
							<td class="px-2 py-2 text-zinc-500 text-xs">{applied.factory_core_version ?? '—'}</td>
							<td class="px-5 py-2 text-right text-zinc-500 text-xs">{relativeTime(applied.applied_at)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</section>
</div>
