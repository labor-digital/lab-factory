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
 * Both middlewares are registered before site-resolver because the API
 * operates across sites; resolving a site context for the request would
 * fight the per-tenant logic in the controllers.
 */
return [
    'frontend' => [
        'labor-digital/factory-multitenant-api/authentication' => [
            'target' => AuthenticationMiddleware::class,
            'before' => [
                'typo3/cms-frontend/site-resolver',
            ],
        ],
        'labor-digital/factory-multitenant-api/router' => [
            'target' => ApiRouter::class,
            'after' => [
                'labor-digital/factory-multitenant-api/authentication',
            ],
            'before' => [
                'typo3/cms-frontend/site-resolver',
            ],
        ],
    ],
];
