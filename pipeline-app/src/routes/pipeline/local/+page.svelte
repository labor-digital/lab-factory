<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { ArrowLeft } from 'lucide-svelte';
	import type { SeedLibraryEntry } from '$lib/pipeline/types.js';
	import { toastError, toastInfo } from '$lib/toast.js';

	let seeds = $state<SeedLibraryEntry[]>([]);
	let loadingSeeds = $state(true);

	let projectName = $state('');
	let seedSlug = $state('');
	let factoryCoreSource = $state<'local' | 'npm'>('local');
	let sudoPassword = $state('');
	let busy = $state(false);

	onMount(async () => {
		try {
			const res = await fetch('/api/seeds?status=published');
			if (res.ok) {
				const data = await res.json();
				seeds = data.entries ?? [];
			}
		} catch (err) {
			toastError(`Failed to load seeds: ${(err as Error).message}`);
		} finally {
			loadingSeeds = false;
		}
	});

	let canStart = $derived(
		projectName.trim().length > 0 &&
		seedSlug !== '' &&
		sudoPassword.trim().length > 0
	);

	async function start() {
		if (!canStart || busy) return;
		busy = true;
		toastInfo('Local pipelines from this slim form land in a follow-up. For now use /pipeline/legacy.');
		// Redirect to legacy with seed prefilled — preserves behaviour until the
		// slim local executor (DL #017 Phase D) is ready.
		await goto(`/pipeline/legacy?seed=${encodeURIComponent(seedSlug)}`);
		busy = false;
	}
</script>

<svelte:head>
	<title>Run locally — Factory</title>
</svelte:head>

<div class="max-w-2xl mx-auto px-6 py-8 space-y-6">
	<header>
		<a href="/pipeline" class="text-xs text-zinc-500 hover:text-zinc-200 inline-flex items-center gap-1.5 mb-2">
			<ArrowLeft size={13} strokeWidth={1.75} /> Pipelines
		</a>
		<h1 class="text-zinc-100 text-lg font-semibold">Run on local docker stack</h1>
		<p class="text-zinc-500 text-xs mt-0.5">Spins up a fresh stack. All other settings come from the seed.</p>
	</header>

	<form class="terminal-box px-6 py-6 space-y-5" onsubmit={(e) => { e.preventDefault(); start(); }}>
		<div class="space-y-1">
			<label for="projectName" class="text-xs text-zinc-400 uppercase tracking-wider">Project name</label>
			<input
				id="projectName"
				type="text"
				required
				bind:value={projectName}
				placeholder="acme-test"
				class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
			/>
			<p class="text-[11px] text-zinc-600">Becomes the directory name + docker-compose project.</p>
		</div>

		<div class="space-y-1">
			<label for="seed" class="text-xs text-zinc-400 uppercase tracking-wider">Seed</label>
			<select
				id="seed"
				required
				bind:value={seedSlug}
				disabled={loadingSeeds}
				class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
			>
				<option value="">{loadingSeeds ? 'Loading…' : 'Pick a seed'}</option>
				{#each seeds as s (s.id)}
					<option value={s.slug}>{s.name} ({s.slug})</option>
				{/each}
			</select>
			<p class="text-[11px] text-zinc-600">Components, design tokens, content — all from the seed.</p>
		</div>

		<div class="space-y-1">
			<label for="coreSource" class="text-xs text-zinc-400 uppercase tracking-wider">factory-core source</label>
			<div class="flex items-center gap-3 text-sm">
				<label class="flex items-center gap-2 text-zinc-300">
					<input type="radio" bind:group={factoryCoreSource} value="local" /> Local monorepo
				</label>
				<label class="flex items-center gap-2 text-zinc-300">
					<input type="radio" bind:group={factoryCoreSource} value="npm" /> Published packages
				</label>
			</div>
		</div>

		<div class="space-y-1">
			<label for="sudo" class="text-xs text-zinc-400 uppercase tracking-wider">Sudo password</label>
			<input
				id="sudo"
				type="password"
				required
				bind:value={sudoPassword}
				placeholder="(for hosts-file edits + docker permissions)"
				class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
			/>
		</div>

		<div class="flex items-center justify-end gap-3">
			<button
				type="submit"
				disabled={!canStart || busy}
				class="px-6 py-2 bg-cyan-500/20 text-cyan-300 rounded text-sm font-medium ring-1 ring-cyan-500/30 hover:bg-cyan-500/30 transition-colors disabled:opacity-40 disabled:pointer-events-none"
			>
				Run
			</button>
		</div>
	</form>

	<p class="text-[11px] text-zinc-600 px-1">
		Heads up: the slim local executor is part of DL #017 Phase D. This form currently routes to
		<code>/pipeline/legacy</code> with the seed preselected, so you can run the same pipeline with
		the legacy fields visible. The legacy route will retire once the slim form runs end-to-end.
	</p>
</div>
