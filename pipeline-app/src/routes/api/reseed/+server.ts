import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ReseedRequest, StepEvent } from '$lib/pipeline/types.js';
import { runReseed } from '$lib/pipeline/reseed.js';

let currentRun: AbortController | null = null;

export const POST: RequestHandler = async ({ request, url }) => {
	if (currentRun) {
		return json({ error: 'A reseed is already running' }, { status: 409 });
	}

	let body: ReseedRequest;
	try {
		body = (await request.json()) as ReseedRequest;
	} catch {
		return json({ error: 'invalid_json' }, { status: 400 });
	}
	if (!body.seedSlug || !body.source) {
		return json({ error: 'missing_seed_or_source' }, { status: 400 });
	}

	const overrides = {
		seedsRepoPath: url.searchParams.get('seedsRepoPath') ?? undefined,
		factoryCorePath: url.searchParams.get('factoryCorePath') ?? undefined
	};

	const controller = new AbortController();
	currentRun = controller;

	const stream = new ReadableStream({
		start(streamController) {
			const encoder = new TextEncoder();
			const emit = (event: StepEvent) => {
				try {
					streamController.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
				} catch {
					// stream closed
				}
			};

			runReseed(body, emit, controller.signal, overrides)
				.catch((err: unknown) => {
					emit({
						type: 'pipeline:error',
						data: err instanceof Error ? err.message : String(err),
						timestamp: Date.now()
					});
				})
				.finally(() => {
					currentRun = null;
					try {
						streamController.close();
					} catch {
						// already closed
					}
				});
		},
		cancel() {
			controller.abort();
			currentRun = null;
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Transfer-Encoding': 'chunked',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};

export const DELETE: RequestHandler = async () => {
	if (currentRun) {
		currentRun.abort();
		currentRun = null;
		return json({ status: 'cancelled' });
	}
	return json({ status: 'no reseed running' }, { status: 404 });
};
