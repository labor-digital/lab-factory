import type { PipelineConfig, FactorySettings } from './types.js';

export const DEFAULT_SETTINGS: FactorySettings = {
	colors: {
		primary: 'blue',
		secondary: 'slate',
		success: 'green',
		info: 'blue',
		warning: 'yellow',
		error: 'red',
		neutral: 'slate'
	},
	radius: '0.25rem',
	fonts: {
		sans: 'Inter',
		mono: 'JetBrains Mono'
	},
	breakpoints: {
		sm: '640px',
		md: '768px',
		lg: '1024px',
		xl: '1280px',
		'2xl': '1536px'
	},
	colorMode: 'system',
	placeholderImageBaseUrl: 'https://picsum.photos'
};

export const DEFAULT_CONFIG: PipelineConfig = {
	labCliBin: 'node /Users/kim/Work/Labor/Lab-Cli/lab-cli/lib/index.js',
	factoryCorePath: './factory-core',
	testProjectName: 'test-client-auto',
	componentsToTest: ['PageHero', 'Text'],
	activeRecordTypes: [],
	homeElements: ['PageHero', 'Header', 'Text'],
	seedTemplate: '',
	typo3AdminUser: 'labor',
	typo3AdminPassword: 'Password1!',
	appEncryptionKey: 'test-encryption-key-0123456789abcdef0123456789abcdef',
	appInstallToolPassword: 'Password1!',
	typo3ApiBaseUrl: 'https://tes-cli-aut-bac.labor.systems',
	languages: ['de', 'en'],
	includePhase3: false,
	sudoPassword: '',
	settings: DEFAULT_SETTINGS
};
