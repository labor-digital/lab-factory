<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { ArrowLeft } from 'lucide-svelte';
	import type { SeedLibraryEntry } from '$lib/pipeline/types.js';
	import { toastError, toastInfo } from '$lib/toast.js';

	interface ClientRow {
		id: string;
		slug: string;
		display_name: string;
	}

	let seeds = $state<SeedLibraryEntry[]>([]);
	let clients = $state<ClientRow[]>([]);
	let loading = $state(true);

	let clientId = $state('');
	let mode = $state<'create' | 'update'>('create');
	let tenantSlug = $state('');
	let tenantDomain = $state('');
	let adminEmail = $state('');
	let seedSlug = $state('');

	onMount(async () => {
		try {
			const [seedsRes, clientsRes] = await Promise.all([
				fetch('/api/seeds?status=published'),
				fetch('/api/clients')
			]);
			if (seedsRes.ok) seeds = (await seedsRes.json()).entries ?? [];
			if (clientsRes.ok) clients = (await clientsRes.json()).entries ?? [];
		} catch (err) {
			toastError(`Failed to load: ${(err as Error).message}`);
		} finally {
			loading = false;
		}
	});

	function onSeedChange() {
		const seed = seeds.find((s) => s.slug === seedSlug);
		if (seed?.suggestedTenants && seed.suggestedTenants.length > 0 && tenantSlug === '') {
			const t = seed.suggestedTenants[0];
			tenantSlug = t.slug;
			tenantDomain = t.domain;
			adminEmail = t.adminEmail;
		}
	}

	$effect(() => {
		seedSlug;
		onSeedChange();
	});

	let canStart = $derived(
		clientId !== '' &&
		seedSlug !== '' &&
		tenantSlug.trim().length > 0 &&
		(mode === 'update' || (tenantDomain.trim().length > 0 && adminEmail.trim().length > 0))
	);

	async function start() {
		if (!canStart) return;
		toastInfo('Slim staging executor lands in DL #017 Phase D. Routing through /pipeline/legacy with selections preserved.');
		const params = new URLSearchParams({ seed: seedSlug, target: 'staging' });
		await goto(`/pipeline/legacy?${params.toString()}`);
	}
</script>

<svelte:head>
	<title>Deploy to staging — Factory</title>
</svelte:head>

<div class="max-w-2xl mx-auto px-6 py-8 space-y-6">
	<header>
		<a href="/pipeline" class="text-xs text-zinc-500 hover:text-zinc-200 inline-flex items-center gap-1.5 mb-2">
			<ArrowLeft size={13} strokeWidth={1.75} /> Pipelines
		</a>
		<h1 class="text-zinc-100 text-lg font-semibold">Deploy to staging</h1>
		<p class="text-zinc-500 text-xs mt-0.5">Provisions a tenant on shared TYPO3 + deploys frontend to fly.io.</p>
	</header>

	<form class="terminal-box px-6 py-6 space-y-5" onsubmit={(e) => { e.preventDefault(); start(); }}>
		<div class="space-y-1">
			<label for="client" class="text-xs text-zinc-400 uppercase tracking-wider">Client</label>
			<select
				id="client"
				required
				bind:value={clientId}
				disabled={loading}
				class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
			>
				<option value="">{loading ? 'Loading…' : 'Pick a client'}</option>
				{#each clients as c (c.id)}
					<option value={c.id}>{c.display_name}</option>
				{/each}
			</select>
		</div>

		<div class="space-y-1">
			<label for="mode" class="text-xs text-zinc-400 uppercase tracking-wider">Mode</label>
			<div class="flex items-center gap-3 text-sm">
				<label class="flex items-center gap-2 text-zinc-300">
					<input type="radio" bind:group={mode} value="create" /> Create new tenant
				</label>
				<label class="flex items-center gap-2 text-zinc-300">
					<input type="radio" bind:group={mode} value="update" /> Update existing
				</label>
			</div>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
			<div class="space-y-1">
				<label for="slug" class="text-xs text-zinc-400 uppercase tracking-wider">Tenant slug</label>
				<input
					id="slug"
					type="text"
					required
					pattern="[a-z0-9][a-z0-9-]*"
					bind:value={tenantSlug}
					class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
				/>
			</div>
			{#if mode === 'create'}
				<div class="space-y-1">
					<label for="domain" class="text-xs text-zinc-400 uppercase tracking-wider">Public domain</label>
					<input
						id="domain"
						type="text"
						required
						bind:value={tenantDomain}
						placeholder="acme.example.com"
						class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
					/>
				</div>
			{/if}
		</div>

		{#if mode === 'create'}
			<div class="space-y-1">
				<label for="email" class="text-xs text-zinc-400 uppercase tracking-wider">Tenant admin email</label>
				<input
					id="email"
					type="email"
					required
					bind:value={adminEmail}
					class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
				/>
			</div>
		{/if}

		<div class="space-y-1">
			<label for="seed" class="text-xs text-zinc-400 uppercase tracking-wider">Seed</label>
			<select
				id="seed"
				required
				bind:value={seedSlug}
				disabled={loading}
				class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
			>
				<option value="">{loading ? 'Loading…' : 'Pick a seed'}</option>
				{#each seeds as s (s.id)}
					<option value={s.slug}>{s.name}</option>
				{/each}
			</select>
		</div>

		<div class="flex items-center justify-end">
			<button
				type="submit"
				disabled={!canStart}
				class="px-6 py-2 bg-amber-500/20 text-amber-300 rounded text-sm font-medium ring-1 ring-amber-500/30 hover:bg-amber-500/30 transition-colors disabled:opacity-40 disabled:pointer-events-none"
			>
				Deploy
			</button>
		</div>
	</form>

	<p class="text-[11px] text-zinc-600 px-1">
		The slim staging executor lands in DL #017 Phase D. Right now this form routes to
		<code>/pipeline/legacy?target=staging</code> with the seed prefilled.
	</p>
</div>
