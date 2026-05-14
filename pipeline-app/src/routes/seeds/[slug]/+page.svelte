<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { ArrowLeft, Save, Trash2, Copy, Plus, X } from 'lucide-svelte';
	import ComponentPicker from '$lib/components/ComponentPicker.svelte';
	import type { SeedPayload, SeedStatus } from '$lib/supabase/types.js';
	import type { TenantSpec, Manifest } from '$lib/pipeline/types.js';
	import { toastError, toastSuccess, toastInfo } from '$lib/toast.js';

	const { data } = $props();

	let name = $state('');
	let description = $state('');
	let status = $state<SeedStatus>('draft');
	let coreVersion = $state('');
	let clientId = $state<string>('');
	let components = $state<string[]>([]);
	let recordTypes = $state<string[]>([]);
	let tenants = $state<TenantSpec[]>([]);
	let advancedJson = $state('');
	let advancedJsonError = $state('');
	let saving = $state(false);

	// Pull editable payload bits (everything except the parts we manage above)
	// out of the loaded seed payload as a string.
	function advancedFor(payload: SeedPayload): string {
		const { active_components, active_record_types, ...rest } = payload;
		void active_components;
		void active_record_types;
		return JSON.stringify(rest, null, 2);
	}

	// Reset the form whenever the loaded seed changes (route navigation OR
	// after a save + invalidateAll). Keying on `data.seed.id` keeps this
	// idempotent for re-renders of the same seed.
	let lastSeedId = $state('');
	$effect(() => {
		if (data.seed.id === lastSeedId) return;
		lastSeedId = data.seed.id;
		name = data.seed.name;
		description = data.seed.description;
		status = data.seed.status ?? 'draft';
		coreVersion = data.seed.coreVersion;
		clientId = data.seed.clientId ?? '';
		components = [...data.seed.components];
		recordTypes = [...data.seed.recordTypes];
		tenants = structuredClone(data.seed.suggestedTenants ?? []);
		advancedJson = advancedFor(data.payload);
	});

	let immutable = $derived(data.seed.source === 'builtin');

	let dirty = $derived(
		name !== data.seed.name ||
			description !== data.seed.description ||
			status !== (data.seed.status ?? 'draft') ||
			coreVersion !== data.seed.coreVersion ||
			clientId !== (data.seed.clientId ?? '') ||
			components.join('|') !== data.seed.components.join('|') ||
			recordTypes.join('|') !== data.seed.recordTypes.join('|') ||
			JSON.stringify(tenants) !== JSON.stringify(data.seed.suggestedTenants ?? []) ||
			advancedJson !== advancedFor(data.payload)
	);

	function addTenant() {
		tenants = [
			...tenants,
			{ slug: '', domain: '', displayName: '', activeComponents: [], activeRecordTypes: [], adminEmail: '' }
		];
	}

	function removeTenant(i: number) {
		tenants = tenants.filter((_, idx) => idx !== i);
	}

	function updateTenant<K extends keyof TenantSpec>(i: number, key: K, value: TenantSpec[K]) {
		tenants = tenants.map((t, idx) => (idx === i ? { ...t, [key]: value } : t));
	}

	async function copySlug() {
		try {
			await navigator.clipboard.writeText(data.seed.slug);
			toastInfo('Slug copied');
		} catch {
			toastError('Copy failed');
		}
	}

	async function save() {
		if (immutable) {
			toastError('Builtin seeds cannot be edited from the dashboard.');
			return;
		}
		let advancedParsed: Record<string, unknown>;
		try {
			advancedParsed = JSON.parse(advancedJson || '{}');
			if (typeof advancedParsed !== 'object' || advancedParsed === null) throw new Error('not an object');
			advancedJsonError = '';
		} catch (err) {
			advancedJsonError = (err as Error).message;
			toastError(`Advanced JSON: ${advancedJsonError}`);
			return;
		}

		const payload: SeedPayload = {
			...advancedParsed,
			active_components: components,
			active_record_types: recordTypes,
			settings: ((advancedParsed as { settings?: SeedPayload['settings'] }).settings ?? data.payload.settings ?? {}) as SeedPayload['settings']
		};

		saving = true;
		try {
			const res = await fetch(`/api/seeds/${encodeURIComponent(data.seed.slug)}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name,
					description,
					coreVersion,
					payload,
					suggestedTenants: tenants,
					clientId: clientId || null,
					status
				})
			});
			if (!res.ok) {
				toastError(`Save failed: ${await res.text()}`);
				return;
			}
			toastSuccess('Seed saved');
			await invalidateAll();
		} finally {
			saving = false;
		}
	}

	async function publish() {
		if (immutable) return;
		const res = await fetch(`/api/seeds/${encodeURIComponent(data.seed.slug)}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: 'published' })
		});
		if (!res.ok) {
			toastError(`Publish failed: ${await res.text()}`);
			return;
		}
		toastSuccess('Seed published');
		status = 'published';
		await invalidateAll();
	}

	async function remove() {
		if (immutable) return;
		if (!confirm(`Delete seed "${data.seed.slug}"? This is permanent.`)) return;
		const res = await fetch(`/api/seeds/${encodeURIComponent(data.seed.slug)}`, { method: 'DELETE' });
		if (!res.ok) {
			toastError(`Delete failed: ${await res.text()}`);
			return;
		}
		toastSuccess(`Deleted ${data.seed.slug}`);
		await goto('/seeds');
	}
