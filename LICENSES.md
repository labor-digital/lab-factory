# Licenses in this repository

This repository is published under multiple licenses depending on the
subdirectory. Consult each `LICENSE` file before reusing any code.

## Default — Source Available (All Rights Reserved)

Unless overridden by a subdirectory `LICENSE` file, all files in this
repository are licensed under the terms of the root [`LICENSE`](./LICENSE)
(LABOR.digital Factory Source Available License).

Short version: you may read and audit the code. Using, redistributing, or
modifying it in any production or commercial context requires a separate
written agreement with LABOR.digital.

## GPL-2.0-or-later subdirectories

The following subdirectories are licensed under the **GNU General Public
License, version 2 or (at your option) any later version**, because they
contain code that is loaded into the TYPO3 runtime, which is itself
GPL-2.0-or-later:

| Subdirectory | License file |
| --- | --- |
| `factory-core/typo3-extension/` | [`factory-core/typo3-extension/LICENSE`](./factory-core/typo3-extension/LICENSE) |
| `factory-core/templates/backend/` | [`factory-core/templates/backend/LICENSE`](./factory-core/templates/backend/LICENSE) |

These subdirectories each declare `"license": "GPL-2.0-or-later"` in their
`composer.json`.

## MIT-licensed subdirectories

The following subdirectory is licensed under the **MIT License** so it can
be published to npm (`@labor-digital/factory-nuxt-layer`) and consumed by
client projects without the source-available restriction:

| Subdirectory | License file |
| --- | --- |
| `factory-core/nuxt-layer/` | [`factory-core/nuxt-layer/LICENSE`](./factory-core/nuxt-layer/LICENSE) |

This subdirectory declares `"license": "MIT"` in its `package.json`. It
runs only in the Nuxt/Vite frontend runtime and never imports TYPO3 PHP
classes in-process, so it carries no GPL obligation.

### Why only these two

Only code that is loaded into the same process as GPL TYPO3 (i.e. PHP that
`use`s TYPO3 classes or is installed as a TYPO3 extension) inherits the
GPL obligation. The rest of the repository — the SvelteKit pipeline app,
the Nuxt layer, the frontend templates, the manifest, and all tooling —
runs in separate processes and communicates with TYPO3 only via HTTP/JSON.
Under the accepted GPL interpretation, that is an aggregation, not a
derivative work, so the copyleft does not extend to it.

If you ever add PHP code that imports TYPO3 classes in-process, that file
must also be licensed GPL-2.0-or-later.

## Third-party dependencies

Third-party packages pulled in via Composer (`vendor/`) and npm
(`node_modules/`) retain their upstream licenses. They are not
redistributed as part of this repository; they are installed at build or
runtime by the relevant package manager.

## Trademarks

This file does not grant any trademark rights. See the "Trademarks"
section in [`README.md`](./README.md) for the trademark notice.

## Requesting a commercial license

To request a commercial license for the Source Available portions of this
repository, contact LABOR.digital (see the root `LICENSE` for the current
contact details).
