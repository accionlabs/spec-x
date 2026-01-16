#!/bin/bash

echo "=========================================="
echo "  Specification-as-Product Demo Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo -e "${BLUE}Starting all demo servers...${NC}"
echo ""

# Install config server dependencies if needed
if [ ! -d "$SCRIPT_DIR/demo/config-server/node_modules" ]; then
    echo -e "${YELLOW}Installing config server dependencies...${NC}"
    cd "$SCRIPT_DIR/demo/config-server" && npm install
fi

# Start Config Server on port 3002
echo -e "${GREEN}[1/4]${NC} Starting Config Server on http://localhost:3002"
cd "$SCRIPT_DIR/demo/config-server" && npm start &
CONFIG_PID=$!

# Start Spec Selector on port 3000
echo -e "${GREEN}[2/4]${NC} Starting Specification Selector on http://localhost:3000"
cd "$SCRIPT_DIR/demo/spec-selector" && npm run dev &
SPEC_PID=$!

# Start Field Service App on port 3001
echo -e "${GREEN}[3/4]${NC} Starting Field Service App on http://localhost:3001"
cd "$SCRIPT_DIR/demo/field-service-app" && npm run dev &
APP_PID=$!

# Start Presentation on port 3003
echo -e "${GREEN}[4/4]${NC} Starting Presentation on http://localhost:3003"
cd "$SCRIPT_DIR/presentation" && npx serve -l 3003 . &
PRES_PID=$!

echo ""
echo "=========================================="
echo -e "${GREEN}All servers started!${NC}"
echo "=========================================="
echo ""
echo "  Config Server:       http://localhost:3002"
echo "  Spec Selector:       http://localhost:3000"
echo "  Field Service App:   http://localhost:3001"
echo "  Presentation:        http://localhost:3003"
echo ""
echo "Demo Flow:"
echo "  1. Open Spec Selector (port 3000)"
echo "  2. Configure features, data model, and workflows"
echo "  3. Click 'Generate Product'"
echo "  4. Open Field Service App (port 3001)"
echo "  5. See your configuration in action!"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for Ctrl+C
trap "kill $CONFIG_PID $SPEC_PID $APP_PID $PRES_PID 2>/dev/null; exit" SIGINT SIGTERM
wait
