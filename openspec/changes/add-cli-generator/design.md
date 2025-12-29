# Technical Design: Interactive CLI Generator

## Context

The nest-hex library requires developers to manually create multiple files with consistent patterns when implementing the Ports & Adapters architecture. Based on the examples, a typical port requires 4 files and an adapter requires 3 files, each following specific decorator patterns and type safety conventions.

### Current Manual Process
1. Create port token file
2. Create port interface
3. Create port service with @InjectPort
4. Create port module extending PortModule
5. For each adapter: create adapter class, service implementation, and types

This manual process is repetitive, error-prone, and slows developer onboarding.

### Stakeholders
- **Library developers** - Maintain CLI alongside core library
- **Library users** - Use CLI to scaffold new modules quickly
- **Contributors** - Extend templates and add new generators

## Goals / Non-Goals

### Goals
1. **Interactive DX** - Multi-select checkboxes for choosing components to generate
2. **Flexibility** - Support both standalone CLI and NestJS CLI integration
3. **Customization** - Configuration file for project-specific preferences
4. **Best practices** - Generated code follows library conventions automatically
5. **Template-driven** - Easy to customize generated code via templates
6. **Type safety** - Generated code passes TypeScript strict mode checks
7. **Minimal dependencies** - Keep CLI bundle size reasonable

### Non-Goals
1. **Code modification** - Won't modify existing files (generate only)
2. **Database integration** - Won't generate database schemas or migrations
3. **Testing generation** - Won't auto-generate test files (may add later)
4. **Live reloading** - Won't watch for changes and regenerate

## Decisions

### 1. CLI Framework: ink + @inkjs/ui

**Decision:** Use ink (React for CLIs) with @inkjs/ui component library for interactive interface.

**Rationale:**
- Modern, component-based architecture familiar to React developers
- @inkjs/ui provides pre-built components (Select, MultiSelect, TextInput, Spinner)
- Better UX than traditional prompts (real-time rendering, better error handling)
- Type-safe with TypeScript
- Active maintenance and good ecosystem

**Alternatives considered:**
- `inquirer` - Traditional but less visual, harder to customize complex flows
- `prompts` - Lightweight but limited UI capabilities
- `clack` - Modern alternative but less mature ecosystem than ink

### 2. Command Structure: commander

**Decision:** Use `commander` for CLI argument parsing and command routing.

**Rationale:**
- Industry standard for Node.js CLIs
- Excellent flag parsing and help text generation
- Works well with ink for interactive mode
- Supports subcommands cleanly

**Alternatives considered:**
- `yargs` - More features but heavier, overkill for our needs
- `cac` - Lightweight but less ecosystem support
- Manual parsing - Reinventing the wheel

### 3. Template Engine: EJS

**Decision:** Use EJS (Embedded JavaScript) for file templates.

**Rationale:**
- Simple syntax (just JavaScript in `<% %>`)
- No learning curve for developers who know JS
- Good for code generation (preserves formatting)
- TypeScript-friendly
- Minimal runtime overhead

**Alternatives considered:**
- Handlebars - More syntax to learn, overkill for code templates
- Template literals - Hard to maintain for multi-file templates
- Mustache - Too limited for complex logic

### 4. Configuration File: TypeScript-based defineConfig

**Decision:** Use `nest-hex.config.ts` with `defineConfig()` helper (similar to Vite/Vitest pattern).

**Rationale:**
- Type-safe configuration with IntelliSense
- Familiar pattern from modern tools (Vite, Vitest, Nuxt)
- Can import and reuse types from the library
- Validation at config load time

**Example:**
```typescript
import { defineConfig } from 'nest-hex/cli'

export default defineConfig({
  output: {
    portsDir: 'src/domain/ports',
    adaptersDir: 'src/infrastructure/adapters',
  },
  naming: {
    portSuffix: 'Port',
    adapterSuffix: 'Adapter',
    fileCase: 'kebab', // 'kebab' | 'camel' | 'pascal'
  },
  style: {
    indent: 'tab', // 'tab' | 2 | 4
    quotes: 'single', // 'single' | 'double'
    semicolons: true,
  },
  templates: {
    // Optional: override default templates
    portModule: './templates/custom-port.ejs',
  }
})
```

