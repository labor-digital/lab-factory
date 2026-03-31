import type { PipelineConfig } from './types.js';

export const DEFAULT_CONFIG: PipelineConfig = {
	labCliBin: 'node /Users/kim/Work/Labor/Lab-Cli/lab-cli/lib/index.js',
	factoryCorePath: './factory-core',
	testProjectName: 'test-client-auto',
	componentsToTest: ['PageHero', 'Text'],
	typo3AdminUser: 'labor',
	typo3AdminPassword: 'Password1!',
	appEncryptionKey: 'test-encryption-key-0123456789abcdef0123456789abcdef',
	appInstallToolPassword: 'Password1!',
	typo3ApiBaseUrl: 'https://tes-cli-aut-bac.labor.systems',
	includePhase3: false,
	sudoPassword: ''
};
