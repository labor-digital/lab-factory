<script lang="ts">
	interface Props {
		id: string;
		value: string;
		presets: string[];
		disabled: boolean;
		onchange: (value: string) => void;
	}

	let { id, value, presets, disabled, onchange }: Props = $props();

	let isCustom = $derived(!presets.includes(value));
	let customValue = $state('');

	$effect(() => {
		if (isCustom && value !== customValue) {
			customValue = value;
		}
	});

	function handleSelect(e: Event) {
		const selected = (e.currentTarget as HTMLSelectElement).value;
		if (selected === '__custom__') {
			customValue = value;
		} else {
			onchange(selected);
		}
	}

	function handleCustomInput(e: Event) {
		const val = (e.currentTarget as HTMLInputElement).value;
		customValue = val;
		onchange(val);
	}
</script>

<div class="space-y-1.5">
	<select
		{id}
		{disabled}
		class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50 appearance-none cursor-pointer"
		onchange={handleSelect}
	>
		{#each presets as preset}
			<option value={preset} selected={!isCustom && preset === value}>{preset}</option>
		{/each}
		<option value="__custom__" selected={isCustom}>Other…</option>
	</select>

	{#if isCustom}
		<input
			type="text"
			value={customValue}
			oninput={handleCustomInput}
			{disabled}
			placeholder="Custom font family"
			class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
		/>
	{/if}
</div>
