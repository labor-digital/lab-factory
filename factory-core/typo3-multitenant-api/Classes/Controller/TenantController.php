<?php

declare(strict_types=1);

namespace LaborDigital\FactoryMultitenantApi\Controller;

use LaborDigital\FactoryCore\Command\TenantProvisionCommand;
use LaborDigital\FactoryCore\Service\TenantContentSeeder;
use LaborDigital\FactoryCore\Service\TenantRetirementService;
use LaborDigital\FactoryMultitenantApi\Service\FactoryJsonWriter;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\BufferedOutput;
use Symfony\Component\Yaml\Yaml;
use TYPO3\CMS\Core\Http\JsonResponse;

/**
 * Tenant CRUD over HTTP. Wraps factory-core's TenantProvisionCommand (for POST)
 * and FactoryJsonWriter (for PATCH). All four routes are reachable only after
 * AuthenticationMiddleware has accepted the bearer.
 */
final class TenantController
{
    private const SLUG_PATTERN = '/^[a-z0-9][a-z0-9_-]*$/';

    public function __construct(
        private readonly TenantProvisionCommand $provisionCommand,
        private readonly FactoryJsonWriter $writer,
        private readonly TenantContentSeeder $contentSeeder,
        private readonly TenantRetirementService $retirement,
    ) {}

    public function list(): ResponseInterface
    {
        $tenants = [];
        foreach ($this->writer->listSiteSlugs() as $slug) {
            $tenants[] = $this->describe($slug);
        }
        return new JsonResponse(['tenants' => $tenants]);
    }

    public function get(string $slug): ResponseInterface
    {
        $tenant = $this->describe($slug);
        if ($tenant === null) {
            return new JsonResponse(['error' => 'tenant_not_found', 'slug' => $slug], 404);
        }
        return new JsonResponse($tenant);
    }

    public function create(ServerRequestInterface $request): ResponseInterface
    {
        $body = $this->decodeJsonBody($request);
        if ($body === null) {
            return new JsonResponse(['error' => 'invalid_json'], 400);
        }

        $required = ['slug', 'domain', 'displayName', 'adminEmail'];
        foreach ($required as $key) {
            if (!isset($body[$key]) || !is_string($body[$key]) || $body[$key] === '') {
                return new JsonResponse(['error' => 'missing_field', 'field' => $key], 400);
            }
        }
        if (preg_match(self::SLUG_PATTERN, $body['slug']) !== 1) {
            return new JsonResponse(['error' => 'invalid_slug'], 400);
        }

        $components = $this->normalizeList($body['components'] ?? []);
        $recordTypes = $this->normalizeList($body['recordTypes'] ?? []);

        $input = new ArrayInput([
            '--slug' => $body['slug'],
            '--domain' => $body['domain'],
            '--display-name' => $body['displayName'],
            '--components' => implode(',', $components),
            '--record-types' => implode(',', $recordTypes),
            '--admin-email' => $body['adminEmail'],
        ]);
        $output = new BufferedOutput();

        try {
            $exit = $this->provisionCommand->run($input, $output);
        } catch (\Throwable $e) {
            return new JsonResponse([
                'error' => 'provision_failed',
                'message' => $e->getMessage(),
                'log' => $output->fetch(),
            ], 500);
        }

        if ($exit !== 0) {
            return new JsonResponse([
                'error' => 'provision_failed',
                'exit_code' => $exit,
                'log' => $output->fetch(),
            ], 500);
        }

        return new JsonResponse([
            'slug' => $body['slug'],
            'status' => 'ready',
            'tenant' => $this->describe($body['slug']),
            'log' => $output->fetch(),
            'warning' => 'capability changes propagate to all instances within ~60s',
        ], 201);
    }

    public function patch(string $slug, ServerRequestInterface $request): ResponseInterface
    {
        if (preg_match(self::SLUG_PATTERN, $slug) !== 1) {
            return new JsonResponse(['error' => 'invalid_slug'], 400);
        }

        $body = $this->decodeJsonBody($request);
        if ($body === null) {
            return new JsonResponse(['error' => 'invalid_json'], 400);
        }

        $patch = [];
        if (isset($body['active_components'])) {
            $patch['active_components'] = $this->normalizeList($body['active_components']);
        }
        if (isset($body['active_record_types'])) {
            $patch['active_record_types'] = $this->normalizeList($body['active_record_types']);
        }
        if (isset($body['settings']) && is_array($body['settings'])) {
            $patch['settings'] = $body['settings'];
        }
        if (isset($body['core_version']) && is_string($body['core_version'])) {
            $patch['core_version'] = $body['core_version'];
        }

        if ($patch === []) {
            return new JsonResponse(['error' => 'empty_patch'], 400);
        }

        try {
            $newState = $this->writer->patchSite($slug, $patch);
        } catch (\Throwable $e) {
            return new JsonResponse(['error' => 'patch_failed', 'message' => $e->getMessage()], 500);
        }

        return new JsonResponse([
            'slug' => $slug,
            'core_version' => $newState['core_version'] ?? '',
            'active_components' => $newState['active_components'] ?? [],
            'active_record_types' => $newState['active_record_types'] ?? [],
            'settings' => $newState['settings'] ?? new \stdClass(),
            'applied_at' => gmdate('c'),
            'warning' => 'capability changes propagate to all instances within ~60s',
        ]);
    }

