# Implementation Tasks: CLI Generator

## Phase 1: Foundation & Core Infrastructure

### 1.1 Project Setup
- [ ] 1.1.1 Add CLI dependencies to package.json (ink, @inkjs/ui, commander, ejs)
- [ ] 1.1.2 Configure package.json bin entry for `nest-hex` command
- [ ] 1.1.3 Create `src/cli/` directory structure
- [ ] 1.1.4 Set up CLI tsconfig with proper compilation targets
- [ ] 1.1.5 Add CLI build script to package.json

### 1.2 Core Type Definitions
- [ ] 1.2.1 Create `src/cli/types/config.types.ts` with ConfigSchema interface
- [ ] 1.2.2 Create `src/cli/types/generator.types.ts` with Generator interfaces
- [ ] 1.2.3 Create `src/cli/types/template.types.ts` with TemplateContext interface
- [ ] 1.2.4 Export types from `src/cli/types/index.ts`

### 1.3 Configuration System
- [ ] 1.3.1 Create `src/cli/config/defaults.ts` with default configuration
- [ ] 1.3.2 Create `src/cli/config/loader.ts` to load nest-hex.config.ts
- [ ] 1.3.3 Create `src/cli/config/validator.ts` for config validation
- [ ] 1.3.4 Create `src/cli/config/define-config.ts` with defineConfig() helper
- [ ] 1.3.5 Test config loading with various configurations

### 1.4 Utility Modules
- [ ] 1.4.1 Create `src/cli/utils/name-transformer.ts` (kebab, pascal, camel, snake cases)
- [ ] 1.4.2 Create `src/cli/utils/path-resolver.ts` for path handling
- [ ] 1.4.3 Create `src/cli/utils/file-writer.ts` with conflict detection
- [ ] 1.4.4 Create `src/cli/utils/template-renderer.ts` for EJS rendering
- [ ] 1.4.5 Create `src/cli/utils/linter-detector.ts` for detecting Biome/Prettier/lint scripts
- [ ] 1.4.6 Create `src/cli/utils/linter-runner.ts` for running detected linters
- [ ] 1.4.7 Add unit tests for all utility functions

## Phase 2: Template System

### 2.1 Port Templates
- [ ] 2.1.1 Create `src/cli/templates/port/token.ejs` template (use PORT suffix, not PROVIDER)
- [ ] 2.1.2 Create `src/cli/templates/port/interface.ejs` template
- [ ] 2.1.3 Create `src/cli/templates/port/service.ejs` template
- [ ] 2.1.4 Add template variation for service with registration instructions (no module)
- [ ] 2.1.5 Create `src/cli/templates/port/module.ejs` template (conditional)
- [ ] 2.1.6 Verify templates generate code matching library conventions

### 2.2 Adapter Templates
- [ ] 2.2.1 Create `src/cli/templates/adapter/adapter.ejs` template
- [ ] 2.2.2 Create `src/cli/templates/adapter/service.ejs` template
- [ ] 2.2.3 Create `src/cli/templates/adapter/types.ejs` template
- [ ] 2.2.4 Verify templates generate code matching examples/storage/adapters/s3/

### 2.3 Service Templates
- [ ] 2.3.1 Create `src/cli/templates/service/injectable-service.ejs` template
- [ ] 2.3.2 Add variant for service with @InjectPort
- [ ] 2.3.3 Add variant for service without port injection

### 2.4 Example Usage Templates
- [ ] 2.4.1 Create `src/cli/templates/examples/port-sync.example.ejs` template
- [ ] 2.4.2 Include module registration with Adapter.register() pattern
- [ ] 2.4.3 Include example controller showing service injection and usage
- [ ] 2.4.4 Create `src/cli/templates/examples/port-async.example.ejs` template
- [ ] 2.4.5 Include ConfigModule integration and registerAsync pattern
- [ ] 2.4.6 Include environment variable usage examples
- [ ] 2.4.7 Add comments explaining sync vs async trade-offs

