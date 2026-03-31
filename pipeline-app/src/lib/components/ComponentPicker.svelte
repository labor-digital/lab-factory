<script lang="ts">
	import type { Manifest } from '$lib/pipeline/types.js';

	interface Props {
		selected: string[];
		manifest: Manifest | null;
		onchange: (selected: string[]) => void;
	}

	let { selected, manifest, onchange }: Props = $props();

	function toggle(name: string) {
		if (selected.includes(name)) {
			onchange(selected.filter((s) => s !== name));
		} else {
			onchange([...selected, name]);
		}
	}

	let components = $derived(manifest ? Object.keys(manifest) : []);
</script>

<div class="space-y-2">
	<span class="text-xs text-zinc-400 uppercase tracking-wider block">Components</span>
	<div class="flex flex-wrap gap-2">
		{#each components as name}
			{@const active = selected.includes(name)}
			<button
				type="button"
				class="px-3 py-1 rounded-full text-xs font-medium transition-all
					{active
						? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40'
						: 'bg-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700'}"
				onclick={() => toggle(name)}
			>
				{name}
			</button>
		{/each}
		{#if !manifest}
			<span class="text-zinc-600 text-xs">Loading manifest...</span>
		{/if}
	</div>
</div>
