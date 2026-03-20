import {readFileSync} from 'node:fs';
import {basename, extname, normalize, resolve} from 'node:path';
import {defineNuxtModule, useLogger} from '@nuxt/kit';

type FactoryConfig = {
	core_version: string
	active_components: string[]
}

type DiscoveredComponent = {
	filePath: string
	pascalName: string
}

const logger = useLogger('factory-components');

function normalizeComponentKey(value: string): string {
	return value
		.trim()
		.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
		.replace(/[\s_]+/g, '-')
		.toLowerCase();
}

function readFactoryConfig(configPath: string): FactoryConfig {
	try {
		const fileContents = readFileSync(configPath, 'utf-8');
		const parsedConfig = JSON.parse(fileContents) as Partial<FactoryConfig>;

		if (typeof parsedConfig.core_version !== 'string') {
			throw new Error('The "core_version" value must be a string.');
		}

		if (!Array.isArray(parsedConfig.active_components) || parsedConfig.active_components.some((entry) => typeof entry !== 'string')) {
			throw new Error('The "active_components" value must be a string array.');
		}

		return {
			core_version: parsedConfig.core_version,
			active_components: parsedConfig.active_components
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		throw new Error(`Unable to read factory configuration from ${configPath}: ${message}`);
	}
}

export default defineNuxtModule({
	meta: {
		name: 'factory-components',
		configKey: 'factoryComponents'
	},
	setup(_options, nuxt) {
		const factoryConfigPath = resolve(nuxt.options.rootDir, '../modules/factory.json');
		const factoryLayerContentPath = normalize(resolve(nuxt.options.rootDir, '../modules/nuxt-layer/components/T3/Content'));
		const factoryConfig = readFactoryConfig(factoryConfigPath);
		const activeComponents = new Set(factoryConfig.active_components.map(normalizeComponentKey));

		nuxt.hook('components:extend', (components: DiscoveredComponent[]) => {
			const availableLayerComponents = new Set<string>();

			const filteredComponents = components.filter((component) => {
				const componentPath = normalize(component.filePath);

				if (!componentPath.startsWith(factoryLayerContentPath)) {
					return true;
				}

				const componentKey = normalizeComponentKey(basename(componentPath, extname(componentPath)));
				availableLayerComponents.add(componentKey);

				return activeComponents.has(componentKey);
			});

			components.splice(0, components.length, ...filteredComponents);

			const unknownConfiguredComponents = Array.from(activeComponents).filter((componentKey) => !availableLayerComponents.has(componentKey));

			if (unknownConfiguredComponents.length > 0) {
				logger.warn(`Configured active components were not found in the shared Nuxt layer: ${unknownConfiguredComponents.join(', ')}`);
			}
		});
	}
});
