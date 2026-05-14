import { createServerClient } from '@supabase/ssr';
import { redirect, type Handle } from '@sveltejs/kit';
import { SUPABASE_URL, SUPABASE_PUBLISH_KEY } from '$env/static/private';

const PUBLIC_ROUTES = new Set(['/login', '/auth/callback']);

function isPublic(path: string): boolean {
	return PUBLIC_ROUTES.has(path) || path.startsWith('/auth/');
}

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISH_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				for (const { name, value, options } of cookiesToSet) {
					event.cookies.set(name, value, { ...options, path: '/' });
				}
			}
		}
	});

	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		if (!session) return { session: null, user: null };

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		if (error) return { session: null, user: null };

		return { session, user };
	};

	// Exchange a Supabase auth code if it's on any URL. Invite / magic-link /
	// recovery emails redirect to <site>/?code=…&type=… by default; without
	// this exchange the auth gate below would 303 to /login and drop the code.
	const code = event.url.searchParams.get('code');
	if (code) {
		const { error } = await event.locals.supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			const type = event.url.searchParams.get('type');
			const cleanUrl = new URL(event.url);
			cleanUrl.searchParams.delete('code');
			cleanUrl.searchParams.delete('type');
			const dest =
				type === 'invite' || type === 'recovery'
					? '/auth/set-password'
					: cleanUrl.pathname + cleanUrl.search;
			throw redirect(303, dest);
		}
	}

	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;

	const path = event.url.pathname;
	if (!user && !isPublic(path)) {
		throw redirect(303, `/login?from=${encodeURIComponent(path)}`);
	}
	if (user && path === '/login') {
		throw redirect(303, '/');
	}

	return resolve(event, {
		filterSerializedResponseHeaders: (name) =>
			name === 'content-range' || name === 'x-supabase-api-version'
	});
};
