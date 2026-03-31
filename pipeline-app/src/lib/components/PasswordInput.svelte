<script lang="ts">
	import { Eye, EyeOff } from 'lucide-svelte';

	interface Props {
		id: string;
		value: string;
		disabled?: boolean;
		oninput: (value: string) => void;
	}

	let { id, value, disabled = false, oninput }: Props = $props();
	let visible = $state(false);
</script>

<div class="relative">
	<input
		{id}
		type={visible ? 'text' : 'password'}
		{value}
		oninput={(e) => oninput(e.currentTarget.value)}
		{disabled}
		class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 pr-10 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
	/>
	<button
		type="button"
		tabindex={-1}
		class="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
		onclick={() => (visible = !visible)}
	>
		{#if visible}
			<EyeOff size={16} />
		{:else}
			<Eye size={16} />
		{/if}
	</button>
</div>
