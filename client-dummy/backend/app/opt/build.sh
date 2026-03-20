#!/bin/bash
# (BUILD | BOOT:dev-only) Add additional dependencies.
# This file is meant to install additional dependencies to your images which are not already installed
# in our base images (LDAP, redis...)
#
# NOTE: When the script runs in the development container it is only executed the first time your container boots
# it will NOT be executed on subsequent boots. So use "development" for scripts that have to be called every time
# you start your development environment.

# Example:
# apt-get install -y redis