<script lang="ts">
	import { Plus, Trash2 } from 'lucide-svelte';
	import type { FactorySettings, TailwindColor, NeutralColor, ColorMode } from '$lib/pipeline/types.js';
	import ColorSelect from './ColorSelect.svelte';
	import FontSelect from './FontSelect.svelte';

	interface Props {
		settings: FactorySettings;
		disabled: boolean;
		onchange: (settings: FactorySettings) => void;
	}

	let { settings, disabled, onchange }: Props = $props();
	let collapsed = $state(false);
	let showSystemColors = $state(false);

	const CHROMATIC_COLORS: TailwindColor[] = [
		'red', 'orange', 'amber', 'yellow', 'lime', 'green',
		'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo',
		'violet', 'purple', 'fuchsia', 'pink', 'rose'
	];

	const NEUTRAL_COLORS: NeutralColor[] = ['slate', 'gray', 'zinc', 'neutral', 'stone'];

	const ALL_COLORS = [...CHROMATIC_COLORS, ...NEUTRAL_COLORS];

	const SANS_PRESETS = ['Inter', 'Plus Jakarta Sans', 'DM Sans', 'Public Sans', 'Nunito Sans', 'Open Sans', 'system-ui'];
	const MONO_PRESETS = ['JetBrains Mono', 'Fira Code', 'Source Code Pro', 'IBM Plex Mono', 'monospace'];

	const RADIUS_OPTIONS: { value: string; label: string }[] = [
		{ value: '0rem', label: 'Sharp (0)' },
		{ value: '0.125rem', label: 'XS (0.125rem)' },
		{ value: '0.25rem', label: 'SM (0.25rem)' },
		{ value: '0.375rem', label: 'MD (0.375rem)' },
		{ value: '0.5rem', label: 'LG (0.5rem)' },
		{ value: '0.75rem', label: 'XL (0.75rem)' },
		{ value: '1rem', label: '2XL (1rem)' },
		{ value: '9999px', label: 'Full (9999px)' }
	];

	function updateColor(key: keyof FactorySettings['colors'], value: string) {
		onchange({
			...settings,
			colors: { ...settings.colors, [key]: value }
		});
	}

	function updateFont(key: 'sans' | 'mono', value: string) {
		onchange({
			...settings,
			fonts: { ...settings.fonts, [key]: value }
		});
	}

	function updateRadius(value: string) {
		onchange({ ...settings, radius: value });
	}

	function updateColorMode(value: ColorMode) {
		onchange({ ...settings, colorMode: value });
	}

	function updateBreakpoint(oldName: string, newName: string, value: string) {
		const entries = Object.entries(settings.breakpoints);
		const updated: Record<string, string> = {};
		for (const [k, v] of entries) {
			if (k === oldName) {
				updated[newName] = value;
			} else {
				updated[k] = v;
			}
		}
		onchange({ ...settings, breakpoints: updated });
	}

	function removeBreakpoint(name: string) {
		const { [name]: _, ...rest } = settings.breakpoints;
		onchange({ ...settings, breakpoints: rest });
	}

	function addBreakpoint() {
		onchange({
			...settings,
			breakpoints: { ...settings.breakpoints, '': '' }
		});
	}
</script>

