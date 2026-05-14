import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SECRET_KEY } from '$env/static/private';

let cached: SupabaseClient | null = null;

/**
 * Service-role client. Bypasses RLS. Use only for trusted server-side work
 * (migrations, audit writes, executor side-effects). Never expose to the browser.
 */
export function supabaseAdmin(): SupabaseClient {
	if (cached) return cached;
	cached = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
		auth: { autoRefreshToken: false, persistSession: false }
	});
	return cached;
}
