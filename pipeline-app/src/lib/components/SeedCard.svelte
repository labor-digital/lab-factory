<script lang="ts">
	import type { SeedLibraryEntry } from '$lib/pipeline/types.js';

	interface Props {
		entry: SeedLibraryEntry;
		onuse: (entry: SeedLibraryEntry) => void;
		onreseed: (entry: SeedLibraryEntry) => void;
		ondelete: (entry: SeedLibraryEntry) => void;
	}

	let { entry, onuse, onreseed, ondelete }: Props = $props();

	const colors = $derived.by(() => {
		const c = entry.settings?.colors;
		if (!c) return [] as string[];
		const order = ['primary', 'secondary', 'success', 'info', 'warning'] as const;
		return order
			.map((k) => (c as Record<string, string>)[k])
			.filter((v): v is string => typeof v === 'string' && v.length > 0)
			.slice(0, 5);
	});

	function swatchStyle(color: string): string {
		if (color.startsWith('#')) return `background:${color}`;
		const named: Record<string, string> = {
			red: '#ef4444', orange: '#f97316', amber: '#f59e0b', yellow: '#eab308',
			lime: '#84cc16', green: '#22c55e', emerald: '#10b981', teal: '#14b8a6',
			cyan: '#06b6d4', sky: '#0ea5e9', blue: '#3b82f6', indigo: '#6366f1',
			violet: '#8b5cf6', purple: '#a855f7', fuchsia: '#d946ef', pink: '#ec4899',
			rose: '#f43f5e', slate: '#64748b', gray: '#6b7280', zinc: '#71717a',
			neutral: '#737373', stone: '#78716c'
		};
		return `background:${named[color] ?? '#52525b'}`;
	}

	const monogram = $derived(entry.name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || '··');
</script>

<div class="terminal-box flex flex-col gap-3 p-4">
	<div class="flex items-start gap-3">
		<div
			class="w-12 h-12 rounded flex items-center justify-center text-zinc-100 text-sm font-medium shrink-0"
			style={colors[0] ? swatchStyle(colors[0]) : 'background:#27272a'}
		>
			{monogram}
		</div>
		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2">
				<h3 class="text-sm text-zinc-100 truncate">{entry.name}</h3>
				<span
					class="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 {entry.source === 'builtin' ? 'bg-zinc-800 text-zinc-400' : 'bg-cyan-950 text-cyan-300'}"
				>{entry.source}</span>
			</div>
			<p class="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">{entry.description || '—'}</p>
		</div>
	</div>

	<div class="flex items-center gap-2 text-[10px] text-zinc-500">
		{#if entry.coreVersion}
			<span class="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded">core {entry.coreVersion}</span>
		{/if}
		<span>{entry.components.length} components</span>
		{#if entry.recordTypes.length > 0}
			<span>· {entry.recordTypes.length} record types</span>
		{/if}
	</div>

	{#if colors.length > 0}
		<div class="flex gap-1">
			{#each colors as c}
				<span class="w-5 h-5 rounded-sm border border-zinc-800" style={swatchStyle(c)} title={c}></span>
			{/each}
		</div>
	{/if}

	<div class="flex items-center gap-2 mt-auto pt-2 border-t border-zinc-900">
		<button
			type="button"
			class="text-xs px-2 py-1 rounded bg-cyan-700 text-cyan-50 hover:bg-cyan-600 transition-colors"
			onclick={() => onuse(entry)}
		>Use</button>
		<button
			type="button"
			class="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors"
			onclick={() => onreseed(entry)}
			title="Apply to a running local stack without rebuild"
		>Apply</button>
		{#if entry.source === 'library'}
			<button
				type="button"
				class="text-xs px-2 py-1 rounded text-zinc-500 hover:text-red-400 transition-colors ml-auto"
				onclick={() => ondelete(entry)}
			>Delete</button>
		{/if}
	</div>
</div>
