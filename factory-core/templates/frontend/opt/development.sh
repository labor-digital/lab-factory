#!/bin/bash
# (BOOT-dev) Run scripts for your development environment.
# Executed when the development container boots up. Can be used to simulate additional build steps
# you would normally put into "build.sh" but don't need for your production container

# Install npm dependencies
if [ -f "/var/www/html/package.json" ]; then
  echo "Installing npm dependencies..."

	cd /var/www/html
	npm install
fi
