<script lang="ts">
	import type { SeedLibraryEntry } from '$lib/pipeline/types.js';

	interface Props {
		entry: SeedLibraryEntry;
		onuse: (entry: SeedLibraryEntry) => void;
		onreseed: (entry: SeedLibraryEntry) => void;
		/** Kept for back-compat with /seeds page; delete now lives on /seeds/[slug]. */
		ondelete?: (entry: SeedLibraryEntry) => void;
	}

	let { entry, onuse, onreseed }: Props = $props();

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
				<a
					href={`/seeds/${encodeURIComponent(entry.slug)}`}
					class="text-sm truncate hover:opacity-80"
					style="color: var(--color-text-primary);"
				>{entry.name}</a>
				<span class="pastel-chip {entry.source === 'builtin' ? 'pastel-chip-neutral' : 'pastel-chip-cyan'}">
					{entry.source}
				</span>
				{#if entry.status === 'draft'}
					<span class="pastel-chip pastel-chip-amber">draft</span>
				{:else if entry.status === 'archived'}
					<span class="pastel-chip pastel-chip-neutral">archived</span>
				{/if}
			</div>
			<p class="text-[11px] line-clamp-2 mt-0.5" style="color: var(--color-text-muted);">{entry.description || '—'}</p>
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

	<div class="flex items-center gap-2 mt-auto pt-2" style="border-top: 1px solid var(--color-border-soft);">
		<button
			type="button"
			class="text-xs px-2 py-1 rounded transition-colors"
			style="background: color-mix(in srgb, var(--color-pastel-cyan) 22%, transparent); color: var(--color-pastel-cyan);"
			onclick={() => onuse(entry)}
		>Use</button>
		<button
			type="button"
			class="text-xs px-2 py-1 rounded transition-colors"
			style="background: var(--color-surface-hover); color: var(--color-text-secondary);"
			onclick={() => onreseed(entry)}
			title="Apply to a running local stack without rebuild"
		>Apply</button>
		<a
			href={`/seeds/${encodeURIComponent(entry.slug)}`}
			class="text-xs px-2 py-1 rounded ml-auto transition-colors"
			style="color: var(--color-text-muted);"
		>Edit →</a>
	</div>
</div>