### 2.5 Template Testing
- [ ] 2.5.1 Create test suite that renders all templates (including examples)
- [ ] 2.5.2 Verify rendered code compiles with tsc
- [ ] 2.5.3 Verify rendered code passes Biome checks
- [ ] 2.5.4 Verify example templates demonstrate correct registration patterns
- [ ] 2.5.5 Add snapshot tests for template outputs

## Phase 3: Core Generators

### 3.1 Base Generator
- [ ] 3.1.1 Create `src/cli/generators/base.generator.ts` abstract class
- [ ] 3.1.2 Implement template loading logic
- [ ] 3.1.3 Implement file writing with conflict detection
- [ ] 3.1.4 Implement dry-run mode support
- [ ] 3.1.5 Add progress tracking and status updates
- [ ] 3.1.6 Integrate linter detection and execution after file generation
- [ ] 3.1.7 Add error handling and logging

### 3.2 Port Generator
- [ ] 3.2.1 Create `src/cli/generators/port.generator.ts`
- [ ] 3.2.2 Implement port name validation
- [ ] 3.2.3 Implement module inclusion prompt ("Include PortModule? Y/n")
- [ ] 3.2.4 Implement multi-file generation (token, interface, service, optional module)
- [ ] 3.2.5 Add example generation option (only when module included)
- [ ] 3.2.6 Add registration type selection (sync/async) when module included
- [ ] 3.2.7 Handle custom output directories from config
- [ ] 3.2.8 Add integration tests for port generation with module
- [ ] 3.2.9 Add integration tests for port generation without module
- [ ] 3.2.10 Test example generation for both sync and async patterns

### 3.3 Adapter Generator
- [ ] 3.3.1 Create `src/cli/generators/adapter.generator.ts`
- [ ] 3.3.2 Implement adapter name validation
- [ ] 3.3.3 Implement port detection/selection logic
- [ ] 3.3.4 Generate adapter files with correct imports
- [ ] 3.3.5 Add integration tests for adapter generation

### 3.4 Service Generator
- [ ] 3.4.1 Create `src/cli/generators/service.generator.ts`
- [ ] 3.4.2 Implement service with/without port injection
- [ ] 3.4.3 Handle port token imports
- [ ] 3.4.4 Add integration tests for service generation

## Phase 4: Interactive UI (ink)

### 4.1 UI Components
- [ ] 4.1.1 Create `src/cli/ui/components/ComponentSelector.tsx` (multi-select)
- [ ] 4.1.2 Create `src/cli/ui/components/PathInput.tsx` for output paths
- [ ] 4.1.3 Create `src/cli/ui/components/ModuleConfirmation.tsx` (Include PortModule? Y/n)
- [ ] 4.1.4 Create `src/cli/ui/components/RegistrationTypeSelect.tsx` (sync/async radio)
- [ ] 4.1.5 Create `src/cli/ui/components/Summary.tsx` for generation summary
- [ ] 4.1.6 Create `src/cli/ui/components/ProgressIndicator.tsx` (spinner with status text)
- [ ] 4.1.7 Create `src/cli/ui/components/FileProgress.tsx` (per-file progress display)
- [ ] 4.1.8 Create `src/cli/ui/components/LintingProgress.tsx` (linting status display)

### 4.2 UI Hooks
- [ ] 4.2.1 Create `src/cli/ui/hooks/useConfig.ts` for config loading
- [ ] 4.2.2 Create `src/cli/ui/hooks/useGeneration.ts` for generation state
- [ ] 4.2.3 Test hooks in isolation

### 4.3 Interactive Flows
- [ ] 4.3.1 Implement multi-select flow for component selection
- [ ] 4.3.2 Implement name input with validation
- [ ] 4.3.3 Implement "Include PortModule?" confirmation prompt (for Port generation)
- [ ] 4.3.4 Implement "Generate example?" confirmation prompt (only if module included)
- [ ] 4.3.5 Implement registration type selection (sync/async) with descriptions
- [ ] 4.3.6 Implement path selection with config defaults
- [ ] 4.3.7 Implement conditional flow logic (skip example if no module)
- [ ] 4.3.8 Implement confirmation screen before generation
- [ ] 4.3.9 Implement success/error screens with appropriate tips (module vs no-module)