**Alternatives considered:**
- JSON config - Not type-safe, no code reuse
- YAML config - No type safety, harder to validate
- JS config - Works but no type checking

### 5. NestJS CLI Integration: Schematic

**Decision:** Implement NestJS CLI integration using schematics API.

**Rationale:**
- Standard way to extend NestJS CLI
- Users can run `nest generate nest-hex:port storage`
- Consistent with NestJS ecosystem conventions
- Can reuse template logic from standalone CLI

**Note:** This requires publishing a separate `@nest-hex/schematics` package or including schematics in main package.

### 6. Automatic Linting Integration

**Decision:** Auto-detect and run project linters (Biome, Prettier, or package.json scripts) on generated files.

**Rationale:**
- Generated code should immediately conform to project style
- Reduces friction - users don't need manual linting step
- Provides instant feedback on code quality
- Supports multiple linter ecosystems

**Detection priority:**
1. Check for `@biomejs/biome` in package.json or `biome.json` → run `biome check --write`
2. Check for `prettier` in package.json or `.prettierrc` → run `prettier --write`
3. Check for `lint:fix` or `lint` script in package.json → prompt user to run
4. No linter found → show helpful tip about installing Biome/Prettier

**Implementation:**
```typescript
// src/cli/utils/linter-detector.ts
interface LinterConfig {
  type: 'biome' | 'prettier' | 'script' | 'none'
  command?: string
  args?: string[]
}

async function detectLinter(projectRoot: string): Promise<LinterConfig>
```

**User control:**
- `--no-lint` flag to skip linting
- Linting failures are warnings, not errors (files still generated)
- Clear progress indicators during linting

**Alternatives considered:**
- Always use Biome (library standard) - too opinionated, breaks existing projects
- Never auto-lint - poor DX, users forget to lint
- Only suggest linting - requires manual step, friction

### 7. Progress Indicators and Status Updates

**Decision:** Use ink components to show real-time progress during all operations.

**Rationale:**
- File generation can take time (template rendering, linting, file I/O)
- Users need feedback to avoid thinking CLI is frozen
- Shows professionalism and polish
- Reduces perceived wait time

**Progress types:**
1. **Spinner** - For indeterminate operations (detecting linter, loading config)
2. **Step-by-step** - For multi-file generation with checkmarks
3. **Overall progress** - "3/7 files created"
4. **Status text** - "Creating port token...", "Linting with Biome..."

**Example UX flow:**
```
┌─ Generating Port: ObjectStorage
│
├─ ✓ Created object-storage.token.ts
├─ ✓ Created object-storage.port.ts
├─ ✓ Created object-storage.service.ts
├─ ✓ Created object-storage.module.ts
│
├─ ⠋ Linting generated files with Biome...
├─ ✓ Linting passed
│
└─ ✅ Successfully generated 4 files in 1.2s
```

**Implementation:**
- Use `@inkjs/ui` Spinner and Text components
- Update status in real-time with React state
- Smooth animations, no flickering
- Estimated time for operations > 1s

**Alternatives considered:**
- No progress indicators - poor UX, feels broken
- Simple console.log - not interactive, can't update
- Progress bar - overkill for small number of files

### 8. Port Token Naming Convention

**Decision:** Generated port tokens use `_PORT` suffix instead of `_PROVIDER`.

**Rationale:**
- Aligns with "Port" terminology from Hexagonal Architecture
- More semantically accurate (port is the abstraction, provider is the DI concept)
- Clearer separation from NestJS provider terminology
- Consistent with library's architecture philosophy

**Example:**
```typescript
// Generated token (NEW convention)
export const OBJECT_STORAGE_PORT = Symbol('OBJECT_STORAGE_PORT')

// Not: OBJECT_STORAGE_PROVIDER (old)
```

**Migration note:**
Existing examples use `_PROVIDER` suffix. This is acceptable for backward compatibility, but new generated code uses `_PORT`.

### 9. Example Usage Generation

**Decision:** Optionally generate example files showing how to register and use generated ports/adapters.

**Rationale:**
- Reduces onboarding friction - users see working code immediately
- Demonstrates both sync and async registration patterns
- Shows best practices for module wiring
- Helps users understand the full picture (not just isolated files)

