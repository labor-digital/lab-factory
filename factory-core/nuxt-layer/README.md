# @labor-digital/factory-nuxt-layer

Shared Nuxt layer for the [LABOR.digital Factory](https://github.com/labor-digital/factory) headless CMS boilerplate.

Provides Content Block–driven Vue components that consume a TYPO3 headless backend via [`@t3headless/nuxt-typo3`](https://www.npmjs.com/package/@t3headless/nuxt-typo3).

## Install

```bash
npm install @labor-digital/factory-nuxt-layer
```

Peer dependency (optional):

```bash
npm install @nuxt/ui
```

## Extend

In your Nuxt app's `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  extends: ['@labor-digital/factory-nuxt-layer'],
  runtimeConfig: {
    public: {
      typo3: {
        apiBaseUrl: process.env.NUXT_PUBLIC_TYPO3_API_BASE_URL
      }
    }
  }
});
```

Active components are controlled by a `factory.json` at your project root (or per-site, in shared-tenant setups). See the Factory monorepo design logs for details.

## License

MIT — see [LICENSE](./LICENSE).
