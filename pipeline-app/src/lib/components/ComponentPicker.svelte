<script lang="ts">
	import { manifestComponents, manifestRecordTypes, type Manifest } from '$lib/pipeline/types.js';

	interface Props {
		selectedComponents: string[];
		selectedRecordTypes: string[];
		manifest: Manifest | null;
		onchange: (selection: { components: string[]; recordTypes: string[] }) => void;
	}

	let { selectedComponents, selectedRecordTypes, manifest, onchange }: Props = $props();

	function toggleComponent(name: string) {
		const next = selectedComponents.includes(name)
			? selectedComponents.filter((s) => s !== name)
			: [...selectedComponents, name];
		onchange({ components: next, recordTypes: selectedRecordTypes });
	}

	function toggleRecordType(name: string) {
		const next = selectedRecordTypes.includes(name)
			? selectedRecordTypes.filter((s) => s !== name)
			: [...selectedRecordTypes, name];
		onchange({ components: selectedComponents, recordTypes: next });
	}

	let components = $derived(Object.keys(manifestComponents(manifest)));
	let recordTypes = $derived(Object.keys(manifestRecordTypes(manifest)));
</script>

<div class="space-y-4">
	<div class="space-y-2">
		<span class="text-xs text-zinc-400 uppercase tracking-wider block">Components</span>
		<div class="flex flex-wrap gap-2">
			{#each components as name}
				{@const active = selectedComponents.includes(name)}
				<button
					type="button"
					class="px-3 py-1 rounded-full text-xs font-medium transition-all
						{active
							? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40'
							: 'bg-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700'}"
					onclick={() => toggleComponent(name)}
				>
					{name}
				</button>
			{/each}
			{#if !manifest}
				<span class="text-zinc-600 text-xs">Loading manifest...</span>
			{/if}
		</div>
	</div>

	<div class="space-y-2">
		<span class="text-xs text-zinc-400 uppercase tracking-wider block">Record Types</span>
		<div class="flex flex-wrap gap-2">
			{#each recordTypes as name}
				{@const active = selectedRecordTypes.includes(name)}
				<button
					type="button"
					class="px-3 py-1 rounded-full text-xs font-medium transition-all
						{active
							? 'bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/40'
							: 'bg-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700'}"
					onclick={() => toggleRecordType(name)}
				>
					{name}
				</button>
			{/each}
			{#if manifest && recordTypes.length === 0}
				<span class="text-zinc-600 text-xs">No record types in manifest</span>
			{/if}
		</div>
	</div>
</div>
