<?php

declare(strict_types=1);

namespace LaborDigital\FactoryMultitenantApi\Service;

use LaborDigital\FactoryCore\Configuration\FactoryComponentRegistry;
use TYPO3\CMS\Core\Cache\CacheManager;
use TYPO3\CMS\Core\Core\Environment;
use TYPO3\CMS\Core\Utility\GeneralUtility;

/**
 * Atomic merge + rewrite of `config/sites/{slug}/factory.json`.
 *
 * Atomicity matters: a partial JSON file would brick the tenant for any
 * worker that reloads its registry between the truncate and the new
 * content landing. We write to a tempfile in the same directory and
 * rename() — POSIX rename is atomic on the same filesystem (EFS in prod).
 *
 * After the rename, the in-process FactoryComponentRegistry static cache
 * is dropped for this tenant so the worker that handled the PATCH sees
 * the new state on its next request. Other workers catch up on their
 * own recycle cadence (DL #013, "Multi-instance caveat").
 */
final class FactoryJsonWriter
{
    public function readSite(string $slug): ?array
    {
        $path = $this->siteFactoryJsonPath($slug);
        if (!is_file($path)) {
            return null;
        }
        try {
            $decoded = json_decode((string)file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return null;
        }
        return is_array($decoded) ? $decoded : null;
    }

    /**
     * Merge `$patch` into the existing factory.json for `$slug`. Top-level
     * keys are replaced wholesale (active_components, active_record_types,
     * settings) — nested keys inside `settings` are also wholesale by
     * design: we want a PATCH that explicitly clears a setting to actually
     * clear it, not silently merge.
     *
     * @param array<string,mixed> $patch
     * @return array<string,mixed> the new on-disk state
     */
    public function patchSite(string $slug, array $patch): array
    {
        $path = $this->siteFactoryJsonPath($slug);
        if (!is_file($path)) {
            throw new \RuntimeException(sprintf('Tenant "%s" has no factory.json on disk.', $slug));
        }

        $current = $this->readSite($slug) ?? [];
        foreach ($patch as $key => $value) {
            $current[$key] = $value;
        }

        $this->writeAtomic($path, $current);
        $this->bustCaches($slug);

        return $current;
    }

    /**
     * @param array<string,mixed> $contents
     */
    private function writeAtomic(string $path, array $contents): void
    {
        $directory = dirname($path);
        if (!is_dir($directory)) {
            throw new \RuntimeException(sprintf('Site config directory "%s" missing.', $directory));
        }

        $tmp = tempnam($directory, '.factory-json-');
        if ($tmp === false) {
            throw new \RuntimeException('Could not create tempfile next to factory.json.');
        }

        $payload = json_encode($contents, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        if (file_put_contents($tmp, $payload . "\n") === false) {
            @unlink($tmp);
            throw new \RuntimeException('Could not write tempfile for factory.json.');
        }

        @chmod($tmp, 0644);
        if (!@rename($tmp, $path)) {
            @unlink($tmp);
            throw new \RuntimeException(sprintf('Atomic rename to "%s" failed.', $path));
        }
    }

    private function bustCaches(string $slug): void
    {
        FactoryComponentRegistry::invalidate($slug);

        $cacheManager = GeneralUtility::makeInstance(CacheManager::class);
        foreach (['pages', 'runtime'] as $cacheId) {
            try {
                $cacheManager->getCache($cacheId)->flush();
            } catch (\Throwable) {
                // Cache backend may not be registered in some test environments — non-fatal.
            }
        }
    }

    public function siteFactoryJsonPath(string $slug): string
    {
        return Environment::getProjectPath() . '/config/sites/' . $slug . '/factory.json';
    }

    public function siteConfigYamlPath(string $slug): string
    {
        return Environment::getProjectPath() . '/config/sites/' . $slug . '/config.yaml';
    }

    /**
     * @return list<string> site identifiers that have a factory.json on disk
     */
    public function listSiteSlugs(): array
    {
        $base = Environment::getProjectPath() . '/config/sites';
        if (!is_dir($base)) {
            return [];
        }
        $slugs = [];
        foreach (new \DirectoryIterator($base) as $info) {
            if ($info->isDot() || !$info->isDir()) {
                continue;
            }
            if (is_file($info->getPathname() . '/factory.json')) {
                $slugs[] = $info->getFilename();
            }
        }
        sort($slugs);
        return $slugs;
    }
}