</script>

<svelte:head>
	<title>{data.seed.name} — Seed — Factory</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-6 py-8 space-y-6">
	<!-- Header -->
	<header>
		<a href="/seeds" class="text-xs inline-flex items-center gap-1.5 mb-3" style="color: var(--color-text-muted);">
			<ArrowLeft size={13} strokeWidth={1.75} /> All seeds
		</a>
		<div class="flex items-start justify-between gap-4">
			<div class="min-w-0 flex-1">
				<h1 class="text-lg font-semibold truncate" style="color: var(--color-text-primary);">{name || data.seed.slug}</h1>
				<div class="flex items-center gap-2 mt-1.5 text-xs">
					<button
						type="button"
						onclick={copySlug}
						class="inline-flex items-center gap-1 hover:opacity-80 transition"
						style="color: var(--color-text-muted);"
						title="Copy slug"
					>
						<code>{data.seed.slug}</code>
						<Copy size={10} strokeWidth={1.75} />
					</button>
					<span style="color: var(--color-text-faint);">·</span>
					<span class="pastel-chip {status === 'published' ? 'pastel-chip-mint' : status === 'draft' ? 'pastel-chip-amber' : 'pastel-chip-neutral'}">
						{status}
					</span>
					{#if immutable}
						<span class="pastel-chip pastel-chip-neutral">builtin · read-only</span>
					{/if}
				</div>
			</div>
			<div class="flex items-center gap-2">
				{#if status === 'draft' && !immutable}
					<button
						type="button"
						onclick={publish}
						class="px-3 py-1.5 rounded text-xs transition-colors"
						style="background: color-mix(in srgb, var(--color-pastel-mint) 20%, transparent); color: var(--color-pastel-mint); border: 1px solid color-mix(in srgb, var(--color-pastel-mint) 40%, transparent);"
					>
						Publish
					</button>
				{/if}
				{#if !immutable}
					<button
						type="button"
						onclick={remove}
						class="px-2 py-1.5 rounded transition-colors"
						style="color: var(--color-text-muted);"
						title="Delete seed"
						aria-label="Delete"
					>
						<Trash2 size={14} strokeWidth={1.75} />
					</button>
				{/if}
			</div>
		</div>
	</header>

	{#if immutable}
		<div class="terminal-box px-4 py-3 text-xs" style="color: var(--color-pastel-peach); background: color-mix(in srgb, var(--color-pastel-peach) 8%, var(--color-surface-card));">
			This seed is a builtin — its definition lives in <code>factory-core/typo3-extension/SeedTemplates/</code>. Edit it there and re-run the migration script to sync.
		</div>
	{/if}

	<!-- Basics -->
	<section class="terminal-box px-5 py-5 space-y-4">
		<h2 class="text-xs uppercase tracking-wider" style="color: var(--color-text-muted);">Basics</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
			<div class="space-y-1">
				<label for="name" class="text-xs uppercase tracking-wider" style="color: var(--color-text-muted);">Name</label>
				<input
					id="name"
					type="text"
					bind:value={name}
					disabled={immutable}
					class="w-full rounded px-3 py-2 text-sm focus:outline-none transition-colors"
					style="background: var(--color-surface-input); border: 1px solid var(--color-border-bold); color: var(--color-text-primary);"
				/>
			</div>
			<div class="space-y-1">
				<label for="status" class="text-xs uppercase tracking-wider" style="color: var(--color-text-muted);">Status</label>
				<select
					id="status"
					bind:value={status}
					disabled={immutable}
					class="w-full rounded px-3 py-2 text-sm focus:outline-none transition-colors"
					style="background: var(--color-surface-input); border: 1px solid var(--color-border-bold); color: var(--color-text-primary);"
				>
					<option value="draft">draft</option>
					<option value="published">published</option>
					<option value="archived">archived</option>
				</select>
			</div>
			<div class="space-y-1 md:col-span-2">
				<label for="description" class="text-xs uppercase tracking-wider" style="color: var(--color-text-muted);">Description</label>
				<textarea
					id="description"
					rows="2"
					bind:value={description}
					disabled={immutable}
					class="w-full rounded px-3 py-2 text-sm focus:outline-none transition-colors"
					style="background: var(--color-surface-input); border: 1px solid var(--color-border-bold); color: var(--color-text-primary);"
				></textarea>
			</div>
			<div class="space-y-1">
				<label for="core" class="text-xs uppercase tracking-wider" style="color: var(--color-text-muted);">factory-core version</label>
				<input
					id="core"
					type="text"
					bind:value={coreVersion}
					disabled={immutable}
					placeholder="^0.2"
					class="w-full rounded px-3 py-2 text-sm focus:outline-none transition-colors"
					style="background: var(--color-surface-input); border: 1px solid var(--color-border-bold); color: var(--color-text-primary);"
				/>
			</div>
			<div class="space-y-1">
				<label for="client" class="text-xs uppercase tracking-wider" style="color: var(--color-text-muted);">Client (optional)</label>
				<select
					id="client"
					bind:value={clientId}
					disabled={immutable}
					class="w-full rounded px-3 py-2 text-sm focus:outline-none transition-colors"
					style="background: var(--color-surface-input); border: 1px solid var(--color-border-bold); color: var(--color-text-primary);"
				>
					<option value="">— none —</option>
					{#each data.clients as c (c.id)}
						<option value={c.id}>{c.display_name}</option>
					{/each}
				</select>
			</div>
		</div>
	</section>

	<!-- Components & record types -->
	<section class="terminal-box px-5 py-5 space-y-4">
		<h2 class="text-xs uppercase tracking-wider" style="color: var(--color-text-muted);">Components & record types</h2>
		{#if data.manifest}
			<ComponentPicker
				selectedComponents={components}
				selectedRecordTypes={recordTypes}
				manifest={data.manifest as Manifest}
				onchange={(sel) => {
					if (immutable) return;
					components = sel.components;
					recordTypes = sel.recordTypes;
				}}
			/>
		{:else}
			<p class="text-xs" style="color: var(--color-text-faint);">Manifest unavailable.</p>
		{/if}
	</section>

	<!-- Suggested tenants -->
	<section class="terminal-box px-5 py-5 space-y-3">
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-xs uppercase tracking-wider" style="color: var(--color-text-muted);">Suggested tenants</h2>
				<p class="text-[11px] mt-0.5" style="color: var(--color-text-faint);">
					Prefilled on the staging pipeline when this seed is picked.
				</p>
			</div>
			{#if !immutable}
				<button
					type="button"
					onclick={addTenant}
					class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
					style="background: color-mix(in srgb, var(--color-pastel-peach) 18%, transparent); color: var(--color-pastel-peach);"
				>
					<Plus size={12} strokeWidth={2} /> Add
				</button>
			{/if}
		</div>

		{#if tenants.length === 0}
			<p class="text-xs" style="color: var(--color-text-faint);">No suggested tenants. Add one to pre-fill the staging form.</p>
		{:else}
			<div class="space-y-2">
				{#each tenants as t, i (i)}
					<div
						class="rounded p-3 space-y-2"
						style="background: var(--color-surface-input); border: 1px solid var(--color-border-soft);"
					>
						<div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
							<input
								type="text"
								placeholder="slug"
								value={t.slug}
								disabled={immutable}
								oninput={(e) => updateTenant(i, 'slug', e.currentTarget.value)}
								class="rounded px-2 py-1 text-xs focus:outline-none"
								style="background: var(--color-surface-card); border: 1px solid var(--color-border-bold); color: var(--color-text-primary);"
							/>
							<input
								type="text"
								placeholder="domain"
								value={t.domain}
								disabled={immutable}
								oninput={(e) => updateTenant(i, 'domain', e.currentTarget.value)}
								class="rounded px-2 py-1 text-xs focus:outline-none"
								style="background: var(--color-surface-card); border: 1px solid var(--color-border-bold); color: var(--color-text-primary);"
							/>
							<input
								type="email"
								placeholder="admin email"
								value={t.adminEmail}
								disabled={immutable}
								oninput={(e) => updateTenant(i, 'adminEmail', e.currentTarget.value)}
								class="rounded px-2 py-1 text-xs focus:outline-none"
								style="background: var(--color-surface-card); border: 1px solid var(--color-border-bold); color: var(--color-text-primary);"
							/>
						</div>
						<div class="flex items-center gap-2">
							<input
								type="text"
								placeholder="display name"
								value={t.displayName}
								disabled={immutable}
								oninput={(e) => updateTenant(i, 'displayName', e.currentTarget.value)}
								class="flex-1 rounded px-2 py-1 text-xs focus:outline-none"
								style="background: var(--color-surface-card); border: 1px solid var(--color-border-bold); color: var(--color-text-primary);"
							/>
							{#if !immutable}
								<button
									type="button"
									onclick={() => removeTenant(i)}
									class="p-1 rounded transition-colors"
									style="color: var(--color-text-muted);"
									aria-label="Remove tenant"
								>
									<X size={14} strokeWidth={1.75} />
								</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<!-- Advanced JSON (the rest of the payload — settings, elements, etc.) -->
	<details class="terminal-box">
		<summary class="px-5 py-3 cursor-pointer text-xs uppercase tracking-wider" style="color: var(--color-text-muted);">
			Advanced (raw payload — settings, elements, …)
		</summary>
		<div class="px-5 pb-5 space-y-2">
			<p class="text-[11px]" style="color: var(--color-text-faint);">
				This is the rest of the seed payload that doesn't yet have a structured editor.
				<code>active_components</code> and <code>active_record_types</code> are managed above and overwritten on save.
			</p>
			<textarea
				rows="20"
				bind:value={advancedJson}
				disabled={immutable}
				spellcheck="false"
				class="w-full rounded px-3 py-2 text-xs font-mono focus:outline-none"
				style="background: var(--color-surface-input); border: 1px solid var(--color-border-bold); color: var(--color-text-primary);"
			></textarea>
			{#if advancedJsonError}
				<p class="text-xs" style="color: var(--color-fail);">⚠ {advancedJsonError}</p>
			{/if}
		</div>
	</details>

	<!-- Save bar -->
	{#if !immutable}
		<div
			class="sticky bottom-4 mx-auto flex items-center justify-end gap-3 px-4 py-3 rounded-lg"
			style="background: color-mix(in srgb, var(--color-surface-card) 92%, transparent); backdrop-filter: blur(8px); border: 1px solid {dirty ? 'color-mix(in srgb, var(--color-pastel-cyan) 35%, transparent)' : 'var(--color-border-soft)'};"
		>
			<span class="text-xs flex-1" style="color: {dirty ? 'var(--color-pastel-amber)' : 'var(--color-text-faint)'};">
				{dirty ? '● unsaved changes' : 'no changes'}
			</span>
			<button
				type="button"
				onclick={save}
				disabled={!dirty || saving}
				class="btn-primary inline-flex items-center gap-2"
			>
				<Save size={14} strokeWidth={1.75} />
				{saving ? 'Saving…' : 'Save changes'}
			</button>
		</div>
	{/if}
</div>
