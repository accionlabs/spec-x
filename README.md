# Specification-as-Product (Spec-X)

A paradigm that transforms how software products are conceived, built, and delivered. Instead of selling code artifacts (traditional SaaS), this paradigm sells ontological specifications from which code is generated on-demand based on customer needs.

## Overview

This monorepo contains a working demonstration of the Specification-as-Product concept, featuring a **Field Service Management** application that can be configured and generated through a wizard interface.

### Core Concept

Think "à-la-carte at buffet economics" - customers get tailored software at SaaS speed and cost. The four pillars:

1. **Semantic Engineering** - Domain knowledge in machine-readable ontologies
2. **Local-First Architecture** - Customer's device as infrastructure, enabling offline capability
3. **Market Expansion** - Combined economics make previously unviable market segments profitable
4. **Business Model Innovation** - Feature-based pricing aligned with actual value delivered

## Project Structure

```
spec-x/
├── demo/
│   ├── spec-selector/      # Feature configuration wizard (React + Vite)
│   ├── field-service-app/  # Generated field service application (React + Vite)
│   ├── config-server/      # Configuration API server (Express)
│   ├── sync-server/        # CouchDB sync server setup (Docker)
│   └── sync-agent/         # Sync agent for remote connections
├── concept/                # Conceptual documentation
├── presentation/           # Presentation materials
└── start-demo.sh          # Quick start script
```

## Applications

### Spec Selector (Feature Configurator)
A wizard interface where customers configure their field service application:
- Team size selection (Individual → Enterprise)
- Feature selection by persona (Technician, Dispatcher, Manager)
- Custom fields for work orders
- Workflow state customization
- Deployment configuration (languages, sync server)
- User management

**Port:** 3000

### Field Service App
A local-first field service management application featuring:
- Work order management with custom fields
- Equipment tracking with barcode scanning
- Multi-persona dashboards (Technician, Dispatcher, Manager)
- Offline-first with PouchDB
- Real-time sync via CouchDB
- i18n support (English, Spanish, Portuguese)

**Port:** 3001

### Config Server
REST API for managing application configurations:
- Store/retrieve configurations
- Version tracking
- Hot-reload support

**Port:** 3002

### Sync Server
CouchDB-based sync server for team collaboration:
- One-line installation with Docker
- Tailscale integration for remote access
- Auto-restart on boot
- CORS enabled for browser access

**Port:** 5984

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Docker (for sync server)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/spec-x.git
cd spec-x

# Install dependencies
npm install

# Start all services
./start-demo.sh
```

Or start services individually:

```bash
# Terminal 1: Config Server
cd demo/config-server && npm install && npm start

# Terminal 2: Spec Selector
cd demo/spec-selector && npm install && npm run dev

# Terminal 3: Field Service App
cd demo/field-service-app && npm install && npm run dev
```

### Access the Applications

- **Spec Selector (Wizard):** http://localhost:3000
- **Field Service App:** http://localhost:3001
- **Config Server API:** http://localhost:3002

## Setting Up Sync Server (For Teams)

For team collaboration, you need a sync server. Run the one-line installer:

```bash
curl -sL https://raw.githubusercontent.com/accionlabs/spec-x/main/demo/sync-server/install.sh | bash
```

This will:
1. Check for Docker (with install instructions if missing)
2. Set up Tailscale for remote access (no public IP needed)
3. Set up CouchDB with CORS enabled
4. Configure auto-restart on system boot
5. Initialize sync databases

After installation, use the Sync URL in the wizard's Deployment step.

## Configuration Flow

1. **Configure:** Use the Spec Selector wizard to define your requirements
2. **Generate:** The wizard generates a configuration file
3. **Launch:** The Field Service App reads the config and adapts accordingly
4. **Edit:** Return to the wizard anytime to modify features

## Key Features

### Wizard (Spec Selector)
- Step-by-step configuration
- Real-time Bill of Materials with cost estimates
- Mobile-responsive with bottom sheet for BOM
- Edit mode for existing configurations

### Generated App (Field Service)
- **Strict Feature Enforcement:** Only configured features are shown
- **Custom Fields:** Define your own work order fields
- **Workflow States:** Add custom states between defaults
- **Multi-language:** Enable only the languages you need
- **Offline-First:** Works without network, syncs when available

## Technology Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS
- **State Management:** React Context
- **Database:** PouchDB (client), CouchDB (server)
- **Routing:** React Router
- **i18n:** i18next
- **Icons:** Lucide React
- **Animations:** Framer Motion

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.
