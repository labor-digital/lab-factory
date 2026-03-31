#!/bin/bash
# (BOOT) Run additional scripts when your container boots up
# This file may be used to execute additional scripts for your container

# Trust the LABOR root CA so Node.js SSR requests accept *.labor.systems certs
LABOR_ROOT_CA="/var/www/html/node_modules/@labor-digital/ssl-certs/rootca/LaborRootCA.pem"
if [ -f "$LABOR_ROOT_CA" ]; then
  export NODE_EXTRA_CA_CERTS="$LABOR_ROOT_CA"
fi

# Map the TYPO3 backend domain to the backend container on the shared Docker
# network. Docker's embedded DNS resolves FQDN aliases via external DNS first,
# so we override /etc/hosts with the container's actual IP.
if [ -n "$TYPO3_API_BASE_URL" ] && [ "$TYPO3_API_BASE_URL" != "null" ]; then
  BACKEND_HOST=$(echo "$TYPO3_API_BASE_URL" | sed -E 's|https?://([^/:]+).*|\1|')
  BACKEND_CONTAINER="${COMPOSE_PROJECT_NAME%-frontend}-backend"
  BACKEND_IP=$(getent ahostsv4 "$BACKEND_CONTAINER" 2>/dev/null | awk 'NR==1{print $1}')
  if [ -n "$BACKEND_HOST" ] && [ -n "$BACKEND_IP" ]; then
    echo "$BACKEND_IP $BACKEND_HOST" >> /etc/hosts
  fi
fi
