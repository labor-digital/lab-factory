import { SUPABASE_URL, SUPABASE_PUBLISH_KEY } from '$env/static/private';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
	return {
		session: locals.session,
		user: locals.user,
		supabaseConfig: { url: SUPABASE_URL, anonKey: SUPABASE_PUBLISH_KEY },
		cookies: cookies.getAll()
	};
};
