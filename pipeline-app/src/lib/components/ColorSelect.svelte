<script lang="ts">
	interface Props {
		id: string;
		value: string;
		options: string[];
		disabled: boolean;
		onchange: (value: string) => void;
	}

	let { id, value, options, disabled, onchange }: Props = $props();

	const COLOR_SWATCHES: Record<string, string> = {
		red: '#ef4444',
		orange: '#f97316',
		amber: '#f59e0b',
		yellow: '#eab308',
		lime: '#84cc16',
		green: '#22c55e',
		emerald: '#10b981',
		teal: '#14b8a6',
		cyan: '#06b6d4',
		sky: '#0ea5e9',
		blue: '#3b82f6',
		indigo: '#6366f1',
		violet: '#8b5cf6',
		purple: '#a855f7',
		fuchsia: '#d946ef',
		pink: '#ec4899',
		rose: '#f43f5e',
		slate: '#64748b',
		gray: '#6b7280',
		zinc: '#71717a',
		neutral: '#737373',
		stone: '#78716c'
	};

	let isCustom = $derived(!options.includes(value) && value !== '');

	function swatchColor(v: string): string {
		return COLOR_SWATCHES[v] ?? v;
	}
</script>

<div class="relative flex items-center gap-2">
	<div class="relative flex-1">
		<select
			{id}
			{disabled}
			class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 pl-8 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50 appearance-none cursor-pointer"
			value={isCustom ? '__custom__' : value}
			onchange={(e) => {
				const v = e.currentTarget.value;
				if (v === '__custom__') {
					onchange(value.startsWith('#') ? value : '#3b82f6');
				} else {
					onchange(v);
				}
			}}
		>
			{#each options as option}
				<option value={option} selected={option === value}>{option}</option>
			{/each}
			<option value="__custom__" selected={isCustom}>Custom…</option>
		</select>
		<span
			class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-zinc-600"
			style="background-color: {swatchColor(value)}"
		></span>
		<span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs pointer-events-none">▾</span>
	</div>

	{#if isCustom}
		<div class="flex items-center gap-1.5">
			<input
				type="color"
				value={value}
				{disabled}
				class="w-8 h-8 rounded border border-zinc-700 bg-zinc-900 cursor-pointer disabled:opacity-50 p-0.5"
				oninput={(e) => onchange(e.currentTarget.value)}
			/>
			<input
				type="text"
				value={value}
				{disabled}
				placeholder="#000000"
				class="w-20 bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-cyan-500 disabled:opacity-50"
				oninput={(e) => {
					const v = e.currentTarget.value;
					if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onchange(v);
				}}
			/>
		</div>
	{/if}
</div>