## Phase 5: CLI Commands

### 5.1 Command Infrastructure
- [ ] 5.1.1 Create `src/cli/bin.ts` entry point with shebang
- [ ] 5.1.2 Set up commander program with version and description
- [ ] 5.1.3 Add global options: --help, --version, --config, --no-interactive
- [ ] 5.1.4 Set up error handling and exit codes

### 5.2 Init Command
- [ ] 5.2.1 Create `src/cli/commands/init.command.ts`
- [ ] 5.2.2 Implement config file generation with defineConfig()
- [ ] 5.2.3 Add template for nest-hex.config.ts with comments
- [ ] 5.2.4 Handle existing config file (prompt to overwrite)
- [ ] 5.2.5 Test init command

### 5.3 Generate Command
- [ ] 5.3.1 Create `src/cli/commands/generate.command.ts`
- [ ] 5.3.2 Add subcommands: port, adapter, service, full
- [ ] 5.3.3 Implement flag parsing: --force, --dry-run, --port, --no-interactive
- [ ] 5.3.4 Wire up generators to commands
- [ ] 5.3.5 Add command validation and help text

### 5.4 Interactive Mode
- [ ] 5.4.1 Integrate ink UI with generate command
- [ ] 5.4.2 Show multi-select when no subcommand provided
- [ ] 5.4.3 Show prompts for missing required arguments
- [ ] 5.4.4 Respect --no-interactive flag
- [ ] 5.4.5 Test interactive flows end-to-end

## Phase 6: Testing & Validation

### 6.1 Unit Tests
- [ ] 6.1.1 Test name-transformer utility (all case transformations)
- [ ] 6.1.2 Test path-resolver utility (cross-platform paths)
- [ ] 6.1.3 Test file-writer utility (conflict detection, permissions)
- [ ] 6.1.4 Test template-renderer utility (variable injection)
- [ ] 6.1.5 Test linter-detector utility (Biome, Prettier, package.json scripts)
- [ ] 6.1.6 Test linter-runner utility (execution and error handling)
- [ ] 6.1.7 Test config loader and validator

### 6.2 Integration Tests
- [ ] 6.2.1 Test port generation end-to-end (creates 4 files, compiles)
- [ ] 6.2.2 Test adapter generation end-to-end (creates 3 files, imports correct)
- [ ] 6.2.3 Test service generation with @InjectPort
- [ ] 6.2.4 Test full generation (port + adapter)
- [ ] 6.2.5 Test config file initialization
- [ ] 6.2.6 Test auto-linting with Biome in project
- [ ] 6.2.7 Test auto-linting with Prettier in project
- [ ] 6.2.8 Test linting with package.json lint script
- [ ] 6.2.9 Test generation without linter (graceful fallback)
- [ ] 6.2.10 Test --no-lint flag to skip linting

### 6.3 Generated Code Validation
- [ ] 6.3.1 Verify generated code compiles with tsc --noEmit
- [ ] 6.3.2 Verify generated code passes isolatedDeclarations check
- [ ] 6.3.3 Verify generated code passes Biome lint (if auto-linting works)
- [ ] 6.3.4 Verify generated tokens use PORT suffix (not PROVIDER)
- [ ] 6.3.5 Add CI check that runs generation + validation
- [ ] 6.3.6 Test generated code follows library conventions

### 6.4 Cross-Platform Testing
- [ ] 6.4.1 Test CLI on Windows (paths, line endings)
- [ ] 6.4.2 Test CLI on macOS (paths, permissions)
- [ ] 6.4.3 Test CLI on Linux (paths, permissions)
- [ ] 6.4.4 Ensure consistent behavior across platforms

## Phase 7: NestJS CLI Integration (Optional - Can be deferred)

