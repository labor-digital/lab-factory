<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { getBrowserSupabase } from '$lib/supabase/browser.js';
	import { toastError, toastSuccess } from '$lib/toast.js';

	const { data } = $props();

	let email = $state('');
	let password = $state('');
	let busy = $state(false);
	let magicBusy = $state(false);
	let magicSent = $state(false);
	let magicCooldown = $state(0);
	let errorMsg = $derived(page.url.searchParams.get('error') ?? '');

	const COOLDOWN_SECONDS = 60;

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		busy = true;
		try {
			const supabase = getBrowserSupabase(data.supabaseConfig.url, data.supabaseConfig.anonKey);
			const { error } = await supabase.auth.signInWithPassword({ email, password });
			if (error) {
				toastError(error.message);
				return;
			}
			toastSuccess('Signed in');
			const from = new URL(page.url).searchParams.get('from') || '/';
			await goto(from, { invalidateAll: true });
		} finally {
			busy = false;
		}
	}

	function startCooldown() {
		magicCooldown = COOLDOWN_SECONDS;
		const tick = setInterval(() => {
			magicCooldown -= 1;
			if (magicCooldown <= 0) clearInterval(tick);
		}, 1000);
	}

	function friendlyOtpError(err: { status?: number; message: string }): string {
		const status = err.status ?? 0;
		const msg = err.message ?? '';
		if (status === 429 || /rate.?limit|too many/i.test(msg)) {
			return "Too many requests — Supabase rate-limits magic-link emails. Wait a few minutes, then try again.";
		}
		if (/email.*not.*confirmed|signup.*disabled/i.test(msg)) {
			return "Email not registered. Ask an admin to invite you first.";
		}
		return msg || 'Failed to send magic link';
	}

	async function sendMagicLink() {
		if (!email.trim()) {
			toastError('Enter your email first');
			return;
		}
		if (magicCooldown > 0) return;
		magicBusy = true;
		try {
			const supabase = getBrowserSupabase(data.supabaseConfig.url, data.supabaseConfig.anonKey);
			const { error } = await supabase.auth.signInWithOtp({
				email: email.trim(),
				options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
			});
			if (error) {
				toastError(friendlyOtpError(error));
				// Even on failure we cool down, so users don't burn through the limit faster.
				startCooldown();
				return;
			}
			magicSent = true;
			startCooldown();
			toastSuccess('Magic link sent — check your email');
		} finally {
			magicBusy = false;
		}
	}
</script>

<svelte:head>
	<title>Sign in — Factory</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center px-4">
	<form
		onsubmit={submit}
		class="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-xl px-8 py-10 space-y-6"
	>
		<div class="text-center">
			<h1 class="text-zinc-100 text-xl font-semibold">Factory</h1>
			<p class="text-zinc-500 text-xs mt-1">Sign in to the pipeline dashboard</p>
		</div>

		{#if errorMsg}
			<div class="px-3 py-2 bg-rose-950/40 border border-rose-900/50 rounded text-xs text-rose-300">
				{errorMsg}
			</div>
		{/if}

		<div class="space-y-1">
			<label for="email" class="text-xs text-zinc-400 uppercase tracking-wider">Email</label>
			<input
				id="email"
				type="email"
				autocomplete="email"
				required
				bind:value={email}
				class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
			/>
		</div>

		<div class="space-y-1">
			<label for="password" class="text-xs text-zinc-400 uppercase tracking-wider">Password</label>
			<input
				id="password"
				type="password"
				autocomplete="current-password"
				required
				bind:value={password}
				class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
			/>
		</div>

		<button
			type="submit"
			disabled={busy}
			class="w-full px-6 py-2.5 bg-cyan-500/20 text-cyan-300 rounded-lg text-sm font-medium
				hover:bg-cyan-500/30 transition-colors ring-1 ring-cyan-500/30
				disabled:opacity-40 disabled:pointer-events-none"
		>
			{busy ? 'Signing in…' : 'Sign in'}
		</button>

		<div class="flex items-center gap-3 text-[10px] uppercase tracking-wider text-zinc-700">
			<div class="flex-1 h-px bg-zinc-900"></div>
			<span>or</span>
			<div class="flex-1 h-px bg-zinc-900"></div>
		</div>

		<button
			type="button"
			onclick={sendMagicLink}
			disabled={magicBusy || magicCooldown > 0}
			class="w-full px-6 py-2 bg-zinc-900 text-zinc-300 rounded-lg text-sm
				hover:bg-zinc-800 transition-colors border border-zinc-800
				disabled:opacity-40 disabled:pointer-events-none"
		>
			{#if magicBusy}
				Sending…
			{:else if magicCooldown > 0 && magicSent}
				✓ Sent — resend in {magicCooldown}s
			{:else if magicCooldown > 0}
				Wait {magicCooldown}s before retrying
			{:else}
				Send me a magic link
			{/if}
		</button>
		<p class="text-[11px] text-zinc-600 text-center -mt-3">
			{#if magicSent}
				Check your inbox. The link works once and signs you in.
			{:else}
				No password needed — we'll email you a one-tap sign-in link.
			{/if}
		</p>
	</form>
</div>
