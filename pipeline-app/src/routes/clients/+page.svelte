<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Plus, Trash2, Sprout } from 'lucide-svelte';
	import { toastError, toastSuccess } from '$lib/toast.js';

	const { data } = $props();

	let creating = $state(false);
	let newSlug = $state('');
	let newName = $state('');
	let newNotes = $state('');
	let busy = $state(false);

	function reset() {
		newSlug = '';
		newName = '';
		newNotes = '';
		creating = false;
	}

	async function create(e: SubmitEvent) {
		e.preventDefault();
		if (busy) return;
		busy = true;
		try {
			const res = await fetch('/api/clients', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ slug: newSlug.trim(), displayName: newName.trim(), notes: newNotes.trim() || null })
			});
			if (!res.ok) {
				toastError(`Create failed: ${await res.text()}`);
				return;
			}
			toastSuccess(`Client "${newName}" added`);
			reset();
			await invalidateAll();
		} finally {
			busy = false;
		}
	}

	async function remove(id: string, name: string) {
		if (!confirm(`Delete client "${name}"? Seeds owned by this client will be detached, not deleted.`)) return;
		const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
		if (!res.ok) {
			toastError(`Delete failed: ${await res.text()}`);
			return;
		}
		toastSuccess(`Deleted "${name}"`);
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>Clients — Factory</title>
</svelte:head>

<div class="max-w-6xl mx-auto px-6 py-8 space-y-6">
	<header class="flex items-center justify-between">
		<div>
			<h1 class="text-zinc-100 text-lg font-semibold">Clients</h1>
			<p class="text-zinc-500 text-xs mt-0.5">Companies that own one or more tenants and seeds.</p>
		</div>
		{#if !creating}
			<button
				type="button"
				onclick={() => (creating = true)}
				class="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/15 text-cyan-300 rounded text-xs ring-1 ring-cyan-500/30 hover:bg-cyan-500/25 transition-colors"
			>
				<Plus size={14} strokeWidth={2} /> New client
			</button>
		{/if}
	</header>

	{#if creating}
		<form onsubmit={create} class="terminal-box px-5 py-4 space-y-3">
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<div class="space-y-1">
					<label for="slug" class="text-xs text-zinc-400 uppercase tracking-wider">Slug</label>
					<input
						id="slug"
						type="text"
						required
						pattern="[a-z0-9][a-z0-9-]*"
						bind:value={newSlug}
						placeholder="acme-corp"
						class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
					/>
				</div>
				<div class="space-y-1">
					<label for="name" class="text-xs text-zinc-400 uppercase tracking-wider">Display name</label>
					<input
						id="name"
						type="text"
						required
						bind:value={newName}
						placeholder="Acme Corp."
						class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
					/>
				</div>
			</div>
			<div class="space-y-1">
				<label for="notes" class="text-xs text-zinc-400 uppercase tracking-wider">Notes</label>
				<textarea
					id="notes"
					rows="2"
					bind:value={newNotes}
					placeholder="Optional — internal context, contact, scope."
					class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
				></textarea>
			</div>
			<div class="flex items-center justify-end gap-2">
				<button type="button" onclick={reset} class="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300">Cancel</button>
				<button
					type="submit"
					disabled={busy}
					class="px-4 py-1.5 bg-cyan-500/20 text-cyan-300 rounded text-xs ring-1 ring-cyan-500/30 hover:bg-cyan-500/30 transition-colors disabled:opacity-40"
				>
					{busy ? 'Creating…' : 'Create'}
				</button>
			</div>
		</form>
	{/if}

	{#if data.clients.length === 0 && !creating}
		<div class="terminal-box px-6 py-10 text-center">
			<Sprout size={28} class="mx-auto text-zinc-700 mb-3" strokeWidth={1.5} />
			<p class="text-sm text-zinc-400">No clients yet.</p>
			<p class="text-xs text-zinc-600 mt-1">Click "New client" to add one.</p>
		</div>
	{:else if data.clients.length > 0}
		<div class="terminal-box overflow-hidden">
			<table class="w-full text-sm">
				<thead class="text-xs text-zinc-500 uppercase tracking-wider">
					<tr class="border-b border-zinc-900">
						<th class="text-left font-normal px-5 py-2.5">Client</th>
						<th class="text-left font-normal px-2 py-2.5">Slug</th>
						<th class="text-right font-normal px-2 py-2.5">Seeds</th>
						<th class="text-right font-normal px-5 py-2.5"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-zinc-900">
					{#each data.clients as client (client.id)}
						<tr class="hover:bg-zinc-900/40 transition-colors">
							<td class="px-5 py-2.5">
								<div class="text-zinc-200">{client.display_name}</div>
								{#if client.notes}
									<div class="text-xs text-zinc-500 mt-0.5 truncate max-w-md">{client.notes}</div>
								{/if}
							</td>
							<td class="px-2 py-2.5">
								<code class="text-xs text-zinc-500">{client.slug}</code>
							</td>
							<td class="px-2 py-2.5 text-right">
								<span class="text-xs text-zinc-400">{client.seedCount}</span>
							</td>
							<td class="px-5 py-2.5 text-right">
								<button
									type="button"
									onclick={() => remove(client.id, client.display_name)}
									class="text-zinc-600 hover:text-rose-400 transition-colors"
									aria-label="Delete"
								>
									<Trash2 size={14} strokeWidth={1.75} />
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
