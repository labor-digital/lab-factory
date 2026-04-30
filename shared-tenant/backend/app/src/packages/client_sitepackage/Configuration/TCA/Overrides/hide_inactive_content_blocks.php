<?php

declare(strict_types=1);

use LaborDigital\FactoryCore\Configuration\FactoryComponentRegistry;

defined('TYPO3') or die();

/*
 * Strips factory ContentBlocks that are NOT listed in factory.json's
 * `active_components` from `tt_content` TCA entirely. Runs after
 * content-blocks has emitted its TCA, so the inactive CTypes are gone from
 * `types`, the CType select items, and any non-empty itemGroups.
 *
 * Symmetrical to hide_inactive_records.php (which does the same for
 * RecordType tables via `ctrl.hideTable`).
 */
(static function (): void {
    // Shared-tenant mode (any `config/sites/*/factory.json` present) gates per
    // request via `TenantCTypeRestrictionListener`. Globally stripping TCA here
    // would hide CTypes that other tenants still need, so bail out.
    if (FactoryComponentRegistry::hasAnySiteConfig()) {
        return;
    }
    // No factory.json anywhere → not a factory-gated install (e.g. a fresh
    // shared-tenant stack with no tenants yet). Leaving all CTypes registered
    // is correct; the tenant-restriction listener will take over once the
    // first tenant is provisioned.
    if (!FactoryComponentRegistry::hasRootConfig()) {
        return;
    }

    $config = FactoryComponentRegistry::loadConfig();
    $active = array_fill_keys($config['active_components'], true);

    $inactive = [];
    foreach (FactoryComponentRegistry::discoverContentBlocks() as $component) {
        if (isset($active[$component['key']])) {
            continue;
        }
        foreach (FactoryComponentRegistry::buildCTypeCandidates($component) as $cType) {
            $inactive[$cType] = true;
        }
    }

    if ($inactive === []) {
        return;
    }

    foreach (array_keys($inactive) as $cType) {
        unset($GLOBALS['TCA']['tt_content']['types'][$cType]);
    }

    $items = $GLOBALS['TCA']['tt_content']['columns']['CType']['config']['items'] ?? null;
    if (is_array($items)) {
        $GLOBALS['TCA']['tt_content']['columns']['CType']['config']['items'] = array_values(array_filter(
            $items,
            static fn(array $item): bool => !isset($inactive[$item['value'] ?? ''])
        ));
    }
})();
