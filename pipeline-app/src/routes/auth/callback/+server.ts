import { redirect, type RequestHandler } from '@sveltejs/kit';
import type { EmailOtpType } from '@supabase/supabase-js';

/**
 * Auth callback for email invite / password reset / magic-link flows.
 *
 * Supports both Supabase email-link styles:
 *   PKCE:  /auth/callback?code=<code>&type=<type>
 *   OTP:   /auth/callback?token_hash=<hash>&type=<type>&next=<path>
 *
 * For invite + recovery types we route the user to /auth/set-password
 * so they can set a password before reaching the app. For everything
 * else we honor `next` (defaulting to `/`).
 *
 * Configure your Supabase project's email templates to point here, e.g.:
 *   {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=invite&next=/auth/set-password
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	const tokenHash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type') as EmailOtpType | null;
	const next = url.searchParams.get('next') ?? '/';

	const requiresPassword = type === 'invite' || type === 'recovery';
	const destination = requiresPassword ? '/auth/set-password' : next;

	if (code) {
		const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
		if (error) throw redirect(303, `/login?error=${encodeURIComponent(error.message)}`);
		throw redirect(303, destination);
	}

	if (tokenHash && type) {
		const { error } = await locals.supabase.auth.verifyOtp({ type, token_hash: tokenHash });
		if (error) throw redirect(303, `/login?error=${encodeURIComponent(error.message)}`);
		throw redirect(303, destination);
	}

	throw redirect(303, '/login?error=invalid_callback');
};
