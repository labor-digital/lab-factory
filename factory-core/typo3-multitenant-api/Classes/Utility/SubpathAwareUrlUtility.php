<?php

declare(strict_types=1);

namespace LaborDigital\FactoryMultitenantApi\Utility;

use FriendsOfTYPO3\Headless\Utility\UrlUtility;
use TYPO3\CMS\Core\Http\Uri;
use TYPO3\CMS\Core\Site\Entity\SiteInterface;

/**
 * Patches a friendsoftypo3/headless bug that breaks shared-host multi-tenant
 * link generation.
 *
 * Upstream UrlUtility::getFrontendUrlWithSite (v4.7.x) only strips the TYPO3
 * site `base` path component when the configured `frontendBase` itself has a
 * non-empty path. resolveWithVariants() at the top of the call does
 * `rtrim($frontendUrl, '/')`, so `https://acme.fly.dev/` collapses to
 * `https://acme.fly.dev`, the path becomes '', the `if ($frontExtraPath)`
 * guard is false, and the strip is skipped.
 *
 * Net effect: for a tenant with
 *   base:         https://shared.example.com/<slug>
 *   frontendBase: https://acme.fly.dev/
 * every generated link ends up as
 *   https://acme.fly.dev/<slug>/<page>
 * — the frontend host is correct but the backend subpath leaks into the path,
 * and the Nuxt frontend serves it as a 404 because /<slug>/* isn't a route.
 *
 * This subclass calls the parent to do the normal rewrite, then post-processes
 * the returned URL: if its host matches the tenant's frontendBase host AND the
 * path still begins with the tenant's backend base path, strip that prefix.
 *
 * Registered as a service override of HeadlessFrontendUrlInterface in
 * Configuration/Services.yaml so every caller (link generation, hreflang,
 * MenuProcessor, breadcrumbs, …) gets the fixed behaviour.
 */
final class SubpathAwareUrlUtility extends UrlUtility
{
    public function getFrontendUrlWithSite($url, SiteInterface $site, string $returnField = 'frontendBase'): string
    {
        $rewritten = parent::getFrontendUrlWithSite($url, $site, $returnField);
        if ($rewritten === $url) {
            return $rewritten;
        }

        $backendPath = rtrim($site->getBase()->getPath(), '/');
        if ($backendPath === '') {
            return $rewritten;
        }

        try {
            $uri = new Uri($rewritten);
        } catch (\Throwable) {
            return $rewritten;
        }

        $path = $uri->getPath();
        if (!str_starts_with($path, $backendPath)) {
            return $rewritten;
        }
        // Only strip when the prefix is followed by '/' or end-of-string —
        // avoids false-positive matches like /<slug>foo (where <slug> is
        // a substring of a real path segment).
        $rest = substr($path, strlen($backendPath));
        if ($rest !== '' && !str_starts_with($rest, '/')) {
            return $rewritten;
        }

        $newPath = $rest === '' ? '/' : $rest;
        return (string)$uri->withPath($newPath);
    }
}
