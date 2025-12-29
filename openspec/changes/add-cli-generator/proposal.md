# Change: Add Interactive CLI Generator for Nest-Hex Modules

## Why

Developers currently need to manually create multiple files with significant boilerplate when setting up ports and adapters. This includes:
- Port definitions (token, interface, service, module) - typically 4 files
- Adapter implementations (adapter, service, types) - typically 3 files
- Correct decorator usage and type safety patterns

Manual file creation is error-prone, time-consuming, and creates inconsistent code styles across projects. A CLI generator would automate this process, ensure best practices, and dramatically improve developer experience.

## What Changes

- **New CLI tool** in `src/cli/` with interactive multi-select UI built using ink and @inkjs/ui
- **Multiple generator commands**:
  - `generate port` - Create complete port module (token, interface, service, module)
  - `generate adapter` - Create adapter implementation for existing port
  - `generate service` - Create service with @InjectPort usage
  - `generate full` - Generate both port and adapter together
  - `init` - Create nest-hex.config.ts configuration file
- **Interactive multi-select mode** - Users can select which components to generate via checkboxes
- **Real-time progress indicators** - Show spinners, checkmarks, and status updates during generation (e.g., "Creating port token...", "Linting files...")
- **Automatic linting** - Auto-detect and run project linters (Biome, Prettier, or package.json scripts) on generated files
- **Configuration system** - `defineConfig` helper for customizing output directories, naming conventions, code style, and templates
- **Dual distribution** - Support both standalone CLI (`npx nest-hex`) and NestJS CLI integration (`nest generate nest-hex:port`)
- **Template system** - Customizable templates for all generated files with sensible defaults
- **Port token naming** - Generated tokens use `_PORT` suffix (not `_PROVIDER`) for better semantic clarity

## Impact

### New Capabilities
- `cli-generator` spec - Complete CLI generation system

### Affected Code
- New directory: `src/cli/` - CLI implementation
  - `src/cli/commands/` - Individual command implementations
  - `src/cli/templates/` - Default file templates
  - `src/cli/config/` - Configuration management
  - `src/cli/ui/` - Interactive UI components (ink/inkjs)
  - `src/cli/utils/` - Helper utilities (file writers, validators)
  - `src/cli/bin.ts` - CLI entry point
- New file: `src/cli/types/config.types.ts` - Configuration type definitions
- Modified: `package.json` - Add bin entry, CLI dependencies
- New files: Templates for ports, adapters, services

### Dependencies Added
- `ink` - React-like CLI rendering
- `@inkjs/ui` - UI components for ink
- `commander` - CLI argument parsing
- `chalk` - Terminal colors (if not provided by @inkjs/ui)
- `inquirer` or ink-based prompts - Interactive prompts
- `ejs` or `handlebars` - Template rendering
- `prettier` (optional) - Code formatting for generated files

### User-Facing Changes
1. New CLI commands available after installation
2. Interactive workflow with multi-select component picker
3. Real-time progress feedback (spinners, checkmarks, status messages)
4. Automatic code formatting using project's linter (Biome/Prettier/script)
5. Configuration file support for project-level customization
6. Consistent, best-practice code generation with PORT naming convention
7. Faster onboarding for new developers using nest-hex

### Breaking Changes
**None** - This is a purely additive feature that doesn't affect existing library functionality.