**Registration Types:**
1. **Sync registration** - For static configuration
   ```typescript
   ObjectStorageModule.register({
     adapter: S3Adapter.register({
       bucket: 'my-bucket',
       region: 'us-east-1',
       accessKeyId: process.env.AWS_ACCESS_KEY_ID,
       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
     })
   })
   ```

2. **Async registration** - For dynamic configuration with DI
   ```typescript
   ObjectStorageModule.register({
     adapter: S3Adapter.registerAsync({
       imports: [ConfigModule],
       inject: [ConfigService],
       useFactory: (config: ConfigService) => ({
         bucket: config.get('S3_BUCKET'),
         region: config.get('AWS_REGION'),
         accessKeyId: config.get('AWS_ACCESS_KEY_ID'),
         secretAccessKey: config.get('AWS_SECRET_ACCESS_KEY'),
       })
     })
   })
   ```

**User Flow:**
- After selecting Port or Full generation
- CLI prompts: "Generate example usage? (Y/n)"
- If yes, prompts for registration type (sync or async)
- Generates `.example.ts` file with module wiring code

**Example file includes:**
- Import statements for all generated files
- Module registration code
- Comments explaining configuration options
- Example controller showing how to inject and use the service

**Alternatives considered:**
- Always generate examples - too opinionated, clutters codebase
- Never generate examples - poor DX, users left guessing
- Generate in README - hard to maintain, not executable

### 10. Port vs Service Command Distinction

**Port Command** generates a domain capability with optional module:
- **Token file** (`object-storage.token.ts`) - Port token Symbol
- **Port interface** (`object-storage.port.ts`) - Contract definition
- **Domain service** (`object-storage.service.ts`) - Business logic that injects port via @InjectPort
- **PortModule** (`object-storage.module.ts`) - *(Optional)* Module that accepts adapter via register()

**Service Command** generates a standalone service:
- **Single service file** - Just @Injectable class with @InjectPort injection
- No module, no token, no interface
- For simple services that consume existing ports but don't define new capabilities

**When to use each:**
- Use **Port** when creating a new domain capability (e.g., "ObjectStorage", "CurrencyRates")
  - With module: Creates full feature module structure
  - Without module: Creates domain pieces to add to existing module
- Use **Service** when creating a service that uses existing ports (e.g., "FileUploadService" that injects ObjectStoragePort)

**Examples:**
```typescript
// Port command WITH module:
src/storage/
  ├── object-storage.token.ts      # Defines OBJECT_STORAGE_PORT
  ├── object-storage.port.ts       # Interface ObjectStoragePort
  ├── object-storage.service.ts    # Service with business logic
  └── object-storage.module.ts     # PortModule<typeof ObjectStorageService>

// Port command WITHOUT module:
src/storage/
  ├── object-storage.token.ts      # Defines OBJECT_STORAGE_PORT
  ├── object-storage.port.ts       # Interface ObjectStoragePort
  └── object-storage.service.ts    # Service with registration instructions in comments

// Service command generates only this:
src/uploads/
  └── file-upload.service.ts       # Service that injects OBJECT_STORAGE_PORT
```

**Module Option Rationale:**
- **With module**: Best for standalone feature modules that can be imported anywhere
- **Without module**: Best when adding to existing module or when module structure is unnecessary

### 11. Project Structure

