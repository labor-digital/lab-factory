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
        $token = trim((string)getenv('FACTORY_MULTITENANT_API_TOKEN'));

        if (!$enabled || $token === '') {
            return new HtmlResponse('Not found', 404);
        }

        $header = $this->readAuthorizationHeader($request);
        if (!str_starts_with($header, 'Bearer ')) {
            $this->auditLogger->reject($request, 'missing-bearer');
            return new JsonResponse(['error' => 'unauthorized'], 401);
        }

        $presented = trim(substr($header, 7));
        if (!hash_equals($token, $presented)) {
            $this->auditLogger->reject($request, 'bad-token');
            return new JsonResponse(['error' => 'unauthorized'], 401);
        }

        return $handler->handle($request);
    }

    /**
     * Read the Authorization header from whichever source the runtime
     * actually populated. PSR-7's `getHeaderLine('Authorization')` reads
     * `$_SERVER['HTTP_AUTHORIZATION']`, which Apache strips by default
     * unless an explicit `RewriteRule [E=HTTP_AUTHORIZATION:%1]` (or
     * `SetEnvIf`) forwards it. When that forward exists, the value lands
     * in `REDIRECT_HTTP_AUTHORIZATION` instead. As a last resort we fall
     * back to `apache_request_headers()`, which surfaces the raw header
     * directly when mod_php is active.
     *
     * Returning the FIRST non-empty source is intentional — multiple
     * sources rarely agree, but a non-empty value from any of them means
     * the caller did send a header; the bearer check then decides
     * whether to accept it.
     */
    private function readAuthorizationHeader(ServerRequestInterface $request): string
    {
        $header = $request->getHeaderLine('Authorization');
        if ($header !== '') {
            return $header;
        }

        $server = $request->getServerParams();
        $redirected = (string)($server['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
        if ($redirected !== '') {
            return $redirected;
        }

        if (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            if (is_array($headers)) {
                foreach ($headers as $name => $value) {
                    if (is_string($name) && strcasecmp($name, 'Authorization') === 0) {
                        return (string)$value;
                    }
                }
            }
        }

        return '';
    }
}
