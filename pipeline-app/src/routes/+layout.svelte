<script lang="ts">
	import '../app.css';
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	const toastOptions = {
		reversed: true,
		intro: { y: 64 }
	};
</script>

<div class="min-h-screen">
	{@render children()}
</div>

<SvelteToast options={toastOptions} />

<style>
	:global(._toastContainer) {
		--toastContainerTop: auto;
		--toastContainerRight: 1.5rem;
		--toastContainerBottom: 1.5rem;
		--toastContainerLeft: auto;
		--toastWidth: 22rem;
		--toastBorderRadius: 0.5rem;
		--toastMsgPadding: 0.75rem 1rem;
		--toastBtnContent: '✕';
		--toastBtnFont: 0.75rem monospace;
		font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', ui-monospace, monospace;
		font-size: 0.8125rem;
	}
</style>
