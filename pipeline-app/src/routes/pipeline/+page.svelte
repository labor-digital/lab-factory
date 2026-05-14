<script lang="ts">
	import { HardDrive, Cloud, ArrowRight } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Pipelines — Factory</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-6 py-8 space-y-6">
	<header>
		<h1 class="text-zinc-100 text-lg font-semibold">Run a pipeline</h1>
		<p class="text-zinc-500 text-xs mt-0.5">Pick the target. Local needs docker on your laptop; staging deploys to the shared TYPO3 + fly.io.</p>
	</header>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<a
			href="/pipeline/local"
			class="terminal-box px-6 py-6 hover:border-cyan-700 transition-colors group block"
		>
			<div class="flex items-center justify-between mb-3">
				<HardDrive size={22} class="text-cyan-400" strokeWidth={1.5} />
				<ArrowRight size={16} class="text-zinc-700 group-hover:text-cyan-400 transition-colors" strokeWidth={1.75} />
			</div>
			<h2 class="text-zinc-100 text-base font-semibold">Local stack</h2>
			<p class="text-zinc-500 text-xs mt-1.5 leading-relaxed">
				Spin up a full docker stack on your laptop. Pick a seed, give the project a name, run. No Bitbucket, no fly.io.
			</p>
			<p class="text-zinc-700 text-[11px] mt-3">
				Requires <code>docker compose</code> locally.
			</p>
		</a>

		<a
			href="/pipeline/staging"
			class="terminal-box px-6 py-6 hover:border-amber-800 transition-colors group block"
		>
			<div class="flex items-center justify-between mb-3">
				<Cloud size={22} class="text-amber-400" strokeWidth={1.5} />
				<ArrowRight size={16} class="text-zinc-700 group-hover:text-amber-400 transition-colors" strokeWidth={1.75} />
			</div>
			<h2 class="text-zinc-100 text-base font-semibold">Staging deploy</h2>
			<p class="text-zinc-500 text-xs mt-1.5 leading-relaxed">
				Provision a tenant on the shared TYPO3, deploy the Nuxt frontend to fly.io. Pick client + seed + tenant slug, run.
			</p>
			<p class="text-zinc-700 text-[11px] mt-3">
				Requires <code>STAGING_API_TOKEN</code> + <code>FLY_API_TOKEN</code> server-side.
			</p>
		</a>
	</div>

	<details class="mt-6">
		<summary class="text-xs text-zinc-600 hover:text-zinc-400 cursor-pointer">Legacy: combined config form</summary>
		<div class="mt-2 text-xs text-zinc-500 leading-relaxed">
			The original one-pager with all fields is preserved at
			<a href="/pipeline/legacy" class="text-cyan-400 hover:text-cyan-300">/pipeline/legacy</a>
			while the focused flows above are being filled in. Once Local and Staging are feature-complete the legacy route will be removed.
		</div>
	</details>
</div>
