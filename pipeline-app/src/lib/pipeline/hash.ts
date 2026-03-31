/**
 * Hash a password to Argon2id by spawning a PHP process.
 * PHP is already available in this project (TYPO3 backend).
 */
export async function hashArgon2id(password: string): Promise<string> {
	// Node 20+ doesn't have native argon2. Use a PHP one-liner since
	// the project already has PHP available (TYPO3 backend).
	const { spawn } = await import('node:child_process');

	return new Promise((resolve, reject) => {
		const child = spawn('php', ['-r', `echo password_hash($argv[1], PASSWORD_ARGON2ID);`, password]);
		let stdout = '';
		let stderr = '';

		child.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
		child.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });

		child.on('close', (code: number | null) => {
			if (code === 0 && stdout.startsWith('$argon2id$')) {
				resolve(stdout.trim());
			} else {
				reject(new Error(`Argon2id hashing failed: ${stderr || 'unknown error'}`));
			}
		});

		child.on('error', (err) => {
			reject(new Error(`Failed to spawn PHP for hashing: ${err.message}`));
		});
	});
}
