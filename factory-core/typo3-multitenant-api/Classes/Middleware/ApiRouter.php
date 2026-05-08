<?php

declare(strict_types=1);

namespace LaborDigital\FactoryMultitenantApi\Middleware;

use LaborDigital\FactoryMultitenantApi\Controller\TenantController;
use LaborDigital\FactoryMultitenantApi\Controller\VersionController;
use LaborDigital\FactoryMultitenantApi\Service\AuditLogger;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use TYPO3\CMS\Core\Http\JsonResponse;

/**
 * Dispatches /api/multitenant/* requests to the appropriate controller
 * action. Non-matching paths fall through to the next middleware so
 * the regular TYPO3 frontend chain still works.
 *
 * The auth gate has already run (see AuthenticationMiddleware) by the
 * time this middleware sees a request — every dispatch here is an
 * authorized caller.
 */
final class ApiRouter implements MiddlewareInterface
{
    private const PATH_PREFIX = '/api/multitenant';

    public function __construct(
        private readonly VersionController $version,
        private readonly TenantController $tenant,
        private readonly AuditLogger $auditLogger,
    ) {}

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $path = $request->getUri()->getPath();
        if (!str_starts_with($path, self::PATH_PREFIX)) {
            return $handler->handle($request);
        }

        $remainder = rtrim(substr($path, strlen(self::PATH_PREFIX)), '/');
        $method = strtoupper($request->getMethod());
        $start = microtime(true);

        try {
            $response = $this->dispatch($method, $remainder, $request);
        } catch (\Throwable $e) {
            $this->auditLogger->error($request, $e);
            return new JsonResponse(['error' => 'internal_error', 'message' => $e->getMessage()], 500);
        }

        $this->auditLogger->ok($request, $response->getStatusCode(), microtime(true) - $start);
        return $response;
    }

    private function dispatch(string $method, string $remainder, ServerRequestInterface $request): ResponseInterface
    {
        if ($remainder === '/version' && $method === 'GET') {
            return $this->version->version();
        }

        if ($remainder === '/tenants') {
            if ($method === 'GET') {
                return $this->tenant->list();
            }
            if ($method === 'POST') {
                return $this->tenant->create($request);
            }
            return new JsonResponse(['error' => 'method_not_allowed'], 405);
        }

        if (preg_match('#^/tenants/([a-z0-9][a-z0-9_-]*)$#', $remainder, $matches) === 1) {
            $slug = $matches[1];
            if ($method === 'GET') {
                return $this->tenant->get($slug);
            }
            if ($method === 'PATCH') {
                return $this->tenant->patch($slug, $request);
            }
            return new JsonResponse(['error' => 'method_not_allowed'], 405);
        }

        return new JsonResponse(['error' => 'not_found'], 404);
    }
}
