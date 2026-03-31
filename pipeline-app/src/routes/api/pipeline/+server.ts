import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { PipelineConfig, StepEvent } from '$lib/pipeline/types.js';
import { runPipeline } from '$lib/pipeline/executor.js';
import { hashArgon2id } from '$lib/pipeline/hash.js';

let currentRun: AbortController | null = null;

export const POST: RequestHandler = async ({ request }) => {
	if (currentRun) {
		return json({ error: 'A pipeline is already running' }, { status: 409 });
	}

	const config: PipelineConfig = await request.json();

	// Hash the plaintext install tool password to Argon2id before passing to executor
	try {
		config.appInstallToolPassword = await hashArgon2id(config.appInstallToolPassword);
	} catch (err) {
		return json(
			{ error: `Failed to hash install tool password: ${err instanceof Error ? err.message : err}` },
			{ status: 500 }
		);
	}

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

			runPipeline(config, emit, controller.signal).finally(() => {
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
	return json({ status: 'no pipeline running' }, { status: 404 });
};
