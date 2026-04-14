<script lang="ts">
	import type { SeedTemplate } from '$lib/pipeline/types.js';

	interface Props {
		selected: string;
		templates: SeedTemplate[];
		disabled: boolean;
		onchange: (slug: string) => void;
	}

	let { selected, templates, disabled, onchange }: Props = $props();
</script>

<div class="space-y-2">
	<span class="text-xs text-zinc-400 uppercase tracking-wider block">Seed Template</span>
	<div class="flex items-center gap-3">
		<select
			value={selected}
			onchange={(e) => onchange(e.currentTarget.value)}
			{disabled}
			class="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
		>
			<option value="">Custom (use Edit Home)</option>
			{#each templates as tpl}
				<option value={tpl.slug}>{tpl.name}</option>
			{/each}
		</select>
	</div>
	{#if selected}
		{@const tpl = templates.find((t) => t.slug === selected)}
		{#if tpl?.description}
			<p class="text-[10px] text-zinc-500">{tpl.description}</p>
		{/if}
	{:else}
		<p class="text-[10px] text-zinc-600">Select a template to seed a pre-built homepage, or use "Edit Home" to compose your own.</p>
	{/if}
</div>
