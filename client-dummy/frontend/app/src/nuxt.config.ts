export default defineNuxtConfig({
	extends: ['../modules/nuxt-layer'],
	modules: ['./modules/factory-components'],
	devServer: {
		port: 443,
		host: '0.0.0.0',
		https: {
			key: 'node_modules/@labor-digital/ssl-certs/labor.systems/labor.systems.key',
			cert: 'node_modules/@labor-digital/ssl-certs/labor.systems/labor.systems.crt',
		},
	}
});
