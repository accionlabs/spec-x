#!/bin/bash

# Field Service Sync Server - One-Line Installer
# Usage: curl -sL <url>/install.sh | bash
#
# This script will:
# 1. Check for Podman or Docker (prefers Podman - fully open source)
# 2. Install Tailscale for remote access
# 3. Create sync-server directory with all config files
# 4. Start CouchDB container with auto-restart
# 5. Initialize databases for sync

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
INSTALL_DIR="${INSTALL_DIR:-$HOME/field-service-sync}"
COUCH_USER="${COUCH_USER:-admin}"
COUCH_PASSWORD="${COUCH_PASSWORD:-password}"
COUCH_PORT="${COUCH_PORT:-5984}"
SKIP_TAILSCALE="${SKIP_TAILSCALE:-false}"

# Container runtime (will be set to 'podman' or 'docker')
CONTAINER_CMD=""
COMPOSE_CMD=""

# Detect if running interactively (not via pipe)
IS_INTERACTIVE=false
if [ -t 0 ]; then
    IS_INTERACTIVE=true
fi

echo ""
echo -e "${PURPLE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║         Field Service Sync Server Installer               ║${NC}"
echo -e "${PURPLE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================
# Step 1: Check for Podman or Docker
# ============================================
echo -e "${CYAN}[1/5]${NC} Checking container runtime..."

check_podman() {
    if command -v podman &> /dev/null; then
        PODMAN_VERSION=$(podman --version | cut -d' ' -f3)
        echo -e "  ${GREEN}✓${NC} Podman ${PODMAN_VERSION} found (open source)"
        CONTAINER_CMD="podman"
        return 0
    fi
    return 1
}

check_docker() {
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | tr -d ',')
        echo -e "  ${GREEN}✓${NC} Docker ${DOCKER_VERSION} found"

        # Check if Docker daemon is running
        if ! docker info &> /dev/null; then
            echo -e "  ${YELLOW}⚠${NC} Docker is installed but not running"
            return 1
        fi
        CONTAINER_CMD="docker"
        return 0
    fi
    return 1
}

check_compose() {
    if [ "$CONTAINER_CMD" = "podman" ]; then
        # Check for podman-compose or podman compose
        if podman compose version &> /dev/null 2>&1; then
            COMPOSE_CMD="podman compose"
            echo -e "  ${GREEN}✓${NC} Podman Compose found"
            return 0
        elif command -v podman-compose &> /dev/null; then
            COMPOSE_CMD="podman-compose"
            echo -e "  ${GREEN}✓${NC} podman-compose found"
            return 0
        fi
    else
        # Check for docker compose
        if docker compose version &> /dev/null 2>&1; then
            COMPOSE_CMD="docker compose"
            echo -e "  ${GREEN}✓${NC} Docker Compose found"
            return 0
        elif command -v docker-compose &> /dev/null; then
            COMPOSE_CMD="docker-compose"
            echo -e "  ${GREEN}✓${NC} docker-compose found"
            return 0
        fi
    fi
    return 1
}

install_instructions() {
    echo -e "  ${RED}✗${NC} No container runtime found"
    echo ""
    echo -e "${YELLOW}A container runtime is required. We recommend Podman (fully open source):${NC}"
    echo ""

    case "$(uname -s)" in
        Darwin)
            echo -e "${CYAN}macOS - Install Podman:${NC}"
            echo "  brew install podman podman-compose"
            echo "  podman machine init"
            echo "  podman machine start"
            echo ""
            echo -e "${CYAN}Alternative - Docker Desktop:${NC}"
            echo "  brew install --cask docker"
            echo "  (Note: Docker Desktop has licensing requirements for large organizations)"
            ;;
        Linux)
            echo -e "${CYAN}Linux - Install Podman:${NC}"
            echo ""
            echo "  # Ubuntu/Debian:"
            echo "  sudo apt update && sudo apt install -y podman podman-compose"
            echo ""
            echo "  # Fedora/RHEL/CentOS:"
            echo "  sudo dnf install -y podman podman-compose"
            echo ""
            echo "  # Arch:"
            echo "  sudo pacman -S podman podman-compose"
            echo ""
            echo -e "${CYAN}Alternative - Docker:${NC}"
            echo "  curl -fsSL https://get.docker.com | sh"
            echo "  sudo usermod -aG docker \$USER && newgrp docker"
            ;;
        MINGW*|CYGWIN*|MSYS*)
            echo -e "${CYAN}Windows:${NC}"
            echo "  Download Podman Desktop from: https://podman-desktop.io/"
            echo "  Or Docker Desktop from: https://www.docker.com/products/docker-desktop"
            ;;
        *)
            echo "  Podman: https://podman.io/docs/installation"
            echo "  Docker: https://docs.docker.com/get-docker/"
            ;;
    esac

    echo ""
    echo "After installation, run this script again."
    echo ""
    exit 1
}

