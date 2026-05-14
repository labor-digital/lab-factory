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
	settings: DEFAULT_SETTINGS,
	includePhase4: false,
	bitbucketWorkspace: '',
	bitbucketProjectKey: '',
	bitbucketRepoSlug: '',
	publishBackend: true,
	factoryCoreSource: 'local',
	factoryCoreComposerConstraint: '^0.2',
	factoryCoreNpmConstraint: '^0.1.0',
	deploymentMode: 'standalone',
	sharedInstanceRepoPath: '../labor-factory-multitenant',
	tenants: [
		{
			slug: 'heckelsmueller-test-1',
			domain: 'heckelsmueller-test-1-frontend.fly.dev',
			displayName: 'Heckelsmüller Staging',
			activeComponents: ['PageHero', 'PageSection', 'TextSlider', 'ReferenceList'],
			activeRecordTypes: ['Property'],
			adminEmail: 'k.martini@labor.digital'
		}
	],
	autoStartStack: true,
	stackServiceName: 'app',
	frontendHostingTarget: 'fly-io',
	flyIoOrgSlug: 'personal',
	flyIoRegion: 'fra',
	flyIoMachineSize: 'shared-cpu-1x-512',
	seedsRepoPath: '../labor-factory-seeds',
	targetEnvironment: 'local',
	stagingApiBaseUrl: 'https://lab-fac-mul.labor.show',
	stagingApiTokenConfigured: false,
	forceVersionMismatch: false,
	operatingMode: 'create',
	existingTenantSlug: '',
	updateOps: {
		settings: false,
		content: true,
		redeploy: true
	},
	retireFirst: false
};
