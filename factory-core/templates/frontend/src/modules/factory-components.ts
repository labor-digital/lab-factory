import {existsSync, readFileSync} from 'node:fs';
import {basename, extname, normalize, resolve} from 'node:path';
import {defineNuxtModule, useLogger} from '@nuxt/kit';

type FactoryConfig = {
	core_version: string
	active_components: string[]
	active_record_types: string[]
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

// Map an active_components entry (e.g. "PageContact") to its expected Ce wrapper
// filename (e.g. "FactoryPagecontact.vue"). The wrapper naming convention in
// factory-core/nuxt-layer/components/T3/Ce/ keeps the first character of the
// component name as-is and lowercases the rest, prefixed with "Factory":
// PageContact -> FactoryPagecontact, ButtonGroup -> FactoryButtongroup,
// Accordion -> FactoryAccordion.
function ceWrapperFileName(activeComponentName: string): string {
	const trimmed = activeComponentName.trim();
	if (trimmed.length === 0) {
		return 'Factory';
	}
	return `Factory${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1).toLowerCase()}`;
}

// Same naming convention for T3/Record/* wrappers. Property -> FactoryProperty.
function recordWrapperFileName(activeRecordTypeName: string): string {
	return ceWrapperFileName(activeRecordTypeName);
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

		const activeRecordTypes = parsedConfig.active_record_types ?? [];
		if (!Array.isArray(activeRecordTypes) || activeRecordTypes.some((entry) => typeof entry !== 'string')) {
			throw new Error('The "active_record_types" value must be a string array.');
		}

		return {
			core_version: parsedConfig.core_version,
			active_components: parsedConfig.active_components,
			active_record_types: activeRecordTypes
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
		const factoryConfigPath = resolve(nuxt.options.rootDir, 'factory.json');
		const factoryLayerContentPath = normalize(resolve(nuxt.options.rootDir, '../modules/nuxt-layer/components/T3/Content'));
		const factoryLayerCePath = normalize(resolve(nuxt.options.rootDir, '../modules/nuxt-layer/components/T3/Ce'));
		const factoryLayerRecordPath = normalize(resolve(nuxt.options.rootDir, '../modules/nuxt-layer/components/T3/Record'));
		const factoryConfig = readFactoryConfig(factoryConfigPath);
		const activeComponents = new Set(factoryConfig.active_components.map(normalizeComponentKey));
		const activeRecordTypes = new Set(factoryConfig.active_record_types.map(normalizeComponentKey));

		// Validate that every active component has a Ce wrapper file. Without a
		// wrapper, nuxt-typo3's resolveDynamicComponent() falls back silently and
		// dumps the raw content prop as JSON onto the page — broken output with
		// no error in the console. Catching this at build time prevents the
		// failure mode that hit PageContact in commit a3ed2ab.
		const missingCeWrappers = factoryConfig.active_components.filter((activeName) => {
			const wrapperPath = resolve(factoryLayerCePath, `${ceWrapperFileName(activeName)}.vue`);
			return !existsSync(wrapperPath);
		});

		if (missingCeWrappers.length > 0) {
			logger.warn(
				`Active components are missing Ce wrappers in the shared Nuxt layer ` +
				`(these will render as raw JSON in TYPO3): ${missingCeWrappers.join(', ')}. ` +
				`Expected files at ${factoryLayerCePath}/Factory<Name>.vue`
			);
		}

		// Symmetric check for record-type wrappers. ReferenceList.vue resolves
		// each record via resolveDynamicComponent('T3RecordFactory<Type>'); a
		// missing wrapper would render records as blank cards.
		const missingRecordWrappers = factoryConfig.active_record_types.filter((name) => {
			const wrapperPath = resolve(factoryLayerRecordPath, `${recordWrapperFileName(name)}.vue`);
			return !existsSync(wrapperPath);
		});

		if (missingRecordWrappers.length > 0) {
			logger.warn(
				`Active record types are missing Record wrappers in the shared Nuxt layer ` +
				`(records of these types will render as blank cards): ${missingRecordWrappers.join(', ')}. ` +
				`Expected files at ${factoryLayerRecordPath}/Factory<Name>.vue`
			);
		}

		nuxt.hook('components:extend', (components: DiscoveredComponent[]) => {
			const availableLayerComponents = new Set<string>();

			const filteredComponents = components.filter((component) => {
				const componentPath = normalize(component.filePath);

				if (!componentPath.startsWith(factoryLayerContentPath)) {
					return true;
				}

				const componentKey = normalizeComponentKey(basename(componentPath, extname(componentPath)));
				availableLayerComponents.add(componentKey);

				// Base* components are data-parsing companions of their Content component.
				// Allow them through if the corresponding non-Base component is active.
				const keyToCheck = componentKey.startsWith('base-')
					? componentKey.slice(5)
					: componentKey;

				return activeComponents.has(keyToCheck);
			});

			components.splice(0, components.length, ...filteredComponents);

			const unknownConfiguredComponents = Array.from(activeComponents).filter((componentKey) => !availableLayerComponents.has(componentKey));

			if (unknownConfiguredComponents.length > 0) {
				logger.warn(`Configured active components were not found in the shared Nuxt layer: ${unknownConfiguredComponents.join(', ')}`);
			}
		});
	}
});
