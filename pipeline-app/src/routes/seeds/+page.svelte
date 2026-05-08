<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { toast } from '@zerodevx/svelte-toast';
	import SeedCard from '$lib/components/SeedCard.svelte';
	import type { SeedLibraryEntry, ReseedRequest, StepEvent } from '$lib/pipeline/types.js';

	let entries = $state<SeedLibraryEntry[]>([]);
	let warnings = $state<string[]>([]);
	let loading = $state(true);
	let query = $state('');
	let sourceFilter = $state<'all' | 'builtin' | 'library'>('all');
	let reseedLog = $state<string[]>([]);
	let reseedRunning = $state(false);

	const filtered = $derived.by(() =>
		entries.filter((e) => {
			if (sourceFilter !== 'all' && e.source !== sourceFilter) return false;
			if (query.trim() === '') return true;
			const q = query.toLowerCase();
			return (
				e.name.toLowerCase().includes(q) ||
				e.slug.toLowerCase().includes(q) ||
				e.description.toLowerCase().includes(q) ||
				e.components.some((c) => c.toLowerCase().includes(q))
			);
		})
	);

	async function load() {
		loading = true;
		try {
			const res = await fetch('/api/seeds');
			const data = await res.json();
			entries = data.entries ?? [];
			warnings = data.warnings ?? [];
		} catch (err) {
			toast.push(`Load failed: ${(err as Error).message}`, { theme: { '--toastBackground': '#7f1d1d' } });
		} finally {
			loading = false;
		}
	}

	function onuse(entry: SeedLibraryEntry) {
		goto(`/?seed=${encodeURIComponent(entry.slug)}&source=${entry.source}`);
	}

	async function onreseed(entry: SeedLibraryEntry) {
		if (reseedRunning) {
			toast.push('Reseed already running');
			return;
		}
		reseedRunning = true;
		reseedLog = [`reseed start: ${entry.slug}`];
		const body: ReseedRequest = {
			seedSlug: entry.slug,
			source: entry.source,
			projectName: '',
			force: null
		};
		try {
			const res = await fetch('/api/reseed', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (!res.ok || !res.body) {
				const detail = await res.text().catch(() => '');
				throw new Error(`HTTP ${res.status} ${detail}`);
			}
			const reader = res.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() ?? '';
				for (const line of lines) {
					if (!line.trim()) continue;
					try {
						const evt: StepEvent = JSON.parse(line);
						if (evt.type === 'step:output' && evt.data) reseedLog = [...reseedLog, evt.data];
						if (evt.type === 'step:start' && evt.data) reseedLog = [...reseedLog, `▸ ${evt.data}`];
						if (evt.type === 'step:fail') reseedLog = [...reseedLog, `✗ ${evt.data ?? 'failed'}`];
						if (evt.type === 'pipeline:done') reseedLog = [...reseedLog, `✓ ${evt.data ?? 'done'}`];
						if (evt.type === 'pipeline:error') reseedLog = [...reseedLog, `! ${evt.data ?? 'error'}`];
					} catch {
						reseedLog = [...reseedLog, line];
					}
				}
			}
			toast.push(`Reseed complete: ${entry.slug}`);
		} catch (err) {
			toast.push(`Reseed failed: ${(err as Error).message}`, { theme: { '--toastBackground': '#7f1d1d' } });
			reseedLog = [...reseedLog, `! ${(err as Error).message}`];
		} finally {
			reseedRunning = false;
		}
	}

	async function ondelete(entry: SeedLibraryEntry) {
		if (entry.source !== 'library') return;
		if (!confirm(`Delete library seed "${entry.slug}"? This removes the files from the seeds repo working tree.`)) return;
		try {
			const res = await fetch(`/api/seeds/${encodeURIComponent(entry.slug)}`, { method: 'DELETE' });
			if (!res.ok) {
				throw new Error(`HTTP ${res.status}`);
			}
			toast.push(`Deleted ${entry.slug}`);
			await load();
		} catch (err) {
			toast.push(`Delete failed: ${(err as Error).message}`, { theme: { '--toastBackground': '#7f1d1d' } });
		}
	}

	onMount(load);
</script>

<svelte:head>
	<title>Seeds — pipeline-app</title>
</svelte:head>

<main class="max-w-6xl mx-auto p-6 space-y-6">
	<header class="flex items-center justify-between">
		<div>
			<h1 class="text-lg text-zinc-100">Seed Library</h1>
			<p class="text-xs text-zinc-500">Pick a seed to scaffold from, or apply one to a running local stack.</p>
		</div>
		<a href="/" class="text-xs text-zinc-400 hover:text-zinc-200">← back to pipeline</a>
	</header>

	{#if warnings.length > 0}
		<div class="terminal-box p-3 text-xs text-amber-300 bg-amber-950/30 border-amber-900/50 space-y-1">
			{#each warnings as w}
				<div>⚠ {w}</div>
			{/each}
		</div>
	{/if}

	<div class="flex items-center gap-3">
		<input
			type="text"
			bind:value={query}
			placeholder="Search seeds…"
			class="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
		/>
		<div class="flex items-center gap-1 text-xs">
			{#each ['all', 'builtin', 'library'] as f (f)}
				<button
					type="button"
					class="px-2 py-1 rounded {sourceFilter === f ? 'bg-cyan-700 text-cyan-50' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}"
					onclick={() => (sourceFilter = f as typeof sourceFilter)}
				>{f}</button>
			{/each}
		</div>
	</div>

	{#if loading}
		<p class="text-xs text-zinc-500">Loading seeds…</p>
	{:else if filtered.length === 0}
		<p class="text-xs text-zinc-500">No seeds match "{query}".</p>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each filtered as entry (entry.id)}
				<SeedCard {entry} {onuse} {onreseed} {ondelete} />
			{/each}
		</div>
	{/if}

	{#if reseedLog.length > 0}
		<section class="terminal-box p-4">
			<header class="flex items-center justify-between mb-2">
				<h2 class="text-xs text-zinc-300 uppercase tracking-wider">Reseed log</h2>
				{#if reseedRunning}
					<span class="text-xs text-cyan-400">running…</span>
				{/if}
			</header>
			<pre class="text-[11px] text-zinc-400 max-h-64 overflow-auto whitespace-pre-wrap">{reseedLog.join('\n')}</pre>
		</section>
	{/if}
</main>