<div class="terminal-box overflow-hidden">
	<button
		type="button"
		class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-900/50 transition-colors"
		onclick={() => (collapsed = !collapsed)}
	>
		<span class="text-xs text-zinc-400 uppercase tracking-wider font-medium">NuxtUI Theme</span>
		<span class="text-zinc-600 text-xs">{collapsed ? '▸ expand' : '▾ collapse'}</span>
	</button>

	{#if !collapsed}
		<div class="px-4 pb-4 space-y-5 border-t border-zinc-800/50">

			<!-- Brand Colors -->
			<div class="pt-4">
				<p class="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Brand Colors</p>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="space-y-1">
						<label for="colorPrimary" class="text-xs text-zinc-400 uppercase tracking-wider">Primary</label>
						<ColorSelect
							id="colorPrimary"
							value={settings.colors.primary}
							options={CHROMATIC_COLORS}
							{disabled}
							onchange={(v) => updateColor('primary', v)}
						/>
					</div>
					<div class="space-y-1">
						<label for="colorSecondary" class="text-xs text-zinc-400 uppercase tracking-wider">Secondary</label>
						<ColorSelect
							id="colorSecondary"
							value={settings.colors.secondary}
							options={ALL_COLORS}
							{disabled}
							onchange={(v) => updateColor('secondary', v)}
						/>
					</div>
				</div>
			</div>

			<!-- System Colors (collapsible) -->
			<div>
				<button
					type="button"
					class="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
					onclick={() => (showSystemColors = !showSystemColors)}
				>
					{showSystemColors ? '▾ Hide' : '▸ Show'} System Colors
				</button>

				{#if showSystemColors}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
						<div class="space-y-1">
							<label for="colorSuccess" class="text-xs text-zinc-400 uppercase tracking-wider">Success</label>
							<ColorSelect
								id="colorSuccess"
								value={settings.colors.success}
								options={CHROMATIC_COLORS}
								{disabled}
								onchange={(v) => updateColor('success', v)}
							/>
						</div>
						<div class="space-y-1">
							<label for="colorInfo" class="text-xs text-zinc-400 uppercase tracking-wider">Info</label>
							<ColorSelect
								id="colorInfo"
								value={settings.colors.info}
								options={CHROMATIC_COLORS}
								{disabled}
								onchange={(v) => updateColor('info', v)}
							/>
						</div>
						<div class="space-y-1">
							<label for="colorWarning" class="text-xs text-zinc-400 uppercase tracking-wider">Warning</label>
							<ColorSelect
								id="colorWarning"
								value={settings.colors.warning}
								options={CHROMATIC_COLORS}
								{disabled}
								onchange={(v) => updateColor('warning', v)}
							/>
						</div>
						<div class="space-y-1">
							<label for="colorError" class="text-xs text-zinc-400 uppercase tracking-wider">Error</label>
							<ColorSelect
								id="colorError"
								value={settings.colors.error}
								options={CHROMATIC_COLORS}
								{disabled}
								onchange={(v) => updateColor('error', v)}
							/>
						</div>
						<div class="space-y-1">
							<label for="colorNeutral" class="text-xs text-zinc-400 uppercase tracking-wider">Neutral</label>
							<ColorSelect
								id="colorNeutral"
								value={settings.colors.neutral}
								options={NEUTRAL_COLORS}
								{disabled}
								onchange={(v) => updateColor('neutral', v)}
							/>
						</div>
					</div>
				{/if}
			</div>

			<!-- Typography -->
			<div>
				<p class="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Typography</p>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="space-y-1">
						<label for="fontSans" class="text-xs text-zinc-400 uppercase tracking-wider">Sans Font</label>
						<FontSelect
							id="fontSans"
							value={settings.fonts.sans}
							presets={SANS_PRESETS}
							{disabled}
							onchange={(v) => updateFont('sans', v)}
						/>
					</div>
					<div class="space-y-1">
						<label for="fontMono" class="text-xs text-zinc-400 uppercase tracking-wider">Mono Font</label>
						<FontSelect
							id="fontMono"
							value={settings.fonts.mono}
							presets={MONO_PRESETS}
							{disabled}
							onchange={(v) => updateFont('mono', v)}
						/>
					</div>
				</div>
			</div>

			<!-- Appearance -->
			<div>
				<p class="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Appearance</p>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="space-y-1">
						<label for="radius" class="text-xs text-zinc-400 uppercase tracking-wider">Border Radius</label>
						<select
							id="radius"
							{disabled}
							class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50 appearance-none cursor-pointer"
							onchange={(e) => updateRadius(e.currentTarget.value)}
						>
							{#each RADIUS_OPTIONS as opt}
								<option value={opt.value} selected={opt.value === settings.radius}>{opt.label}</option>
							{/each}
						</select>
					</div>
					<div class="space-y-1">
						<label for="colorMode" class="text-xs text-zinc-400 uppercase tracking-wider">Color Mode</label>
						<select
							id="colorMode"
							{disabled}
							class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50 appearance-none cursor-pointer"
							onchange={(e) => updateColorMode(e.currentTarget.value as ColorMode)}
						>
							<option value="system" selected={settings.colorMode === 'system'}>System</option>
							<option value="light" selected={settings.colorMode === 'light'}>Light</option>
							<option value="dark" selected={settings.colorMode === 'dark'}>Dark</option>
						</select>
					</div>
				</div>
			</div>

			<!-- Breakpoints -->
			<div>
				<p class="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Breakpoints</p>
				<div class="space-y-2">
					{#each Object.entries(settings.breakpoints) as [name, value], i}
						<div class="flex items-center gap-2">
							<input
								type="text"
								{disabled}
								{value}
								placeholder="name"
								class="w-20 bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50 font-mono"
								oninput={(e) => {
									const newName = e.currentTarget.value;
									const entries = Object.entries(settings.breakpoints);
									const updated: Record<string, string> = {};
									for (const [k, v] of entries) {
										updated[k === name ? newName : k] = v;
									}
									onchange({ ...settings, breakpoints: updated });
								}}
							/>
							<input
								type="text"
								{disabled}
								value={value}
								placeholder="value"
								class="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50 font-mono"
								oninput={(e) => updateBreakpoint(name, name, e.currentTarget.value)}
							/>
							<button
								type="button"
								{disabled}
								class="p-1.5 text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-50"
								title="Remove breakpoint"
								onclick={() => removeBreakpoint(name)}
							>
								<Trash2 size={14} />
							</button>
						</div>
					{/each}
					<button
						type="button"
						{disabled}
						class="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-cyan-400 transition-colors disabled:opacity-50"
						onclick={addBreakpoint}
					>
						<Plus size={12} />
						Add Breakpoint
					</button>
				</div>
			</div>

		</div>
	{/if}
</div>
