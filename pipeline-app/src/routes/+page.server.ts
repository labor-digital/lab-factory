import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const supabase = locals.supabase;

	const [seedsCount, publishedCount, clientsCount, recentSeeds, recentAudits, appliedSeeds] = await Promise.all([
		supabase.from('seeds').select('id', { count: 'exact', head: true }),
		supabase.from('seeds').select('id', { count: 'exact', head: true }).eq('status', 'published'),
		supabase.from('clients').select('id', { count: 'exact', head: true }),
		supabase
			.from('seeds')
			.select('id, slug, name, status, updated_at, origin, immutable')
			.order('updated_at', { ascending: false })
			.limit(5),
		supabase
			.from('seed_audits')
			.select('id, action, at, seed_id, user_id')
			.order('at', { ascending: false })
			.limit(8),
		supabase
			.from('applied_seeds')
			.select('id, environment, tenant_slug, project_name, applied_at, factory_core_version, seed_id')
			.order('applied_at', { ascending: false })
			.limit(10)
	]);

	return {
		stats: {
			seeds: seedsCount.count ?? 0,
			published: publishedCount.count ?? 0,
			clients: clientsCount.count ?? 0
		},
		recentSeeds: recentSeeds.data ?? [],
		recentAudits: recentAudits.data ?? [],
		appliedSeeds: appliedSeeds.data ?? []
	};
};