    public function seedContent(string $slug, ServerRequestInterface $request): ResponseInterface
    {
        if (preg_match(self::SLUG_PATTERN, $slug) !== 1) {
            return new JsonResponse(['error' => 'invalid_slug'], 400);
        }
        if ($this->writer->readSite($slug) === null) {
            return new JsonResponse(['error' => 'tenant_not_found', 'slug' => $slug], 404);
        }

        $body = $this->decodeJsonBody($request);
        if ($body === null) {
            return new JsonResponse(['error' => 'invalid_json'], 400);
        }
        $elements = is_array($body['elements'] ?? null) ? $body['elements'] : [];
        $wipe = !array_key_exists('wipe', $body) || (bool)$body['wipe'];

        try {
            $result = $this->contentSeeder->seed($slug, $elements, $wipe);
        } catch (\Throwable $e) {
            return new JsonResponse(['error' => 'seed_failed', 'message' => $e->getMessage()], 500);
        }

        return new JsonResponse([
            'slug' => $slug,
            'status' => 'seeded',
            'root_page_id' => $result['root_page_id'],
            'seeded' => $result['seeded'],
            'wiped' => $result['wiped'],
        ]);
    }

    public function delete(string $slug): ResponseInterface
    {
        if (preg_match(self::SLUG_PATTERN, $slug) !== 1) {
            return new JsonResponse(['error' => 'invalid_slug'], 400);
        }

        try {
            $deleted = $this->retirement->retire($slug);
        } catch (\Throwable $e) {
            return new JsonResponse(['error' => 'retire_failed', 'message' => $e->getMessage()], 500);
        }

        return new JsonResponse([
            'slug' => $slug,
            'status' => 'retired',
            'deleted' => $deleted,
        ]);
    }

    /**
     * @return array<string,mixed>|null
     */
    private function describe(string $slug): ?array
    {
        $factory = $this->writer->readSite($slug);
        if ($factory === null) {
            return null;
        }
        $domain = $this->readDomain($slug);

        return [
            'slug' => $slug,
            // Status is synthetic for v1: if the site config exists on disk,
            // TenantProvisionCommand finished synchronously and the tenant is
            // ready. The field exists so consumers (pipeline-app, future async
            // pollers) can converge on a single response shape with POST.
            'status' => 'ready',
            'domain' => $domain,
            'core_version' => $factory['core_version'] ?? '',
            'active_components' => $factory['active_components'] ?? [],
            'active_record_types' => $factory['active_record_types'] ?? [],
            'settings' => $factory['settings'] ?? new \stdClass(),
        ];
    }

    private function readDomain(string $slug): ?string
    {
        $path = $this->writer->siteConfigYamlPath($slug);
        if (!is_file($path)) {
            return null;
        }
        try {
            $config = Yaml::parseFile($path);
        } catch (\Throwable) {
            return null;
        }
        if (!is_array($config)) {
            return null;
        }
        return is_string($config['base'] ?? null) ? $config['base'] : null;
    }

    /**
     * @return array<string,mixed>|null
     */
    private function decodeJsonBody(ServerRequestInterface $request): ?array
    {
        $raw = (string)$request->getBody();
        if ($raw === '') {
            return [];
        }
        try {
            $decoded = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return null;
        }
        return is_array($decoded) ? $decoded : null;
    }

    /**
     * @param mixed $value
     * @return list<string>
     */
    private function normalizeList(mixed $value): array
    {
        if (is_string($value)) {
            $value = array_map('trim', explode(',', $value));
        }
        if (!is_array($value)) {
            return [];
        }
        $out = [];
        foreach ($value as $item) {
            if (is_string($item) && $item !== '') {
                $out[] = $item;
            }
        }
        return array_values(array_unique($out));
    }
}
