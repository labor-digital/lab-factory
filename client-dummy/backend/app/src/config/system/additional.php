<?php

defined('TYPO3') or die();

$GLOBALS['TYPO3_CONF_VARS'] = array_replace_recursive(
    $GLOBALS['TYPO3_CONF_VARS'],
    [
        'SYS' => [
            'sitename' => getenv('APP_SITENAME', getenv('COMPOSE_PROJECT_NAME')),
            'encryptionKey' => getenv('APP_ENCRYPTION_KEY'),
        ],
        'BE' => [
            'installToolPassword' => getenv('APP_INSTALL_TOOL_PASSWORD'),
        ],
        'DB' => [
            'Connections' => [
                'Default' => [
                    'dbname' => getenv('APP_MYSQL_DATABASE'),
                    'host' => getenv('APP_MYSQL_HOST'),
                    'password' => getenv('APP_MYSQL_PASS'),
                    'user' => getenv('APP_MYSQL_USER'),
                    'ssl_ca' => !empty(getenv('APP_MYSQL_SSL_CA_CERT')) ? '/var/www/html/.mysql_ssl_ca_cert.pem' : '',
                    'driverOptions' => [
                        'flags' => MYSQLI_CLIENT_SSL
                    ]
                ],
            ],
        ],
        'MAIL' => [
            'transport' => 'smtp',
            'transport_smtp_server' => trim(getenv('APP_SECRET_MAIL_SMTP_SERVER') . ':' . getenv('APP_SECRET_MAIL_SMTP_PORT')),
            'transport_smtp_username' => getenv('APP_SECRET_MAIL_SMTP_USER'),
            'transport_smtp_password' => getenv('APP_SECRET_MAIL_SMTP_PASSWORD'),
            'transport_smtp_encrypt' => getenv('APP_SECRET_MAIL_SMTP_ENCRYPT') === 'true',
            'defaultMailFromAddress' => getenv('APP_SECRET_MAIL_SMTP_SENDER'),
        ],
    ]
);


if (getenv('APP_DEBUG') === 'true' || getenv('PROJECT_ENV') === 'dev') {
    $GLOBALS['TYPO3_CONF_VARS'] = array_replace_recursive(
        $GLOBALS['TYPO3_CONF_VARS'],
        [
            'SYS' => [
                'devIPmask' => '*',
                'displayErrors' => 1,
                'exceptionalErrors' => 12290
            ],
            'BE' => [
                'debug' => true,
            ],
            'HTTP' => [
                'verify' => false,
            ],
        ]
    );
}