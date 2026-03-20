<?php

$EM_CONF[$_EXTKEY] = [
    'title' => 'Client Dummy Site Package',
    'description' => 'Client-specific TYPO3 site package for Factory bootstrap',
    'category' => 'templates',
    'author' => 'My Agency',
    'state' => 'alpha',
    'version' => '1.0.0',
    'constraints' => [
        'depends' => [
            'typo3' => '13.4.0-13.4.99',
            'factory_core' => '',
        ],
        'conflicts' => [],
        'suggests' => [],
    ],
];
