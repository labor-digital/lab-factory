#!/bin/bash
# (BUILD | BOOT) Set directory permissions to your needs.
# The file is executed on build, boot and after composer tasks in your development environment
#
# You should use ensure_perms whenever possible it will set both file and folder permissions
# to the $DEFAULT_PERMISSIONS as well as the owner to the $DEFAULT_OWNER.
# - Directories are automatically handled recursively
# - You can pass a custom mode as second parameter
#
# NOTE: When ensure_perms sets the permissions for a directory it will automatically touch a "perms.set",
# each directory that has such a marker file will not be updated by ensure_perms.
# This is used, because permission updates are remarkably slow and with the marker we can even
# call this function on a mounted directory to ensure the permissions are set correctly without worring about
# the boot-up time for subsequent deployments

# Example:
# ensure_perms bin/cake g+x
# ensure_perms tmp
# ensure_perms var/sessions
# ensure_perms /var/www/html/my_folder_in_root