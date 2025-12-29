# Project Context

## Purpose

`nest-hex` is a tiny, class-based, NestJS-native helper library for building **pluggable adapters** using the **Ports & Adapters (Hexagonal Architecture)** pattern with exceptional developer experience and strong type safety.

**Goals:**
- Eliminate boilerplate when creating NestJS adapter modules
- Provide declarative, type-safe configuration (declare tokens once, not repeatedly)
- Enforce best practices: app-owned configuration, proper token exports, class-based modules
- Enable easy adapter swapping for testing and multi-environment deployment
- Support both synchronous (`register()`) and asynchronous (`registerAsync()`) configuration

**Current Status:** Early development. The codebase has placeholder code that will be replaced with the actual implementation defined in `spec/spec.md`.

## Tech Stack

### Core Technologies
- **TypeScript 5.9+** - Strict mode with isolated declarations
- **NestJS** - Framework for adapter implementation (peer dependency)
- **Bun** - Runtime and package manager

### Build & Development Tools
- **bunup** - Library bundler for TypeScript packages
- **Biome** - Fast linter and formatter (replaces ESLint + Prettier)
- **simple-git-hooks** - Git hooks for pre-commit checks
- **bumpp** - Version management and release automation

### Testing
- **Bun test** - Built-in test runner with coverage support

### Target Compatibility
- ES2023 target
- Module preservation mode (modern ESM)
- Bundler module resolution

## Project Conventions

### Code Style

**Editor Configuration:**
- **Indentation:** Tabs (enforced via `.editorconfig`)
- **Line endings:** LF
- **Charset:** UTF-8

**TypeScript Style (Biome enforced):**
- Single quotes for strings
- Semicolons as needed (minimal; auto-managed by Biome)
- Auto-organized imports on save
- Recommended Biome rules enabled with VCS integration

**Naming Conventions:**
- Tokens: `SCREAMING_SNAKE_CASE` with `Symbol()` preferred (e.g., `OBJECT_STORAGE_PROVIDER`)
- Classes: `PascalCase` (e.g., `ObjectStorageService`, `S3ObjectStorageAdapter`)
- Files: `kebab-case.ts` or `feature-name.type.ts` pattern
- Interfaces: `PascalCase` without `I` prefix (e.g., `ObjectStoragePort`)

### Architecture Patterns

**Hexagonal Architecture (Ports & Adapters):**
- **Ports:** Domain interfaces represented by dependency injection tokens
- **Adapters:** Infrastructure implementations (AWS S3, HTTP APIs, databases) that provide ports
- **Feature Modules:** Domain services that consume ports without knowing about adapters

**Key Architectural Principles:**
1. **Decorator-Driven Configuration:** Declare adapter metadata using `@AdapterToken()` and `@AdapterImpl()` decorators
2. **Class-based Modules:** Use NestJS class-based dynamic modules, not function factories
3. **App-owned Configuration:** Never use `process.env` in library code; apps provide configuration
4. **Single Responsibility:** Adapters handle infrastructure only; domain logic lives in feature modules
5. **Token-based DI:** Always export provider tokens, never export provider objects directly
6. **Compile-time Type Safety:** Use `defineAdapter<TToken, TOptions>()` helper to enforce type contracts

**Type Safety Pattern:**
- `AdapterModule<TToken>` carries compile-time proof via `__provides` field
- Feature modules accept `AdapterModule<TToken>` to ensure type compatibility
- `defineAdapter()` helper verifies adapter contract at compile time (zero runtime cost)
- `@InjectPort()` decorator provides clean DX for injecting port tokens
- Structural typing ensures adapters match expected ports

### Testing Strategy

**Test Framework:** Bun's built-in test runner

**Testing Patterns:**
- **Unit tests:** Test adapter implementations and feature modules in isolation
- **Mock adapters:** Create test adapters extending `Adapter.forToken()` for easy mocking
- **Token overrides:** Use `.overridePort(TOKEN).useValue(mock)` in Nest testing modules
- **Type tests:** Verify compile-time type safety for adapter/feature module compatibility

**Coverage Requirements:**
- Run `bun test --coverage` to generate coverage reports
- Focus on adapter implementation logic and feature module business logic

**Testing Commands:**
```bash
bun test              # Run all tests
bun test --watch      # Watch mode
bun test --coverage   # With coverage report
```

