import { createBrowserClient, isBrowser, parseCookieHeader } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

function serializeCookie(name: string, value: string, options: CookieOptions = {}): string {
	const parts = [`${name}=${encodeURIComponent(value)}`];
	if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(options.maxAge)}`);
	if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
	parts.push(`Path=${options.path ?? '/'}`);
	if (options.domain) parts.push(`Domain=${options.domain}`);
	if (options.sameSite) parts.push(`SameSite=${typeof options.sameSite === 'string' ? options.sameSite : options.sameSite ? 'Strict' : 'Lax'}`);
	if (options.secure) parts.push('Secure');
	if (options.httpOnly) parts.push('HttpOnly');
	return parts.join('; ');
}

export function getBrowserSupabase(url: string, anonKey: string, cookieHeader = ''): SupabaseClient {
	if (cached) return cached;
	cached = createBrowserClient(url, anonKey, {
		cookies: {
			getAll: () => {
				const source = isBrowser() ? document.cookie : cookieHeader;
				return parseCookieHeader(source).map(({ name, value }) => ({
					name,
					value: value ?? ''
				}));
			},
			setAll: (cookiesToSet) => {
				if (!isBrowser()) return;
				for (const { name, value, options } of cookiesToSet) {
					document.cookie = serializeCookie(name, value, options);
				}
			}
		}
	});
	return cached;
}
