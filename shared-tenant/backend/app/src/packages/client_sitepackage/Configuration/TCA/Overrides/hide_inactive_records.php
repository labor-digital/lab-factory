<?php

declare(strict_types=1);

use LaborDigital\FactoryCore\Configuration\FactoryComponentRegistry;

defined('TYPO3') or die();

/*
 * Symmetrical to hide_inactive_content_blocks.php — but for record types.
 * Reads `active_record_types` from factory.json and sets `ctrl.hideTable=true`
 * on every record-type table that is NOT active.
 */
(static function (): void {
    // Shared-tenant mode gates per request via `TenantCTypeRestrictionListener`
    // (which emits `options.hideRecords.{table} = 1` for the current site).
    if (FactoryComponentRegistry::hasAnySiteConfig()) {
        return;
    }
    if (!FactoryComponentRegistry::hasRootConfig()) {
        return;
    }

    $config = FactoryComponentRegistry::loadConfig();
    $active = array_fill_keys($config['active_record_types'], true);

    foreach (FactoryComponentRegistry::discoverRecordTypes() as $record) {
        if (isset($active[$record['key']])) {
            continue;
        }
        $table = $record['table'] ?? null;
        if ($table === null || !isset($GLOBALS['TCA'][$table])) {
            continue;
        }
        $GLOBALS['TCA'][$table]['ctrl']['hideTable'] = true;
    }
})();