### Git Workflow

**Pre-commit Hooks:**
1. `bun run lint` - Biome code style checks
2. `bun run type-check` - TypeScript compilation verification

**Branching Strategy:**
- `main` - Production-ready code
- Feature branches for development

**Commit Conventions:**
- Follow conventional commit format (managed by bumpp for releases)
- Clear, descriptive commit messages

**Release Process:**
```bash
bun run release  # Bumps version, commits, tags, and pushes
```

## Domain Context

### Ports & Adapters Pattern in NestJS

**Port:** A domain interface (e.g., "object storage") represented by a DI token. Example:
```typescript
export const OBJECT_STORAGE_PROVIDER = Symbol('OBJECT_STORAGE_PROVIDER');
export interface ObjectStoragePort {
  putObject(...): Promise<...>;
  getSignedGetUrl(...): Promise<...>;
}
```

**Adapter:** An infrastructure implementation providing the port token. Examples:
- S3 adapter implementing object storage
- HTTP adapter implementing currency rates API
- LocalStorage adapter for testing/development

**Feature Module:** A domain service consuming the port. Example:
```typescript
import { InjectPort } from 'nest-hex';

@Injectable()
class ObjectStorageService {
  constructor(@InjectPort(OBJECT_STORAGE_PROVIDER) private storage: ObjectStoragePort) {}
}
```

### Library Design Philosophy

**DX-first approach:**
- Minimize boilerplate through base classes and decorators
- Declarative intent with `@AdapterToken()` and `@AdapterImpl()` decorators
- Compile-time type safety with `defineAdapter<TToken, TOptions>()` helper
- Clean dependency injection with `@InjectPort()` decorator
- Automatic provider registration and aliasing
- Clear separation of concerns

**Type safety guarantees:**
- `AdapterModule<TToken>` proves which token an adapter provides at compile time
- `defineAdapter()` enforces correct `register()` and `registerAsync()` signatures
- Feature modules require compatible adapters at compile time
- No runtime token mismatches
- Zero runtime overhead for type safety (decorators + helper erased after compilation)

## Important Constraints

### TypeScript Constraints
- **Strict mode enabled:** All strict TypeScript checks enforced
- **Isolated declarations:** Each module must be independently type-checkable (`isolatedDeclarations: true`)
- **Minimize `as` casts:** Avoid type assertions where possible
- **Avoid `any`:** Use proper types or `unknown` when type is truly unknown
- **Must run `tsc` after changes:** Verify no TypeScript errors after code modifications

### NestJS Constraints
- **Peer dependency model:** NestJS packages are peer dependencies (apps control versions)
- **Dynamic modules only:** Adapters must return `DynamicModule`, not static `@Module()` classes
- **Token exports:** Always export tokens, never provider objects
- **No global state:** Avoid singletons or global configuration

### Build Constraints
- **ES2023 target:** Modern JavaScript features
- **ESM only:** No CommonJS support (`type: "module"`)
- **Bundler resolution:** Uses bundler-style module resolution

## External Dependencies

### Peer Dependencies (Required)
These are expected to be provided by consuming applications:
- `@nestjs/common` - Core NestJS framework
- `@nestjs/core` - NestJS dependency injection
- `reflect-metadata` - **Critical:** Required for decorator metadata (`@AdapterToken`, `@AdapterImpl`, `@InjectPort`)
- `typescript` ≥4.5.0 (optional peer dependency)

### Optional Peer Dependencies (Examples only)
Not included in core library, but shown in examples:
- `@nestjs/axios` - HTTP client module (for HTTP adapter examples)
- `@nestjs/config` - Configuration management (for app-level config)
- `@aws-sdk/client-s3` - AWS S3 client (for S3 adapter examples)
- `@aws-sdk/s3-request-presigner` - S3 URL signing (for S3 adapter examples)
- `rxjs` - Reactive programming library (required by @nestjs/axios)

### Development Dependencies
- `bunup` - Library bundler
- `@biomejs/biome` - Linter and formatter
- `bumpp` - Version management
- `simple-git-hooks` - Git hooks
- `typescript` - TypeScript compiler

### No Runtime Dependencies
The core library has **zero runtime dependencies** to keep the bundle minimal and avoid version conflicts.