# Try Podman first (preferred - fully open source)
if check_podman; then
    echo -e "  ${PURPLE}Using Podman (recommended - Apache 2.0 license)${NC}"
elif check_docker; then
    echo -e "  ${YELLOW}Note: Consider switching to Podman for a fully open source solution${NC}"
else
    install_instructions
fi

# Check for compose support
if ! check_compose; then
    echo -e "  ${RED}✗${NC} Compose not found"
    echo ""
    if [ "$CONTAINER_CMD" = "podman" ]; then
        echo "Please install podman-compose:"
        echo "  pip install podman-compose"
        echo "  # or"
        echo "  brew install podman-compose  (macOS)"
        echo "  apt install podman-compose   (Debian/Ubuntu)"
    else
        echo "Please install Docker Compose:"
        echo "  sudo apt install docker-compose-plugin"
    fi
    exit 1
fi

# ============================================
# Step 2: Install/Configure Tailscale
# ============================================
echo ""
echo -e "${CYAN}[2/5]${NC} Setting up Tailscale for remote access..."

TAILSCALE_IP=""

install_tailscale() {
    case "$(uname -s)" in
        Darwin)
            if command -v brew &> /dev/null; then
                echo -e "  Installing Tailscale via Homebrew..."
                brew install --cask tailscale 2>/dev/null || true
                echo -e "  ${YELLOW}⚠${NC} Please open Tailscale from Applications and sign in"
                echo -e "  ${YELLOW}⚠${NC} Then run this script again"
                exit 0
            else
                echo -e "  ${YELLOW}⚠${NC} Please install Tailscale manually:"
                echo "    https://tailscale.com/download/mac"
                exit 1
            fi
            ;;
        Linux)
            echo -e "  Installing Tailscale..."
            curl -fsSL https://tailscale.com/install.sh | sh
            echo -e "  ${GREEN}✓${NC} Tailscale installed"

            # Start and enable tailscaled
            if command -v systemctl &> /dev/null; then
                sudo systemctl enable --now tailscaled 2>/dev/null || true
            fi

            # Check if already authenticated
            if ! tailscale status &> /dev/null; then
                echo ""
                echo -e "  ${YELLOW}Please authenticate Tailscale:${NC}"
                echo ""
                sudo tailscale up
                echo ""
            fi
            ;;
        *)
            echo -e "  ${YELLOW}⚠${NC} Please install Tailscale manually:"
            echo "    https://tailscale.com/download"
            ;;
    esac
}

get_tailscale_ip() {
    if command -v tailscale &> /dev/null; then
        # Try to get Tailscale IP
        TAILSCALE_IP=$(tailscale ip -4 2>/dev/null || echo "")
        if [ -n "$TAILSCALE_IP" ]; then
            echo -e "  ${GREEN}✓${NC} Tailscale IP: ${TAILSCALE_IP}"
            return 0
        fi
    fi
    return 1
}

if [ "$SKIP_TAILSCALE" = "true" ]; then
    echo -e "  ${YELLOW}⚠${NC} Skipping Tailscale (SKIP_TAILSCALE=true)"
