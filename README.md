<div align="center">

![ai-paths](/web/default/public/ai-paths-logo.svg)

# ai-paths

**AI Interface Aggregation and Gateway Management Platform**

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#frontend">Frontend</a> •
  <a href="#license-and-attribution">License</a>
</p>

</div>

## Project Overview

`ai-paths` is an AI gateway and operations platform for:

- multi-provider model routing
- channel and token management
- usage analytics and operational dashboards
- organization-level quota and billing workflows
- private deployment and internal AI platform scenarios

The default frontend in [`web/default`](C:/code/proxyapi/new-api/web/default) has been visually rebuilt in an `animal-island-ui` inspired style while preserving the original feature set.

## Important Notice

> This project is intended only for lawful, authorized, and compliant AI gateway usage.

- You are responsible for obtaining valid upstream API keys, accounts, model access, and service permissions.
- You must comply with upstream provider terms, local laws, and any regulatory requirements that apply to your deployment.
- If you expose generative AI capabilities publicly, you are responsible for filing, licensing, content safety, audit logging, payment, and tax obligations in your jurisdiction.

## Features

- Unified AI gateway for multiple upstream model providers
- Channel CRUD, grouping, weights, failover, and routing controls
- API key issuance and management
- User management, authentication, and access control
- Usage statistics, dashboards, and operational visibility
- Billing-related settings, recharge workflows, and quota accounting
- Multi-language interface support
- Private deployment friendly architecture

## Frontend

This repository currently includes multiple web surfaces. The redesign work in this delivery targets:

- [`web/default`](C:/code/proxyapi/new-api/web/default)

Highlights of the updated default frontend:

- `ai-paths` branding and default assets
- `animal-island-ui` inspired visual language
- warmer background palette and mint-accented controls
- larger radii, softer shadows, and more playful card surfaces
- updated public pages, auth pages, shared UI components, and dashboard shell

## Quick Start

### Docker Compose

```bash
git clone https://github.com/QuantumNous/new-api.git
cd new-api

# edit your deployment config first
docker-compose up -d
```

### Docker

```bash
docker pull calciumion/new-api:latest

docker run --name new-api -d --restart always \
  -p 3000:3000 \
  -e TZ=Asia/Shanghai \
  -v ./data:/data \
  calciumion/new-api:latest
```

### After Startup

Open:

```text
http://localhost:3000
```

## Deployment

Typical deployment options:

- SQLite for simple single-instance setups
- MySQL or PostgreSQL for more persistent multi-user setups
- Redis for cache and distributed scenarios
- Docker / Docker Compose for containerized deployment

Common environment concerns:

- `SESSION_SECRET` is required for consistent multi-instance login state.
- `CRYPTO_SECRET` is required when shared encrypted data is used across instances.
- Mount `/data` when using SQLite in containers.

## Repository Notes

- Backend API contracts remain unchanged by the frontend redesign.
- The default frontend respects runtime system branding from server status when configured.
- The redesigned default frontend also includes its own README at [`web/default/README.md`](C:/code/proxyapi/new-api/web/default/README.md).

## Related Projects

- [One API](https://github.com/songquanpeng/one-api)
- [Midjourney-Proxy](https://github.com/novicezk/midjourney-proxy)
- [new-api-key-tool](https://github.com/Calcium-Ion/new-api-key-tool)

## License And Attribution

This repository remains licensed under the [GNU Affero General Public License v3.0](./LICENSE).

Additional terms under AGPLv3 Section 7 still apply:

- Modified versions must preserve the author attribution notice `Frontend design and development by New API contributors.`
- Modified versions that present a user interface must also preserve a visible link to the original project: [https://github.com/QuantumNous/new-api](https://github.com/QuantumNous/new-api)

This project is based on [One API](https://github.com/songquanpeng/one-api).

If your organization cannot use AGPLv3 software or you need a different licensing path, contact: [support@quantumnous.com](mailto:support@quantumnous.com)
