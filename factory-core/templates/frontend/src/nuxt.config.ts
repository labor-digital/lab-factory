export default defineNuxtConfig({
	extends: ['../modules/nuxt-layer'],
	modules: ['@nuxt/ui', './modules/factory-components', './modules/factory-settings'],
	css: ['~/assets/css/main.css'],
	typo3: {
		api: {
			baseUrl: process.env.TYPO3_API_BASE_URL || '',
		},
	},
	devServer: {
		port: 443,
		host: '0.0.0.0',
		https: {
			key: 'node_modules/@labor-digital/ssl-certs/labor.systems/labor.systems.key',
			cert: 'node_modules/@labor-digital/ssl-certs/labor.systems/labor.systems.crt',
		},
	}
});
