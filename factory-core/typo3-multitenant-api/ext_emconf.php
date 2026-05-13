<?php

$EM_CONF[$_EXTKEY] = [
    'title' => 'Factory Multitenant API',
    'description' => 'HTTP API for the LABOR.digital Factory shared-tenant TYPO3 — create tenants, update capabilities live, and report deployed factory-core version. Off-by-default; install only on shared-tenant deployments.',
    'category' => 'plugin',
    'author' => 'LABOR.digital',
    'author_email' => 'info@labor.digital',
    'author_company' => 'LABOR.digital - Agentur für moderne Kommunikation GmbH',
    'state' => 'beta',
    'version' => '0.3.1', // x-release-please-version
    'constraints' => [
        'depends' => [
            'typo3' => '13.0.0-13.4.99',
            'factory_core' => '',
        ],
        'conflicts' => [],
        'suggests' => [],
    ],
];
