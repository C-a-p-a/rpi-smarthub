#!/bin/bash

# SmartHub systemd service uninstaller
# Run with: sudo ./scripts/uninstall-services.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Feil: Kjor dette scriptet med sudo${NC}"
    exit 1
fi

echo -e "${GREEN}=== SmartHub Service Uninstaller ===${NC}"
echo ""

# Stop services
echo "Stopper services..."
systemctl stop smarthub-kiosk.service 2>/dev/null || true
systemctl stop smarthub-frontend.service 2>/dev/null || true
systemctl stop smarthub-api.service 2>/dev/null || true

# Disable services
echo "Deaktiverer services..."
systemctl disable smarthub-kiosk.service 2>/dev/null || true
systemctl disable smarthub-frontend.service 2>/dev/null || true
systemctl disable smarthub-api.service 2>/dev/null || true

# Remove service files
echo "Fjerner service-filer..."
rm -f /etc/systemd/system/smarthub-api.service
rm -f /etc/systemd/system/smarthub-frontend.service
rm -f /etc/systemd/system/smarthub-kiosk.service

# Reload systemd
echo "Laster inn systemd konfigurasjon..."
systemctl daemon-reload

echo ""
echo -e "${GREEN}SmartHub services er fjernet.${NC}"
echo ""
echo "For a kjore manuelt igjen, bruk:"
echo "  ./scripts/start.sh"
echo ""