```
src/cli/
├── bin.ts                    # CLI entry point (#!/usr/bin/env node)
├── commands/
│   ├── generate.command.ts   # Main generate command
│   ├── init.command.ts       # Config file initialization
│   └── index.ts
├── generators/
│   ├── port.generator.ts     # Port generation logic
│   ├── adapter.generator.ts  # Adapter generation logic
│   ├── service.generator.ts  # Service generation logic
│   └── base.generator.ts     # Shared generation utilities
├── templates/
│   ├── port/
│   │   ├── token.ejs         # Port token (uses _PORT suffix)
│   │   ├── interface.ejs
│   │   ├── service.ejs
│   │   └── module.ejs
│   ├── adapter/
│   │   ├── adapter.ejs
│   │   ├── service.ejs
│   │   └── types.ejs
│   ├── service/
│   │   └── injectable-service.ejs
│   └── examples/
│       ├── port-sync.example.ejs     # Sync registration example
│       └── port-async.example.ejs    # Async registration example
├── ui/
│   ├── components/
│   │   ├── ComponentSelector.tsx  # Multi-select for components
│   │   ├── PathInput.tsx          # Output path selection
│   │   ├── Summary.tsx            # Generation summary
│   │   ├── ProgressIndicator.tsx  # Spinner with status
│   │   ├── FileProgress.tsx       # Per-file progress
│   │   └── LintingProgress.tsx    # Linting status
│   └── hooks/
│       └── useConfig.ts           # Config loading hook
├── config/
│   ├── loader.ts              # Load nest-hex.config.ts
│   ├── defaults.ts            # Default configuration
│   └── validator.ts           # Config schema validation
├── utils/
│   ├── file-writer.ts         # Safe file writing with checks
│   ├── template-renderer.ts   # EJS template rendering
│   ├── name-transformer.ts    # Case transformations (kebab, pascal, etc)
│   ├── path-resolver.ts       # Path resolution utilities
│   ├── linter-detector.ts     # Detect Biome/Prettier/scripts
│   └── linter-runner.ts       # Run detected linters
└── types/
    ├── config.types.ts        # Configuration types
    ├── generator.types.ts     # Generator interfaces
    └── template.types.ts      # Template variable types
```

### 12. File Generation Flow

```
1. User runs: npx nest-hex generate
2. CLI shows multi-select: [ ] Port  [ ] Adapter  [ ] Service
3. User selects components (e.g., Port + Adapter)
4. CLI prompts for: Name, Output path (with config defaults)
5. If Port or Full selected:
   a. CLI prompts: "Include PortModule? (Y/n)" [default: Yes]
   b. If PortModule included:
      i.  CLI prompts: "Generate example usage? (Y/n)"
      ii. If yes, CLI shows radio select:
          - "Sync registration (for static config)"
          - "Async registration (for ConfigService/dynamic config)"
   c. If PortModule NOT included:
      i. Skip example generation prompts
      ii. Note: Service will include comment on how to register in existing module
6. CLI loads nest-hex.config.ts (if exists)
7. CLI detects available linter (Biome/Prettier/script)
8. Show spinner: "Preparing generation..."
9. For each selected component:
   a. Show status: "Creating port token..." (1/4 or 1/3 depending on module option)
   b. Load template (from config.templates or defaults)
   c. Prepare template variables (name, paths, imports, includeModule, registrationType)
   d. Render template with EJS
   e. Check if file exists (prompt to overwrite)
   f. Write file
   g. Show checkmark: "✓ Created object-storage.token.ts"
10. If PortModule not included:
    a. Show info: "ℹ Skipped module generation"
    b. Service file includes registration instructions in comments
11. If example usage requested (only when module included):
    a. Show status: "Creating usage example..."
    b. Load example template (sync or async based on selection)
    c. Render example with module wiring code
    d. Write example file
    e. Show checkmark: "✓ Created object-storage.example.ts"
12. Show progress: "3/3 files created" or "5/5 files created"
13. If linter detected and not --no-lint:
    a. Show spinner: "Linting generated files with Biome..."
    b. Run linter on generated files
    c. Show result: "✓ Linting passed" or "⚠ Linting warnings (see below)"
14. Show success summary with file list and total time
15. If example generated, show tip: "See object-storage.example.ts for usage"
16. If no module, show tip: "Add service to your module's providers array"
```

### 11. Port Module Option

**Decision:** Allow users to generate ports with or without PortModule.

**Rationale:**
- Flexibility for different project structures
- Some users prefer adding services directly to existing modules
- Reduces boilerplate when full module structure isn't needed
- Service file can include registration instructions when no module generated

**User Flow:**
```
CLI: "Include PortModule? (Y/n)" [default: Yes]

If Yes:
  - Generate: token, interface, service, module (4 files)
  - Prompt for example usage
  - Prompt for registration type (sync/async)

If No:
  - Generate: token, interface, service (3 files)
  - Skip example generation
  - Add comment in service file:
    "To use this service, add it to your module's providers array:
     @Module({
       providers: [ObjectStorageService],
       exports: [ObjectStorageService]
     })"
```

