# n8n Polish Nodes

[![CI](https://github.com/michalploneczka/n8n-polish-nodes/actions/workflows/ci.yml/badge.svg)](https://github.com/michalploneczka/n8n-polish-nodes/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Collection of [n8n](https://n8n.io) community nodes for Polish services. Each node is a standalone npm package that can be installed independently.

## Available Nodes

| Node | Service | npm Package | Status |
|------|---------|-------------|--------|
| SMSAPI | [smsapi.pl](https://www.smsapi.pl) | `n8n-nodes-smsapi` | In Development |
| CEIDG | [dane.biznes.gov.pl](https://dane.biznes.gov.pl) | `n8n-nodes-ceidg` | In Development |
| Fakturownia | [fakturownia.pl](https://fakturownia.pl) | `n8n-nodes-fakturownia` | Planned |
| InPost | [inpost.pl](https://inpost.pl) | `n8n-nodes-inpost` | Planned |
| Przelewy24 | [przelewy24.pl](https://www.przelewy24.pl) | `n8n-nodes-przelewy24` | Planned |
| BaseLinker | [baselinker.com](https://baselinker.com) | `n8n-nodes-baselinker` | Planned |
| Shoper | [shoper.pl](https://www.shoper.pl) | `n8n-nodes-shoper` | Planned |
| wFirma | [wfirma.pl](https://wfirma.pl) | `n8n-nodes-wfirma` | Planned |
| iFirma | [ifirma.pl](https://www.ifirma.pl) | `n8n-nodes-ifirma` | Planned |
| Allegro | [allegro.pl](https://allegro.pl) | `n8n-nodes-allegro` | Planned |
| GUS REGON | [api.stat.gov.pl](https://api.stat.gov.pl) | `n8n-nodes-gus-regon` | Planned |

## Installation

Install individual nodes in your n8n instance:

```bash
# In your n8n custom nodes directory
cd ~/.n8n/custom
npm install n8n-nodes-smsapi
```

Or install via the n8n Community Nodes UI: **Settings > Community Nodes > Install**.

## Development

### Prerequisites

- [Node.js](https://nodejs.org) 18 or 20
- [pnpm](https://pnpm.io) 9+

### Setup

```bash
git clone https://github.com/michalploneczka/n8n-polish-nodes.git
cd n8n-polish-nodes
pnpm install
```

### Build

```bash
# Build all packages
pnpm run build:all

# Build a specific package
pnpm --filter n8n-nodes-smsapi run build
```

### Test

```bash
# Run all tests
pnpm run test:all

# Test a specific package
pnpm --filter n8n-nodes-smsapi run test
```

### Lint

```bash
# Lint all packages
pnpm run lint:all
```

### Local Development with n8n (Docker)

Use the included script to build, pack, and hot-reload nodes into a running n8n Docker container:

```bash
# Install all packages into the running n8n container (default container name: n8n)
./scripts/dev-install.sh

# Install a single package
./scripts/dev-install.sh ceidg
./scripts/dev-install.sh smsapi

# Custom container name
CONTAINER=my-n8n ./scripts/dev-install.sh
```

The script builds all packages, packs them as tarballs, installs them inside the container's custom nodes directory, and restarts n8n. Run it after every code change.

**docker-compose.yml** is included for quick local setup:

```bash
docker compose up -d
./scripts/dev-install.sh
# Open http://localhost:5678
```

### Local Development without Docker

```bash
cd packages/n8n-nodes-smsapi
pnpm run build
npm link
cd ~/.n8n/custom
npm link n8n-nodes-smsapi
npx n8n start
```

## Publishing

Packages are published automatically via GitHub Actions when a version tag is pushed:

```bash
git tag n8n-nodes-smsapi@1.0.0
git push --tags
```

All packages are published with [npm provenance](https://docs.npmjs.com/generating-provenance-statements) attestation.

See [PUBLISHING.md](docs/PUBLISHING.md) for detailed instructions.

## Contributing

Contributions are welcome! Please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-node`)
3. Make your changes
4. Run tests (`pnpm run test:all`)
5. Run lint (`pnpm run lint:all`)
6. Submit a pull request

## License

[MIT](LICENSE)

## Author

**Michal Ploneczka** - [codersgroup.pl](https://codersgroup.pl)
