<?php

declare(strict_types=1);

use TYPO3\CMS\Core\Core\Environment;
use TYPO3\CMS\Core\Utility\ExtensionManagementUtility;

defined('TYPO3') or die();

/*
 * Symmetrical to the inactive-CType hiding in ext_localconf.php, but for record
 * types. Reads `active_record_types` from the client's factory.json and sets
 * `ctrl.hideTable = true` on every record-type table that is NOT active.
 *
 * Runs at TCA-override time so `$GLOBALS['TCA']` is fully populated (Content
 * Blocks emits its TCA during the same phase).
 */
(static function (): void {
    $normalizeKey = static function (string $value): string {
        $value = trim($value);
        $value = (string)preg_replace('/([a-z0-9])([A-Z])/', '$1-$2', $value);
        $value = strtolower($value);
        $value = (string)preg_replace('/[^a-z0-9]+/', '-', $value);
        return trim($value, '-');
    };

    $configPath = Environment::getProjectPath() . '/factory.json';
    if (!is_file($configPath)) {
        return;
    }

    try {
        $config = json_decode((string)file_get_contents($configPath), true, 512, JSON_THROW_ON_ERROR);
    } catch (\JsonException) {
        return;
    }

    if (!is_array($config)) {
        return;
    }

    $activeKeys = array_fill_keys(
        array_map(
            $normalizeKey,
            array_filter(
                $config['active_record_types'] ?? [],
                static fn(mixed $v): bool => is_string($v) && $v !== ''
            )
        ),
        true
    );

    $recordTypesPath = ExtensionManagementUtility::extPath('factory_core') . 'ContentBlocks/RecordTypes';
    if (!is_dir($recordTypesPath)) {
        return;
    }

    foreach (new \DirectoryIterator($recordTypesPath) as $fileInfo) {
        if ($fileInfo->isDot() || !$fileInfo->isDir()) {
            continue;
        }

        $dirKey = $normalizeKey($fileInfo->getFilename());
        if ($dirKey === '' || isset($activeKeys[$dirKey])) {
            continue;
        }

        $configYamlPath = $fileInfo->getPathname() . '/config.yaml';
        if (!is_file($configYamlPath)) {
            continue;
        }

        // Extract `table:` from config.yaml with a minimal regex read — avoids
        // pulling in a YAML parser at TCA bootstrap time.
        $yaml = (string)file_get_contents($configYamlPath);
        if (preg_match("/^table:\\s*['\"]?([A-Za-z0-9_]+)['\"]?/m", $yaml, $matches) !== 1) {
            continue;
        }

        $table = $matches[1];
        if (isset($GLOBALS['TCA'][$table])) {
            $GLOBALS['TCA'][$table]['ctrl']['hideTable'] = true;
        }
    }
})();