else
    if command -v tailscale &> /dev/null; then
        echo -e "  ${GREEN}✓${NC} Tailscale found"

        # Check if connected
        if tailscale status &> /dev/null; then
            get_tailscale_ip || true
        else
            echo -e "  ${YELLOW}⚠${NC} Tailscale not connected"
            if [ "$IS_INTERACTIVE" = "true" ]; then
                echo ""
                echo -e "  ${CYAN}Starting Tailscale...${NC}"

                case "$(uname -s)" in
                    Darwin)
                        echo -e "  Please open Tailscale from menu bar and sign in"
                        echo ""
                        read -p "  Press Enter after Tailscale is connected, or 's' to skip: " response
                        if [ "$response" = "s" ] || [ "$response" = "S" ]; then
                            echo -e "  ${YELLOW}⚠${NC} Skipping Tailscale - only local access available"
                        else
                            get_tailscale_ip || true
                        fi
                        ;;
                    Linux)
                        sudo tailscale up || true
                        get_tailscale_ip || true
                        ;;
                esac
            else
                echo -e "  ${YELLOW}⚠${NC} Run 'tailscale up' manually after installation for remote access"
            fi
        fi
    else
        echo -e "  ${YELLOW}⚠${NC} Tailscale not installed"
        if [ "$IS_INTERACTIVE" = "true" ]; then
            echo ""
            read -p "  Install Tailscale for remote access? (Y/n): " install_ts
            if [ "$install_ts" != "n" ] && [ "$install_ts" != "N" ]; then
                install_tailscale
                get_tailscale_ip || true
            else
                echo -e "  ${YELLOW}⚠${NC} Skipping Tailscale - only local access available"
            fi
        else
            echo -e "  ${YELLOW}⚠${NC} Install Tailscale manually for remote access: https://tailscale.com/download"
        fi
    fi
fi

# ============================================
# Step 3: Create installation directory
# ============================================
echo ""
echo -e "${CYAN}[3/5]${NC} Setting up installation directory..."

mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo -e "  ${GREEN}✓${NC} Created $INSTALL_DIR"

# Create local.ini config file with required settings
mkdir -p config
cat > config/local.ini << 'CONFIG_EOF'
[couchdb]
single_node = true

[chttpd]
enable_cors = true
bind_address = 0.0.0.0

[chttpd_auth]
require_valid_user = false

[cors]
origins = *
credentials = true
methods = GET, PUT, POST, HEAD, DELETE
headers = accept, authorization, content-type, origin, referer, x-csrf-token
CONFIG_EOF

echo -e "  ${GREEN}✓${NC} Created config/local.ini"

# Create docker-compose.yml (works with both podman-compose and docker-compose)
cat > docker-compose.yml << 'COMPOSE_EOF'
services:
  couchdb:
    image: couchdb:3.3
    container_name: field-service-sync
    restart: unless-stopped
    ports:
      - "${COUCH_PORT:-5984}:5984"
    environment:
      - COUCHDB_USER=${COUCH_USER:-admin}
      - COUCHDB_PASSWORD=${COUCH_PASSWORD:-password}
    volumes:
      - couchdb_data:/opt/couchdb/data
      - ./config:/opt/couchdb/etc/local.d
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5984/_up"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  couchdb_data:
COMPOSE_EOF

echo -e "  ${GREEN}✓${NC} Created docker-compose.yml"

# Create .env file for configuration
cat > .env << ENV_EOF
COUCH_USER=${COUCH_USER}
COUCH_PASSWORD=${COUCH_PASSWORD}
COUCH_PORT=${COUCH_PORT}
ENV_EOF

echo -e "  ${GREEN}✓${NC} Created .env configuration"

# ============================================
# Step 4: Start the server
# ============================================
echo ""
echo -e "${CYAN}[4/5]${NC} Starting CouchDB server..."

# Stop existing container if running
$CONTAINER_CMD stop field-service-sync &> /dev/null 2>&1 || true
$CONTAINER_CMD rm field-service-sync &> /dev/null 2>&1 || true

# Start with compose
$COMPOSE_CMD up -d

echo -e "  ${GREEN}✓${NC} CouchDB container started with ${CONTAINER_CMD}"
echo -e "  ${GREEN}✓${NC} Auto-restart on boot enabled"

# ============================================
# Step 5: Initialize databases
# ============================================
echo ""
echo -e "${CYAN}[5/5]${NC} Initializing databases..."

# Wait for CouchDB to be ready
echo -n "  Waiting for CouchDB"
RETRIES=30
until curl -s "http://localhost:${COUCH_PORT}/_up" > /dev/null 2>&1; do
    echo -n "."
    RETRIES=$((RETRIES - 1))
    if [ $RETRIES -eq 0 ]; then
        echo ""
        echo -e "  ${RED}✗${NC} CouchDB failed to start"
        echo "  Check logs with: $CONTAINER_CMD logs field-service-sync"
        exit 1
    fi
    sleep 1
done
echo " ready!"

