<?php

declare(strict_types=1);

namespace LaborDigital\FactoryMultitenantApi\Middleware;

use LaborDigital\FactoryMultitenantApi\Service\AuditLogger;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use TYPO3\CMS\Core\Http\HtmlResponse;
use TYPO3\CMS\Core\Http\JsonResponse;

/**
 * Gates the /api/multitenant/* routes with three checks (in order):
 *
 *   1. Off-by-default: both FACTORY_MULTITENANT_API_ENABLED=true and a
 *      non-empty FACTORY_MULTITENANT_API_TOKEN must be set in the env.
 *      Otherwise return 404 (not 401) — we don't want to advertise the
 *      endpoint's existence to unauthorized scanners.
 *   2. Bearer token comparison via hash_equals().
 *   3. Pass through to the next middleware (ApiRouter).
 *
 * Non-API paths are pass-through. See DL #013.
 */
final class AuthenticationMiddleware implements MiddlewareInterface
{
    private const PATH_PREFIX = '/api/multitenant';

    public function __construct(private readonly AuditLogger $auditLogger) {}

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $path = $request->getUri()->getPath();
        if (!str_starts_with($path, self::PATH_PREFIX)) {
            return $handler->handle($request);
        }

        $enabled = getenv('FACTORY_MULTITENANT_API_ENABLED') === 'true';
        $token = (string)getenv('FACTORY_MULTITENANT_API_TOKEN');

        if (!$enabled || $token === '') {
            return new HtmlResponse('Not found', 404);
        }

        $header = $request->getHeaderLine('Authorization');
        if (!str_starts_with($header, 'Bearer ')) {
            $this->auditLogger->reject($request, 'missing-bearer');
            return new JsonResponse(['error' => 'unauthorized'], 401);
        }

        $presented = substr($header, 7);
        if (!hash_equals($token, $presented)) {
            $this->auditLogger->reject($request, 'bad-token');
            return new JsonResponse(['error' => 'unauthorized'], 401);
        }

        return $handler->handle($request);
    }
}
