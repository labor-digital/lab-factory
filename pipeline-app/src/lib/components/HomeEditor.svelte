<script lang="ts">
	import { ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-svelte';
	import { manifestComponents, type Manifest } from '$lib/pipeline/types.js';

	interface Props {
		elements: string[];
		manifest: Manifest | null;
		disabled: boolean;
		onchange: (elements: string[]) => void;
		onautoactivate: (component: string) => void;
	}

	let { elements, manifest, disabled, onchange, onautoactivate }: Props = $props();
	let collapsed = $state(true);

	let availableComponents = $derived(
		Object.keys(manifestComponents(manifest)).filter((name) => !elements.includes(name))
	);

	function moveUp(index: number) {
		if (index <= 0) return;
		const next = [...elements];
		[next[index - 1], next[index]] = [next[index], next[index - 1]];
		onchange(next);
	}

	function moveDown(index: number) {
		if (index >= elements.length - 1) return;
		const next = [...elements];
		[next[index], next[index + 1]] = [next[index + 1], next[index]];
		onchange(next);
	}

	function remove(index: number) {
		onchange(elements.filter((_, i) => i !== index));
	}

	function addComponent(name: string) {
		if (!name || elements.includes(name)) return;
		onchange([...elements, name]);
		onautoactivate(name);
	}
</script>

<div class="terminal-box overflow-hidden">
	<button
		type="button"
		class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-900/50 transition-colors"
		onclick={() => (collapsed = !collapsed)}
	>
		<span class="text-xs text-zinc-400 uppercase tracking-wider font-medium">Edit Home</span>
		<span class="text-zinc-600 text-xs">{collapsed ? '▸ expand' : '▾ collapse'}</span>
	</button>

	{#if !collapsed}
		<div class="px-4 pb-4 border-t border-zinc-800/50">
			<p class="text-[10px] text-zinc-500 mt-3 mb-3">
				Content elements to seed on the homepage, in display order.
			</p>

			{#if elements.length === 0}
				<p class="text-xs text-zinc-600 italic py-2">No elements selected</p>
			{/if}

			<div class="space-y-1">
				{#each elements as element, i}
					<div
						class="flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-900/50 border border-zinc-800/50"
					>
						<span class="text-zinc-500 text-[10px] font-mono w-5 shrink-0">{i + 1}</span>
						<span class="text-sm text-zinc-200 flex-1">{element}</span>
						<button
							type="button"
							title="Move up"
							onclick={() => moveUp(i)}
							disabled={i === 0 || disabled}
							class="p-1 text-zinc-600 hover:text-zinc-300 transition-colors disabled:opacity-30 disabled:pointer-events-none"
						>
							<ChevronUp size={14} />
						</button>
						<button
							type="button"
							title="Move down"
							onclick={() => moveDown(i)}
							disabled={i === elements.length - 1 || disabled}
							class="p-1 text-zinc-600 hover:text-zinc-300 transition-colors disabled:opacity-30 disabled:pointer-events-none"
						>
							<ChevronDown size={14} />
						</button>
						<button
							type="button"
							title="Remove"
							onclick={() => remove(i)}
							{disabled}
							class="p-1 text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-30 disabled:pointer-events-none"
						>
							<Trash2 size={14} />
						</button>
					</div>
				{/each}
			</div>

			{#if availableComponents.length > 0}
				<div class="mt-3 flex items-center gap-2">
					<Plus size={14} class="text-zinc-600 shrink-0" />
					<select
						onchange={(e) => {
							const val = e.currentTarget.value;
							if (val) {
								addComponent(val);
								e.currentTarget.value = '';
							}
						}}
						{disabled}
						class="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
					>
						<option value="">Add element...</option>
						{#each availableComponents as name}
							<option value={name}>{name}</option>
						{/each}
					</select>
				</div>
			{/if}
		</div>
	{/if}
</div>
