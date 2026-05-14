<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { getBrowserSupabase } from '$lib/supabase/browser.js';
	import { toastError, toastSuccess } from '$lib/toast.js';

	const { data } = $props();

	let password = $state('');
	let confirm = $state('');
	let busy = $state(false);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (password !== confirm) {
			toastError('Passwords do not match');
			return;
		}
		if (password.length < 8) {
			toastError('Password must be at least 8 characters');
			return;
		}
		busy = true;
		try {
			const supabase = getBrowserSupabase(data.supabaseConfig.url, data.supabaseConfig.anonKey);
			const { error } = await supabase.auth.updateUser({ password });
			if (error) {
				toastError(error.message);
				return;
			}
			toastSuccess('Password set');
			await invalidateAll();
			await goto('/');
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>Set password — Factory</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center px-4">
	<form
		onsubmit={submit}
		class="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-xl px-8 py-10 space-y-6"
	>
		<div class="text-center">
			<h1 class="text-zinc-100 text-xl font-semibold">Set a password</h1>
			<p class="text-zinc-500 text-xs mt-1">
				Signed in as <span class="text-zinc-300">{data.user?.email ?? '—'}</span>
			</p>
		</div>

		<div class="space-y-1">
			<label for="password" class="text-xs text-zinc-400 uppercase tracking-wider">New password</label>
			<input
				id="password"
				type="password"
				autocomplete="new-password"
				required
				minlength="8"
				bind:value={password}
				class="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500"
			/>
		</div>

		<div class="space-y-1">
			<label for="confirm" class="text-xs text-zinc-400 uppercase tracking-wider">Confirm password</label>
			<input
				id="confirm"
				type="password"
				autocomplete="new-password"
				required
				minlength="8"
				bind:value={confirm}
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
			{busy ? 'Saving…' : 'Set password and continue'}
		</button>
	</form>
</div>
