#!/bin/bash
# (BOOT-dev) Run scripts for your development environment.
# Executed when the development container boots up. Can be used to simulate additional build steps
# you would normally put into "build.sh" but don't need for your production container

# Install composer dependencies
if [ -f "/var/www/html/composer.json" ]; then
	export COMPOSER_PROCESS_TIMEOUT=1200

	cd /var/www/html
	composer install
fi
