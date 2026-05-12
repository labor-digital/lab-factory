<?php

declare(strict_types=1);

use LaborDigital\FactoryMultitenantApi\Middleware\ApiRouter;
use LaborDigital\FactoryMultitenantApi\Middleware\AuthenticationMiddleware;

/**
 * Mounts the Factory Multitenant API at /api/multitenant/* in the TYPO3
 * frontend middleware chain.
 *
 * Order matters: AuthenticationMiddleware must run before ApiRouter so
 * unauthorized callers are rejected before any controller logic. Both
 * middlewares short-circuit when the path doesn't match — non-API
 * traffic is pass-through.
 *
 * Our middlewares run AFTER `normalized-params-attribute` (so the request
 * URI is parsed) but BEFORE `tsfe`, `site`, and `maintenance-mode` —
 * none of which apply to a cross-site management API and any of which
 * would happily 404 a fresh install with no `config/sites/` entries.
 *
 * Note: TYPO3 13's site-matching middleware is registered as
 * `typo3/cms-frontend/site` (NOT `…/site-resolver` — that legacy alias
 * is referenced by core's base-redirect-resolver but isn't a real
 * middleware key, so depending on it is a silent no-op).
 */
return [
    'frontend' => [
        'labor-digital/factory-multitenant-api/authentication' => [
            'target' => AuthenticationMiddleware::class,
            'after' => [
                'typo3/cms-core/normalized-params-attribute',
            ],
            'before' => [
                'typo3/cms-frontend/maintenance-mode',
                'typo3/cms-frontend/tsfe',
                'typo3/cms-frontend/site',
            ],
        ],
        'labor-digital/factory-multitenant-api/router' => [
            'target' => ApiRouter::class,
            'after' => [
                'labor-digital/factory-multitenant-api/authentication',
            ],
            'before' => [
                'typo3/cms-frontend/maintenance-mode',
                'typo3/cms-frontend/tsfe',
                'typo3/cms-frontend/site',
            ],
        ],
    ],
];
