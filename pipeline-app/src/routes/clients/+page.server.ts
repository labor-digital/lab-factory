import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: clients } = await locals.supabase
		.from('clients')
		.select('*')
		.order('display_name', { ascending: true });

	const { data: seedCounts } = await locals.supabase
		.from('seeds')
		.select('client_id')
		.not('client_id', 'is', null);

	const counts = new Map<string, number>();
	for (const row of seedCounts ?? []) {
		if (!row.client_id) continue;
		counts.set(row.client_id, (counts.get(row.client_id) ?? 0) + 1);
	}

	return {
		clients: (clients ?? []).map((c) => ({ ...c, seedCount: counts.get(c.id) ?? 0 }))
	};
};
