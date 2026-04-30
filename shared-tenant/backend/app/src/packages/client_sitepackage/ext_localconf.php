<?php

declare(strict_types=1);

defined('TYPO3') or die();

/*
 * Component activation gating now happens at TCA-override time:
 *  - Configuration/TCA/Overrides/hide_inactive_content_blocks.php removes
 *    inactive CTypes from `tt_content` entirely.
 *  - Configuration/TCA/Overrides/hide_inactive_records.php hides inactive
 *    record-type tables.
 *
 * Both consume LaborDigital\FactoryCore\Configuration\FactoryComponentRegistry,
 * which is the single source of truth for reading factory.json and discovering
 * factory-core components on disk.
 */
