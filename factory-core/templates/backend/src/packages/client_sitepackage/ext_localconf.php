<?php

declare(strict_types=1);

use TYPO3\CMS\Core\Core\Environment;
use TYPO3\CMS\Core\Utility\ExtensionManagementUtility;

defined('TYPO3') or die();

(static function (): void {
    $normalizeComponentKey = static function (string $value): string {
        $value = trim($value);
        // Decompose PascalCase/camelCase boundaries: PageHero → Page-Hero
        $value = (string)preg_replace('/([a-z0-9])([A-Z])/', '$1-$2', $value);
        $value = strtolower($value);
        $value = (string)preg_replace('/[^a-z0-9]+/', '-', $value);

        return trim($value, '-');
    };

    $readFactoryConfig = static function (string $configPath) use ($normalizeComponentKey): array {
        if (!is_file($configPath)) {
            throw new \RuntimeException(sprintf('Factory configuration file was not found at "%s".', $configPath));
        }

        try {
            $config = json_decode((string)file_get_contents($configPath), true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException $exception) {
            throw new \RuntimeException(sprintf('Unable to decode factory configuration at "%s": %s', $configPath, $exception->getMessage()), 0, $exception);
        }

        if (!is_array($config) || !isset($config['active_components']) || !is_array($config['active_components'])) {
            throw new \RuntimeException(sprintf('Factory configuration at "%s" must contain an "active_components" string array.', $configPath));
        }

        return [
            'core_version' => isset($config['core_version']) && is_string($config['core_version']) ? $config['core_version'] : '',
            'active_components' => array_values(array_filter(array_map(
                static fn (mixed $value): string => is_string($value) ? $normalizeComponentKey($value) : '',
                $config['active_components']
            ))),
        ];
    };

    $readQualifiedName = static function (string $editorInterfacePath): ?string {
        if (!is_file($editorInterfacePath)) {
            return null;
        }

        $editorInterface = (string)file_get_contents($editorInterfacePath);

        if (preg_match("/^name:\\s*['\"]?([^'\"\\n]+)['\"]?/m", $editorInterface, $matches) !== 1) {
            return null;
        }

        return trim($matches[1]);
    };

    $discoverFactoryContentBlocks = static function (string $contentBlocksPath) use ($normalizeComponentKey, $readQualifiedName): array {
        if (!is_dir($contentBlocksPath)) {
            return [];
        }

        $components = [];

        foreach (new \DirectoryIterator($contentBlocksPath) as $fileInfo) {
            if ($fileInfo->isDot() || !$fileInfo->isDir()) {
                continue;
            }

            $componentKey = $normalizeComponentKey($fileInfo->getFilename());

            if ($componentKey === '') {
                continue;
            }

            $components[] = [
                'key' => $componentKey,
                'qualifiedName' => $readQualifiedName($fileInfo->getPathname() . '/config.yaml'),
            ];
        }

        return $components;
    };

    $buildCTypeCandidates = static function (array $component) use ($normalizeComponentKey): array {
        $componentKey = isset($component['key']) && is_string($component['key'])
            ? str_replace('-', '_', $normalizeComponentKey($component['key']))
            : '';

        $cTypeCandidates = [];

        if ($componentKey !== '') {
            $cTypeCandidates[] = $componentKey;
            $cTypeCandidates[] = str_replace('_', '', $componentKey);
        }

        $qualifiedName = isset($component['qualifiedName']) && is_string($component['qualifiedName'])
            ? $component['qualifiedName']
            : null;

        if ($qualifiedName !== null && str_contains($qualifiedName, '/')) {
            [$vendorName, $contentBlockName] = explode('/', $qualifiedName, 2);

            $vendorSlug = $normalizeComponentKey($vendorName);
            $contentBlockSlug = $normalizeComponentKey($contentBlockName);

            if ($vendorSlug !== '' && $contentBlockSlug !== '') {
                $vendorUnderscore = str_replace('-', '_', $vendorSlug);
                $vendorCompact = str_replace('-', '', $vendorSlug);
                $contentBlockUnderscore = str_replace('-', '_', $contentBlockSlug);
                $contentBlockCompact = str_replace('-', '', $contentBlockSlug);

                $cTypeCandidates[] = $contentBlockUnderscore;
                $cTypeCandidates[] = $vendorUnderscore . '_' . $contentBlockUnderscore;
                $cTypeCandidates[] = $vendorCompact . '_' . $contentBlockUnderscore;
                // Content Blocks CType format: vendor/ → vendor_, hyphens removed
                $cTypeCandidates[] = $vendorUnderscore . '_' . $contentBlockCompact;
            }
        }

        return array_values(array_unique(array_filter($cTypeCandidates)));
    };

    $clientRootPath = Environment::getProjectPath();
    $factoryConfigPath = $clientRootPath . '/factory.json';
    $factoryContentBlocksPath = ExtensionManagementUtility::extPath('factory_core') . 'ContentBlocks/ContentElements';

    $factoryConfig = $readFactoryConfig($factoryConfigPath);
    $activeComponents = array_fill_keys($factoryConfig['active_components'], true);
    $inactiveCTypeCandidates = [];

    foreach ($discoverFactoryContentBlocks($factoryContentBlocksPath) as $component) {
        $componentKey = is_string($component['key'] ?? null) ? $component['key'] : '';

        if ($componentKey !== '' && isset($activeComponents[$componentKey])) {
            continue;
        }

        foreach ($buildCTypeCandidates($component) as $cTypeCandidate) {
            $inactiveCTypeCandidates[$cTypeCandidate] = true;
        }
    }

    if ($inactiveCTypeCandidates === []) {
        return;
    }

    $GLOBALS['TYPO3_CONF_VARS']['BE']['defaultPageTSconfig'] .= PHP_EOL
        . 'TCEFORM.tt_content.CType.removeItems := addToList(' . implode(',', array_keys($inactiveCTypeCandidates)) . ')';
})();