### 7.1 Schematics Setup
- [ ] 7.1.1 Create schematics directory structure
- [ ] 7.1.2 Create collection.json for NestJS CLI
- [ ] 7.1.3 Create schematic wrappers for generators

### 7.2 Schematic Implementation
- [ ] 7.2.1 Implement port schematic
- [ ] 7.2.2 Implement adapter schematic
- [ ] 7.2.3 Implement service schematic
- [ ] 7.2.4 Test schematics with `nest generate`

## Phase 8: Documentation & Polish

### 8.1 CLI Documentation
- [ ] 8.1.1 Add comprehensive help text to all commands
- [ ] 8.1.2 Add usage examples to --help output
- [ ] 8.1.3 Create CLI documentation in README or docs/
- [ ] 8.1.4 Add troubleshooting section

### 8.2 Configuration Documentation
- [ ] 8.2.1 Document all config options with JSDoc
- [ ] 8.2.2 Create example configurations for common use cases
- [ ] 8.2.3 Add config validation error messages
- [ ] 8.2.4 Document template customization

### 8.3 Examples & Recipes
- [ ] 8.3.1 Add example: Generate basic port and adapter
- [ ] 8.3.2 Add example: Custom output directories
- [ ] 8.3.3 Add example: Custom templates
- [ ] 8.3.4 Add example: Generate full stack (port + multiple adapters)

### 8.4 Error Messages
- [ ] 8.4.1 Review all error messages for clarity
- [ ] 8.4.2 Add actionable suggestions to errors
- [ ] 8.4.3 Add error codes for programmatic handling
- [ ] 8.4.4 Add helpful messages for linting failures
- [ ] 8.4.5 Test error paths thoroughly

### 8.5 Progress and UX Polish
- [ ] 8.5.1 Ensure all operations show progress indicators
- [ ] 8.5.2 Add estimated time for long operations
- [ ] 8.5.3 Ensure smooth, flicker-free UI updates
- [ ] 8.5.4 Add success animations/checkmarks for completed steps
- [ ] 8.5.5 Test UX with various generation scenarios

## Phase 9: Release Preparation

### 9.1 Package Configuration
- [ ] 9.1.1 Update package.json exports for CLI
- [ ] 9.1.2 Ensure bin entry is correct
- [ ] 9.1.3 Add CLI dependencies to package.json
- [ ] 9.1.4 Test installation from npm pack

### 9.2 Build & Distribution
- [ ] 9.2.1 Ensure CLI builds with bunup
- [ ] 9.2.2 Test executable permissions on Unix
- [ ] 9.2.3 Test npx invocation
- [ ] 9.2.4 Verify binary size is reasonable

### 9.3 CI/CD Updates
- [ ] 9.3.1 Add CLI tests to CI pipeline
- [ ] 9.3.2 Add generated code validation to CI
- [ ] 9.3.3 Add cross-platform tests to CI
- [ ] 9.3.4 Update release script if needed

### 9.4 Final Validation
- [ ] 9.4.1 Run full test suite
- [ ] 9.4.2 Run `bun run lint && bun run type-check`
- [ ] 9.4.3 Run `npx vibechck .` for quality checks
- [ ] 9.4.4 Test CLI in clean project from scratch
- [ ] 9.4.5 Update CHANGELOG with CLI features

## Dependencies & Sequencing

- **Parallel Work**: Phases 2 (Templates) and 4 (UI) can be developed in parallel with Phase 3 (Generators)
- **Sequential**: Phase 5 (Commands) depends on Phases 2, 3, and 4 being complete
- **Optional**: Phase 7 (NestJS Integration) can be deferred to future release
- **Blocking**: Phase 9 (Release) requires all other phases except Phase 7 to be complete

## Success Criteria

- [ ] User can run `npx nest-hex generate` and generate working port/adapter code
- [ ] Generated code compiles without errors (tsc, Biome)
- [ ] Generated code matches examples in structure and style
- [ ] CLI provides helpful error messages and validation
- [ ] Configuration system works and is well-documented
- [ ] All tests pass (unit, integration, cross-platform)
- [ ] Documentation is complete and accurate
