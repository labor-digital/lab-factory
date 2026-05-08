<?php

declare(strict_types=1);

namespace LaborDigital\FactoryMultitenantApi\Service;

use Psr\Http\Message\ServerRequestInterface;
use Psr\Log\LoggerAwareInterface;
use Psr\Log\LoggerAwareTrait;

/**
 * Emits one structured log line per multitenant API request. The PSR-3
 * Logger from TYPO3's logging stack lands these in CloudWatch when the
 * runtime is on ECS (per the deploy repo's logger config).
 *
 * Log level is INFO for successful authorized calls and WARNING for
 * rejected/erroring ones — keeps successful provisions visible in the
 * default log filter while letting ops alerts hook on WARNING+.
 */
final class AuditLogger implements LoggerAwareInterface
{
    use LoggerAwareTrait;

    public function ok(ServerRequestInterface $request, int $status, float $durationSeconds): void
    {
        $this->logger?->info('factory_multitenant_api request', $this->context($request, [
            'outcome' => 'ok',
            'status' => $status,
            'duration_ms' => (int)round($durationSeconds * 1000),
        ]));
    }

    public function reject(ServerRequestInterface $request, string $reason): void
    {
        $this->logger?->warning('factory_multitenant_api rejected', $this->context($request, [
            'outcome' => 'rejected',
            'reason' => $reason,
        ]));
    }

    public function error(ServerRequestInterface $request, \Throwable $e): void
    {
        $this->logger?->warning('factory_multitenant_api error', $this->context($request, [
            'outcome' => 'error',
            'exception' => $e::class,
            'message' => $e->getMessage(),
        ]));
    }

    /** @param array<string,mixed> $extra */
    private function context(ServerRequestInterface $request, array $extra): array
    {
        return array_merge([
            'route' => strtoupper($request->getMethod()) . ' ' . $request->getUri()->getPath(),
            'ip' => $this->resolveIp($request),
        ], $extra);
    }

    private function resolveIp(ServerRequestInterface $request): string
    {
        $forwarded = $request->getHeaderLine('X-Forwarded-For');
        if ($forwarded !== '') {
            $first = trim(explode(',', $forwarded)[0]);
            if ($first !== '') {
                return $first;
            }
        }
        $params = $request->getServerParams();
        return (string)($params['REMOTE_ADDR'] ?? 'unknown');
    }
}