**Service File Template Variation:**
- **With module**: Standard service with @InjectPort
- **Without module**: Service + comment block showing how to register in existing module

**Alternatives considered:**
- Always generate module - inflexible, creates unnecessary files
- Never generate module - poor DX for users who want full module structure
- Separate commands (port-with-module, port-without-module) - too many commands

### 13. Template Variables

Each template receives these variables:

```typescript
interface TemplateContext {
  // User inputs
  name: string                    // e.g., "ObjectStorage"
  nameCamel: string              // e.g., "objectStorage"
  nameKebab: string              // e.g., "object-storage"
  namePascal: string             // e.g., "ObjectStorage"
  nameSnake: string              // e.g., "object_storage"
  nameScreamingSnake: string     // e.g., "OBJECT_STORAGE"

  // Paths (relative to output file)
  tokenImportPath: string        // e.g., "./object-storage.token"
  portImportPath: string         // e.g., "./object-storage.port"
  serviceImportPath: string      // e.g., "./object-storage.service"

  // Style preferences
  indent: string                 // "\t" or "  " or "    "
  quote: string                  // "'" or "\""
  semi: string                   // ";" or ""

  // Metadata
  timestamp: string              // ISO date
  author?: string                // From git config
}
```

## Risks / Trade-offs

### Risk: Bundle Size Increase
- **Issue:** Adding CLI dependencies (ink, commander, ejs) increases package size
- **Mitigation:** CLI deps are devDependencies, not shipped to production. Users install CLI separately or as dev dependency.
- **Trade-off:** Acceptable for DX improvement

### Risk: Template Maintenance
- **Issue:** Templates need to stay in sync with library API changes
- **Mitigation:**
  - Tests that generate code and verify it compiles
  - CI checks that validate generated code
  - Version templates alongside core library
- **Trade-off:** Small maintenance overhead worth it for DX

### Risk: Configuration Complexity
- **Issue:** Too many config options can overwhelm users
- **Mitigation:**
  - Sensible defaults that work for 90% of cases
  - Progressive disclosure (basic vs advanced options)
  - Good documentation with examples
- **Trade-off:** Power users get flexibility, beginners get simplicity

### Risk: NestJS CLI Integration Complexity
- **Issue:** Schematics API has learning curve, different from standalone CLI
- **Mitigation:**
  - Share template logic between standalone and schematic
  - Focus on standalone CLI first, add schematic later
  - Document both approaches clearly
- **Trade-off:** Can defer schematic to future iteration

## Migration Plan

N/A - This is a new feature with no breaking changes. Existing users continue using manual file creation. New users or existing users can opt-in to CLI.

### Rollout Strategy
1. **Phase 1:** Standalone CLI with basic generators (port, adapter, service)
2. **Phase 2:** Add init command and config file support
3. **Phase 3:** Add NestJS CLI integration (schematics)
4. **Phase 4:** Add template customization support

### Adoption Path
Users can adopt incrementally:
- Try CLI for new modules while keeping existing manual modules
- Gradually adopt config file for consistency
- Switch to NestJS CLI integration if preferred

## Open Questions

### 1. Should we format generated code?
- **Option A:** Use Prettier if available in project
- **Option B:** Use Biome if available (aligns with library)
- **Option C:** No formatting, rely on user's editor/pre-commit hooks
- **Recommendation:** Option B (Biome) or C (no formatting) - avoid adding Prettier dependency

### 2. Should we support JavaScript output?
- Currently library is TypeScript-only
- Users might want JS output for migration scenarios
- **Recommendation:** TypeScript only for v1, consider JS later

### 3. Should we validate port names?
- Prevent generating ports with names that conflict with NestJS/library
- **Recommendation:** Yes, basic validation (no reserved words, valid identifier)

### 4. Should CLI be in main package or separate package?
- **Option A:** Include in main `nest-hex` package (simple, one install)
- **Option B:** Separate `@nest-hex/cli` package (smaller core bundle)
- **Recommendation:** Option A initially (simpler), can split later if needed

### 5. Should we support custom adapter types?
- Users might want to generate adapters for custom patterns (e.g., gRPC, GraphQL)
- **Recommendation:** v1 supports standard HTTP/database patterns, v2 adds plugin system for custom types