COUCH_URL="http://${COUCH_USER}:${COUCH_PASSWORD}@localhost:${COUCH_PORT}"

# Config is loaded from mounted config/local.ini file
echo -e "  ${GREEN}✓${NC} CORS and anonymous access configured via local.ini"

# Create system databases
curl -s -X PUT "$COUCH_URL/_users" > /dev/null 2>&1 || true
curl -s -X PUT "$COUCH_URL/_replicator" > /dev/null 2>&1 || true
curl -s -X PUT "$COUCH_URL/_global_changes" > /dev/null 2>&1 || true

echo -e "  ${GREEN}✓${NC} System databases initialized"

# ============================================
# Complete!
# ============================================
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Installation Complete!                        ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Display container runtime info
echo -e "${CYAN}Container Runtime:${NC} ${CONTAINER_CMD} (${COMPOSE_CMD})"
echo ""

# Display URLs
echo -e "${CYAN}Sync Server URLs:${NC}"
echo ""
echo -e "  ${YELLOW}Local:${NC}    http://localhost:${COUCH_PORT}"

if [ -n "$TAILSCALE_IP" ]; then
    echo -e "  ${YELLOW}Remote:${NC}   http://${TAILSCALE_IP}:${COUCH_PORT}  ${GREEN}← Use this for team access${NC}"
    echo ""
    echo -e "  ${PURPLE}Share the Remote URL with your team members.${NC}"
    echo -e "  ${PURPLE}They need Tailscale installed and joined to your network.${NC}"
else
    echo ""
    echo -e "  ${YELLOW}⚠ No Tailscale IP - only local access available${NC}"
    echo -e "  Run 'tailscale up' to enable remote access"
fi

echo ""
echo -e "${CYAN}Admin Dashboard:${NC}"
echo -e "  http://localhost:${COUCH_PORT}/_utils"
echo -e "  Username: ${COUCH_USER}"
echo -e "  Password: ${COUCH_PASSWORD}"

echo ""
echo -e "${CYAN}Installation Directory:${NC}"
echo -e "  ${INSTALL_DIR}"

echo ""
echo -e "${CYAN}Useful Commands:${NC}"
echo -e "  Stop server:    ${BLUE}cd ${INSTALL_DIR} && ${COMPOSE_CMD} down${NC}"
echo -e "  Start server:   ${BLUE}cd ${INSTALL_DIR} && ${COMPOSE_CMD} up -d${NC}"
echo -e "  View logs:      ${BLUE}${CONTAINER_CMD} logs -f field-service-sync${NC}"
echo -e "  Tailscale IP:   ${BLUE}tailscale ip -4${NC}"

echo ""
echo -e "${CYAN}Uninstall:${NC}"
echo -e "  ${BLUE}cd ${INSTALL_DIR} && ${COMPOSE_CMD} down -v && rm -rf ${INSTALL_DIR}${NC}"

echo ""
if [ -n "$TAILSCALE_IP" ]; then
    echo -e "${PURPLE}Copy this URL into the wizard:${NC} ${YELLOW}http://${TAILSCALE_IP}:${COUCH_PORT}${NC}"
else
    echo -e "${PURPLE}Copy this URL into the wizard:${NC} ${YELLOW}http://localhost:${COUCH_PORT}${NC}"
fi
echo ""

# Save connection info to a file for easy reference
cat > "$INSTALL_DIR/connection-info.txt" << INFO_EOF
Field Service Sync Server
=========================

Container Runtime: ${CONTAINER_CMD}

Local URL:  http://localhost:${COUCH_PORT}
Remote URL: http://${TAILSCALE_IP:-<run 'tailscale ip -4'>}:${COUCH_PORT}

Admin Dashboard: http://localhost:${COUCH_PORT}/_utils
Username: ${COUCH_USER}
Password: ${COUCH_PASSWORD}

To get Tailscale IP: tailscale ip -4
To check status: tailscale status

Commands:
  Stop:  cd ${INSTALL_DIR} && ${COMPOSE_CMD} down
  Start: cd ${INSTALL_DIR} && ${COMPOSE_CMD} up -d
  Logs:  ${CONTAINER_CMD} logs -f field-service-sync
INFO_EOF

echo -e "${GREEN}Connection info saved to: ${INSTALL_DIR}/connection-info.txt${NC}"
echo ""
