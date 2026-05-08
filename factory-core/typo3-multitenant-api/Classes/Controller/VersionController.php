<?php

declare(strict_types=1);

namespace LaborDigital\FactoryMultitenantApi\Controller;

use Psr\Http\Message\ResponseInterface;
use TYPO3\CMS\Core\Http\JsonResponse;
use TYPO3\CMS\Core\Information\Typo3Version;
use TYPO3\CMS\Core\Utility\ExtensionManagementUtility;
use TYPO3\CMS\Core\Utility\GeneralUtility;

/**
 * GET /api/multitenant/version — reports what factory-core / factory-multitenant-api
 * are deployed and what seed-schema range we accept. Pipeline-app calls this
 * before POST /tenants to make sure the seed it's about to send is compatible
 * with the running deploy (DL #013, "Compatibility model").
 */
final class VersionController
{
    private const SUPPORTED_SEED_SCHEMA_MIN = '1.0';
    private const SUPPORTED_SEED_SCHEMA_MAX = '1.0';

    public function version(): ResponseInterface
    {
        return new JsonResponse([
            'factory_core_version' => $this->extensionVersion('factory_core'),
            'factory_multitenant_api_version' => $this->extensionVersion('factory_multitenant_api'),
            'typo3_version' => GeneralUtility::makeInstance(Typo3Version::class)->getVersion(),
            'supported_seed_schema' => [
                'min' => self::SUPPORTED_SEED_SCHEMA_MIN,
                'max' => self::SUPPORTED_SEED_SCHEMA_MAX,
            ],
        ]);
    }

    private function extensionVersion(string $key): ?string
    {
        try {
            return ExtensionManagementUtility::getExtensionVersion($key) ?: null;
        } catch (\Throwable) {
            return null;
        }
    }
}
