#!/bin/bash

# SmartHub systemd service installer
# Run with: sudo ./scripts/install-services.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Feil: Kjor dette scriptet med sudo${NC}"
    echo "  sudo ./scripts/install-services.sh"
    exit 1
fi

# Get the actual user (not root)
ACTUAL_USER=${SUDO_USER:-pi}
ACTUAL_HOME=$(eval echo ~$ACTUAL_USER)

# Get project directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${GREEN}=== SmartHub Service Installer ===${NC}"
echo ""
echo "Bruker: $ACTUAL_USER"
echo "Hjemmemappe: $ACTUAL_HOME"
echo "Prosjektmappe: $PROJECT_ROOT"
echo ""

# Check if .env exists
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    echo -e "${YELLOW}Advarsel: .env fil mangler. Kopierer fra .env.example...${NC}"
    if [ -f "$PROJECT_ROOT/.env.example" ]; then
        cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
        chown $ACTUAL_USER:$ACTUAL_USER "$PROJECT_ROOT/.env"
        echo -e "${YELLOW}Husk a redigere .env med dine API-nokler!${NC}"
    else
        echo -e "${RED}Feil: .env.example finnes ikke${NC}"
        exit 1
    fi
fi

# Create temporary directory for modified service files
TEMP_DIR=$(mktemp -d)

# Function to process service file
process_service() {
    local src=$1
    local dest=$2
    local service_name=$(basename $src)

    echo "Installerer $service_name..."

    # Replace placeholders with actual values
    sed -e "s|/home/pi|$ACTUAL_HOME|g" \
        -e "s|User=pi|User=$ACTUAL_USER|g" \
        -e "s|/home/pi/rpi-smarthub|$PROJECT_ROOT|g" \
        "$src" > "$TEMP_DIR/$service_name"

    # Copy to systemd directory
    cp "$TEMP_DIR/$service_name" "$dest/$service_name"
    chmod 644 "$dest/$service_name"
}

# Install services
SYSTEMD_DIR="/etc/systemd/system"

process_service "$PROJECT_ROOT/systemd/smarthub-api.service" "$SYSTEMD_DIR"
process_service "$PROJECT_ROOT/systemd/smarthub-frontend.service" "$SYSTEMD_DIR"
process_service "$PROJECT_ROOT/systemd/smarthub-kiosk.service" "$SYSTEMD_DIR"

# Cleanup
rm -rf "$TEMP_DIR"

# Reload systemd
echo ""
echo "Laster inn systemd konfigurasjon..."
systemctl daemon-reload

# Enable services
echo "Aktiverer services..."
systemctl enable smarthub-api.service
systemctl enable smarthub-frontend.service
systemctl enable smarthub-kiosk.service

# Start services
echo ""
echo "Starter services..."
systemctl start smarthub-api.service
systemctl start smarthub-frontend.service

echo ""
echo -e "${GREEN}=== Installasjon fullfort! ===${NC}"
echo ""
echo "Services installert og startet:"
echo "  - smarthub-api      (Flask API pa port 5000)"
echo "  - smarthub-frontend (HTTP server pa port 3000)"
echo "  - smarthub-kiosk    (Chromium kiosk - starter ved neste reboot)"
echo ""
echo "Nyttige kommandoer:"
echo "  sudo systemctl status smarthub-api      # Sjekk API status"
echo "  sudo systemctl status smarthub-frontend # Sjekk frontend status"
echo "  sudo systemctl status smarthub-kiosk    # Sjekk kiosk status"
echo "  sudo journalctl -u smarthub-api -f      # Se API logger"
echo "  sudo systemctl restart smarthub-api     # Restart API"
echo ""
echo -e "${YELLOW}For a starte kiosk na (uten reboot):${NC}"
echo "  sudo systemctl start smarthub-kiosk"
echo ""
echo -e "${YELLOW}For a deaktivere kiosk-modus:${NC}"
echo "  sudo systemctl disable smarthub-kiosk"
echo ""
