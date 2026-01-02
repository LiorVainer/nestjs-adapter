# nest-hex CLI Documentation

## Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Commands Reference](#commands-reference)
  - [init](#init)
  - [generate (g)](#generate-g)
- [Configuration](#configuration)
  - [nest-hex.config.ts](#nest-hexconfigts)
  - [Configuration Options](#configuration-options)
- [Templates](#templates)
  - [Template Customization](#template-customization)
  - [Available Templates](#available-templates)
- [Examples](#examples)
  - [Generate a Port](#generate-a-port)
  - [Generate an Adapter](#generate-an-adapter)
  - [Generate Port and Adapter Together](#generate-port-and-adapter-together)
  - [Generate a Service](#generate-a-service)
- [Best Practices](#best-practices)

---

## Quick Start

Get started with the nest-hex CLI in seconds:

```bash
# Initialize configuration
npx nest-hex init

# Generate a port (domain interface)
npx nest-hex generate port ObjectStorage

# Generate an adapter for the port
npx nest-hex generate adapter S3 --port ObjectStorage

# Or generate both at once
npx nest-hex generate full ObjectStorage S3

# Generate a service that uses a port
npx nest-hex generate service FileUpload
```

---

## Installation

The CLI is bundled with the `nest-hex` package:

```bash
npm install nest-hex
# or
yarn add nest-hex
# or
pnpm add nest-hex
# or
bun add nest-hex
```

Once installed, you can run commands via:

```bash
npx nest-hex <command>
# or
bunx nest-hex <command>
```

For global installation (optional):

```bash
npm install -g nest-hex
nest-hex <command>
```

---

## Commands Reference

### `init`

Creates a `nest-hex.config.ts` configuration file in your project root.

**Usage:**
```bash
npx nest-hex init [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--force` | Overwrite existing configuration file |

**Example:**
```bash
# Create configuration file
npx nest-hex init

# Overwrite existing configuration
npx nest-hex init --force
```

**Generated File:**
```typescript
// nest-hex.config.ts
import { defineConfig } from 'nest-hex/cli'

export default defineConfig({
  output: {
    portsDir: 'src/ports',
    adaptersDir: 'src/adapters',
  },
  naming: {
    portSuffix: 'PORT',
    adapterSuffix: 'Adapter',
    fileCase: 'kebab',
  },
  style: {
    indent: 'tab',
    quotes: 'single',
    semicolons: true,
  },
  templates: {
    // Optionally override default templates
    // portModule: './templates/custom-port.hbs',
  },
})
```

---

### `generate` (g)

Generate ports, adapters, services, or complete modules.

**Usage:**
```bash
npx nest-hex generate <type> <name> [options]
npx nest-hex g <type> <name> [options]
```

**Types:**

| Type | Description | Example |
|------|-------------|---------|
| `port` | Generate a port (interface + token + module) | `generate port ObjectStorage` |
| `adapter` | Generate an adapter for an existing port | `generate adapter S3 --port ObjectStorage` |
| `service` | Generate a domain service | `generate service FileUpload` |
| `full` | Generate both port and adapter together | `generate full ObjectStorage S3` |

**Options:**

| Option | Alias | Description |
|--------|-------|-------------|
| `--port <name>` | `-p` | Port name (required for `adapter` type) |
| `--output <path>` | `-o` | Custom output directory |
| `--dry-run` | | Preview files without writing |
| `--force` | `-f` | Overwrite existing files |
| `--no-lint` | | Skip linting after generation |

**Examples:**

```bash
# Generate a port
npx nest-hex generate port ObjectStorage
npx nest-hex g port PaymentGateway

# Generate an adapter
npx nest-hex generate adapter S3 --port ObjectStorage
npx nest-hex g adapter Stripe -p PaymentGateway

# Generate both port and adapter
npx nest-hex generate full ObjectStorage S3
npx nest-hex g full EmailService SendGrid

# Generate a service
npx nest-hex generate service FileUpload
npx nest-hex g service OrderProcessor

# Dry run (preview only)
npx nest-hex generate port Cache --dry-run

# Custom output directory
npx nest-hex generate adapter Redis --port Cache -o custom/path

# Force overwrite existing files
npx nest-hex generate port Storage --force
```

---

## Configuration

### nest-hex.config.ts

The configuration file controls how the CLI generates code. Create it with `npx nest-hex init`.

**Location:** `nest-hex.config.ts` (project root)

**Type-safe configuration:**
```typescript
import { defineConfig } from 'nest-hex/cli'

export default defineConfig({
  // Configuration options...
})
```

---

### Configuration Options

#### `output`

Controls where files are generated.

```typescript
output: {
  portsDir: 'src/ports',           // Where to generate ports
  adaptersDir: 'src/adapters',     // Where to generate adapters
  servicesDir: 'src/services',     // Where to generate services (optional)
}
```

**Default structure:**
```
src/
├── ports/
│   └── object-storage/
│       ├── index.ts                    # Exports
│       ├── object-storage.port.ts      # Token + interface
│       ├── object-storage.module.ts    # Port module
│       └── object-storage.service.ts   # Domain service
└── adapters/
    └── s3/
        ├── index.ts                    # Exports
        ├── s3.adapter.ts               # Adapter module
        ├── s3.service.ts               # Implementation
        └── s3.types.ts                 # Options interface
```

---

#### `naming`

Controls naming conventions for generated code.

```typescript
naming: {
  portSuffix: 'PORT',           // Port token suffix: OBJECT_STORAGE_PORT
  adapterSuffix: 'Adapter',     // Adapter class suffix: S3Adapter
  fileCase: 'kebab',            // File name case: 'kebab' | 'camel' | 'pascal'
}
```

**File case options:**

| Option | Example |
|--------|---------|
| `kebab` (default) | `object-storage.port.ts` |
| `camel` | `objectStorage.port.ts` |
| `pascal` | `ObjectStorage.port.ts` |

---

#### `style`

Controls code style in generated files.

```typescript
style: {
  indent: 'tab',       // 'tab' | 'space'
  quotes: 'single',    // 'single' | 'double'
  semicolons: true,    // true | false
  trailingComma: true, // true | false (optional)
}
```

**Examples:**

```typescript
// With indent: 'tab', quotes: 'single', semicolons: true
export const STORAGE_PORT = Symbol('STORAGE_PORT');

export interface StoragePort {
	upload(key: string, data: Buffer): Promise<string>;
}
```

```typescript
// With indent: 'space', quotes: 'double', semicolons: false
export const STORAGE_PORT = Symbol("STORAGE_PORT")

export interface StoragePort {
  upload(key: string, data: Buffer): Promise<string>
}
```

---

#### `templates`

Override default templates with custom ones.

```typescript
templates: {
  portModule: './templates/custom-port.hbs',
  adapterModule: './templates/custom-adapter.hbs',
  // ... other templates
}
```

See [Templates](#templates) section for details.

---

## Templates

The CLI uses Handlebars templates to generate code. You can customize any template.

### Template Customization

1. **Create a templates directory:**
   ```bash
   mkdir templates
   ```

2. **Copy default templates** (from `node_modules/nest-hex/dist/cli/templates/`)

3. **Modify as needed** (Handlebars syntax)

4. **Reference in config:**
   ```typescript
   templates: {
     portModule: './templates/my-port-module.hbs'
   }
   ```

---

### Available Templates

#### Port Templates

| Template | Path | Description |
|----------|------|-------------|
| Port Interface | `port/interface.hbs` | Port interface definition |
| Port Token | `port/token.hbs` | Port token symbol |
| Port Module | `port/module.hbs` | Port module class |
| Port Service | `port/service.hbs` | Domain service implementation |
| Port Index | `port/index.hbs` | Barrel export file |

#### Adapter Templates

| Template | Path | Description |
|----------|------|-------------|
| Adapter Module | `adapter/adapter.hbs` | Adapter module class |
| Adapter Service | `adapter/service.hbs` | Implementation service |
| Adapter Types | `adapter/types.hbs` | Options/config types |
| Adapter Index | `adapter/index.hbs` | Barrel export file |

#### Service Templates

| Template | Path | Description |
|----------|------|-------------|
| Injectable Service | `service/injectable-service.hbs` | Basic injectable service |

#### Example Templates

| Template | Path | Description |
|----------|------|-------------|
| Port Sync Example | `examples/port-sync.example.hbs` | Port with sync registration |
| Port Async Example | `examples/port-async.example.hbs` | Port with async registration |

---

### Template Variables

Templates have access to these variables:

**Port templates:**
```handlebars
{{name}}           - Port name (e.g., "ObjectStorage")
{{portToken}}      - Token constant name (e.g., "OBJECT_STORAGE_PORT")
{{interfaceName}}  - Interface name (e.g., "ObjectStoragePort")
{{moduleName}}     - Module class name (e.g., "ObjectStorageModule")
{{serviceName}}    - Service class name (e.g., "ObjectStorageService")
```

**Adapter templates:**
```handlebars
{{name}}              - Adapter name (e.g., "S3")
{{adapterName}}       - Adapter class name (e.g., "S3Adapter")
{{serviceName}}       - Service class name (e.g., "S3Service")
{{optionsInterface}}  - Options interface name (e.g., "S3Options")
{{portToken}}         - Port token constant (e.g., "OBJECT_STORAGE_PORT")
```

**Example custom template:**
```handlebars
// {{name}}.adapter.ts
import { Adapter } from 'nest-hex'
import { {{portToken}} } from '../../ports/{{portName}}'
import { {{serviceName}} } from './{{serviceName}}'

@Adapter({
  portToken: {{portToken}},
  implementation: {{serviceName}}
})
export class {{adapterName}} extends AdapterBase<{{optionsInterface}}> {}
```

---

## Examples

### Generate a Port

Generate a complete port with interface, token, module, and service:

```bash
npx nest-hex generate port ObjectStorage
```

**Generated files:**
```
src/ports/object-storage/
├── index.ts                    # Exports all port components
├── object-storage.port.ts      # Token + interface
├── object-storage.module.ts    # Port module
└── object-storage.service.ts   # Domain service
```

**object-storage.port.ts:**
```typescript
export const OBJECT_STORAGE_PORT = Symbol('OBJECT_STORAGE_PORT')

export interface ObjectStoragePort {
  // Define your port methods here
}
```

**object-storage.module.ts:**
```typescript
import { Module } from '@nestjs/common'
import { PortModule } from 'nest-hex'
import { ObjectStorageService } from './object-storage.service'

@Module({})
export class ObjectStorageModule extends PortModule<typeof ObjectStorageService> {}
```

---

### Generate an Adapter

Generate an adapter for an existing port:

```bash
npx nest-hex generate adapter S3 --port ObjectStorage
```

**Generated files:**
```
src/adapters/s3/
├── index.ts        # Exports
├── s3.adapter.ts   # Adapter module
├── s3.service.ts   # Implementation
└── s3.types.ts     # Options interface
```

**s3.adapter.ts:**
```typescript
import { Adapter } from 'nest-hex'
import { OBJECT_STORAGE_PORT } from '../../ports/object-storage'
import { S3Service } from './s3.service'
import type { S3Options } from './s3.types'

@Adapter({
  portToken: OBJECT_STORAGE_PORT,
  implementation: S3Service
})
export class S3Adapter extends AdapterBase<S3Options> {}
```

**s3.service.ts:**
```typescript
import { Injectable } from '@nestjs/common'
import { ObjectStoragePort } from '../../ports/object-storage'
import type { S3Options } from './s3.types'

@Injectable()
export class S3Service implements ObjectStoragePort {
  constructor(private options: S3Options) {}

  // Implement port methods here
}
```

---

### Generate Port and Adapter Together

Generate both port and adapter in one command:

```bash
npx nest-hex generate full ObjectStorage S3
```

**Generated files:**
```
src/
├── ports/object-storage/
│   ├── index.ts
│   ├── object-storage.port.ts
│   ├── object-storage.module.ts
│   └── object-storage.service.ts
└── adapters/s3/
    ├── index.ts
    ├── s3.adapter.ts
    ├── s3.service.ts
    └── s3.types.ts
```

This is equivalent to running:
```bash
npx nest-hex generate port ObjectStorage
npx nest-hex generate adapter S3 --port ObjectStorage
```

---

### Generate a Service

Generate a standalone injectable service:

```bash
npx nest-hex generate service FileUpload
```

**Generated file:**
```typescript
// src/services/file-upload.service.ts
import { Injectable } from '@nestjs/common'

@Injectable()
export class FileUploadService {
  // Service implementation
}
```

---

## Best Practices

### 1. Initialize Configuration First

Always run `init` before generating code:

```bash
npx nest-hex init
npx nest-hex generate port Storage
```

### 2. Use Descriptive Names

Choose clear, descriptive names for ports and adapters:

**Good:**
```bash
npx nest-hex g port EmailService
npx nest-hex g adapter SendGrid --port EmailService
```

**Avoid:**
```bash
npx nest-hex g port Email  # Too generic
npx nest-hex g adapter SG  # Unclear abbreviation
```

### 3. Generate Full for New Features

When starting a new feature, use `full` to scaffold everything:

```bash
npx nest-hex generate full PaymentGateway Stripe
```

Then add additional adapters:
```bash
npx nest-hex generate adapter PayPal --port PaymentGateway
npx nest-hex generate adapter Square --port PaymentGateway
```

### 4. Organize by Domain

Keep related ports and adapters organized:

```
src/
├── ports/
│   ├── storage/         # File storage ports
│   ├── email/           # Email ports
│   └── payment/         # Payment ports
└── adapters/
    ├── s3/              # S3 storage adapter
    ├── sendgrid/        # SendGrid email adapter
    └── stripe/          # Stripe payment adapter
```

### 5. Customize Templates for Your Team

Create team-specific templates for consistency:

```typescript
// nest-hex.config.ts
export default defineConfig({
  templates: {
    portModule: './templates/port.hbs',      // Team template
    adapterModule: './templates/adapter.hbs', // Team template
  },
  style: {
    indent: 'space',      // Team preference
    quotes: 'single',     // Team standard
    semicolons: true,     // Team standard
  }
})
```

### 6. Use Dry Run for Preview

Preview generated files before writing:

```bash
npx nest-hex generate port Cache --dry-run
```

### 7. Leverage Auto-Linting

Let the CLI run linters automatically (enabled by default):

```bash
# Auto-runs ESLint/Biome after generation
npx nest-hex generate port Storage

# Skip linting if needed
npx nest-hex generate port Storage --no-lint
```

### 8. Version Control Your Config

Commit `nest-hex.config.ts` to ensure team consistency:

```bash
git add nest-hex.config.ts
git commit -m "Add nest-hex configuration"
```

---

## Troubleshooting

### Port Not Found

**Error:** `Port "ObjectStorage" not found`

**Solution:** Ensure the port exists before generating an adapter:

```bash
# Generate port first
npx nest-hex generate port ObjectStorage

# Then generate adapter
npx nest-hex generate adapter S3 --port ObjectStorage
```

---

### Configuration File Missing

**Error:** `Configuration file not found`

**Solution:** Initialize the configuration:

```bash
npx nest-hex init
```

---

### Files Already Exist

**Error:** `File already exists: src/ports/storage/storage.port.ts`

**Solution:** Use `--force` to overwrite or choose a different name:

```bash
# Overwrite existing files
npx nest-hex generate port Storage --force

# Or use a different name
npx nest-hex generate port ObjectStorage
```

---

**For library documentation, see [docs/library.md](./library.md)**
