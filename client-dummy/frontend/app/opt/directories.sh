#!/bin/bash
# (BUILD | BOOT) Create required directories
# Allows you to create additional required directories for your project.
#
# BEWARE: This file might run multiple times in a single boot sequence (mostly when building the container or when
# booting the development environment). So make sure you keep that in mind!
#
# You should use the ensure_dir function to create new directories whenever possible.
# It works identical to mkdir -p $YOUR_DIR but it also sets the directory permissions
# for every created directory in the path to the $DEFAULT_PERMISSIONS

# Example:
# ensure_dir /var/www/html/var/
# ensure_dir /var/www/html/tmp/foo/