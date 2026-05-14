<script lang="ts">
	import '../app.css';
	import { onMount, type Snippet } from 'svelte';
	import { invalidate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import { getBrowserSupabase } from '$lib/supabase/browser.js';
	import { LogOut, LayoutDashboard, Sprout, Building2, Server, Cloud, PlayCircle } from 'lucide-svelte';

	interface Props {
		children: Snippet;
		data: { user: import('@supabase/supabase-js').User | null; supabaseConfig: { url: string; anonKey: string } };
	}

	let { children, data }: Props = $props();

	onMount(() => {
		const supabase = getBrowserSupabase(data.supabaseConfig.url, data.supabaseConfig.anonKey);
		const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
			if (session?.expires_at) invalidate('supabase:auth');
		});
		return () => sub.subscription.unsubscribe();
	});

	const toastOptions = { reversed: true, intro: { y: 64 } };

	const navItems = [
		{ href: '/', label: 'Overview', icon: LayoutDashboard, accent: 'sky' },
		{ href: '/seeds', label: 'Seeds', icon: Sprout, accent: 'mint' },
		{ href: '/clients', label: 'Clients', icon: Building2, accent: 'lavender' },
		{ href: '/tenants', label: 'Tenants', icon: Server, accent: 'peach' },
		{ href: '/fly', label: 'Fly.io', icon: Cloud, accent: 'rose' },
		{ href: '/pipeline', label: 'Pipelines', icon: PlayCircle, accent: 'amber' }
	];

	const accentVar: Record<string, string> = {
		sky: 'var(--color-pastel-sky)',
		mint: 'var(--color-pastel-mint)',
		lavender: 'var(--color-pastel-lavender)',
		peach: 'var(--color-pastel-peach)',
		rose: 'var(--color-pastel-rose)',
		amber: 'var(--color-pastel-amber)'
	};

	let isChromeless = $derived(page.url.pathname === '/login' || page.url.pathname.startsWith('/auth/'));

	async function signOut() {
		await fetch('/api/auth/signout', { method: 'POST' });
		await goto('/login');
	}
</script>

{#if isChromeless}
	{@render children()}
{:else}
	<div class="min-h-screen flex" style="background: var(--color-surface-page);">
		<aside
			class="w-56 shrink-0 flex flex-col"
			style="background: var(--color-surface-nav); border-right: 1px solid var(--color-border-soft);"
		>
			<div class="px-5 py-5" style="border-bottom: 1px solid var(--color-border-soft);">
				<div class="text-sm font-semibold tracking-wide" style="color: var(--color-text-primary);">Factory</div>
				<div class="text-[10px] uppercase tracking-wider mt-0.5" style="color: var(--color-text-muted);">
					Pipeline dashboard
				</div>
			</div>

			<nav class="flex-1 px-2 py-4 space-y-0.5">
				{#each navItems as item (item.href)}
					{@const Icon = item.icon}
					{@const active = item.href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(item.href)}
					{@const color = accentVar[item.accent] ?? 'var(--color-pastel-cyan)'}
					<a
						href={item.href}
						class="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors"
						style={active
							? `background: color-mix(in srgb, ${color} 16%, transparent); color: ${color};`
							: 'color: var(--color-text-secondary);'}
						onmouseenter={(e) => {
							if (!active) {
								(e.currentTarget as HTMLElement).style.background = 'var(--color-surface-hover)';
								(e.currentTarget as HTMLElement).style.color = 'var(--color-text-primary)';
							}
						}}
						onmouseleave={(e) => {
							if (!active) {
								(e.currentTarget as HTMLElement).style.background = '';
								(e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)';
							}
						}}
					>
						<Icon size={16} strokeWidth={1.75} />
						<span>{item.label}</span>
					</a>
				{/each}
			</nav>

			{#if data.user}
				<div class="px-3 py-3" style="border-top: 1px solid var(--color-border-soft);">
					<div class="px-2 py-1.5 text-xs truncate" style="color: var(--color-text-muted);" title={data.user.email ?? ''}>
						{data.user.email}
					</div>
					<button
						type="button"
						onclick={signOut}
						class="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors"
						style="color: var(--color-text-muted);"
						onmouseenter={(e) => {
							(e.currentTarget as HTMLElement).style.background = 'var(--color-surface-hover)';
							(e.currentTarget as HTMLElement).style.color = 'var(--color-text-primary)';
						}}
						onmouseleave={(e) => {
							(e.currentTarget as HTMLElement).style.background = '';
							(e.currentTarget as HTMLElement).style.color = 'var(--color-text-muted)';
						}}
					>
						<LogOut size={14} strokeWidth={1.75} />
						<span>Sign out</span>
					</button>
				</div>
			{/if}
		</aside>

		<main class="flex-1 min-w-0 overflow-auto">
			{@render children()}
		</main>
	</div>
{/if}

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
