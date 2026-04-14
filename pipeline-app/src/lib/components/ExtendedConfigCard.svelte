<script lang="ts">
	import type { FactorySettings } from '$lib/pipeline/types.js';

	interface Props {
		settings: FactorySettings;
		disabled: boolean;
		onchange: (settings: FactorySettings) => void;
	}

	let { settings, disabled, onchange }: Props = $props();
	let collapsed = $state(true);

	function updatePlaceholderUrl(value: string) {
		onchange({ ...settings, placeholderImageBaseUrl: value });
	}
</script>

<div class="terminal-box overflow-hidden">
	<button
		type="button"
		class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-900/50 transition-colors"
		onclick={() => (collapsed = !collapsed)}
	>
		<span class="text-xs text-zinc-400 uppercase tracking-wider font-medium">Extended</span>
		<span class="text-zinc-600 text-xs">{collapsed ? '▸ expand' : '▾ collapse'}</span>
	</button>

	{#if !collapsed}
		<div class="px-4 pb-4 border-t border-zinc-800/50 space-y-4 pt-4">
			<div class="space-y-1">
				<label for="placeholderImageUrl" class="text-xs text-zinc-400 uppercase tracking-wider">
					Placeholder Image URL
				</label>
				<input
					id="placeholderImageUrl"
					type="text"
					value={settings.placeholderImageBaseUrl}
					oninput={(e) => updatePlaceholderUrl(e.currentTarget.value)}
					{disabled}
					class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
				/>
				<p class="text-[10px] text-zinc-600">
					Base URL for placeholder images. Default uses Lorem Picsum for random images.
					Set a direct image URL (e.g. https://example.com/image.webp) to use the same image everywhere.
				</p>
			</div>
		</div>
	{/if}
</div>
