# CLI Generator Capability

## ADDED Requirements

### Requirement: Interactive Component Selection

The CLI SHALL provide an interactive multi-select interface for users to choose which components to generate and configure registration options.

#### Scenario: User selects multiple components
- **WHEN** user runs `npx nest-hex generate` without flags
- **THEN** CLI displays multi-select checkboxes for: Port, Adapter, Service, Full
- **AND** user can toggle selections with spacebar
- **AND** user confirms with enter key

#### Scenario: User selects only port
- **WHEN** user selects only "Port" from multi-select
- **THEN** CLI prompts for port name
- **AND** CLI generates 4 files: token, interface, service, module
- **AND** CLI shows success message with file paths

#### Scenario: User selects port and adapter
- **WHEN** user selects both "Port" and "Adapter"
- **THEN** CLI prompts for port name first
- **AND** CLI prompts for adapter name
- **AND** CLI prompts: "Generate example usage? (Y/n)"
- **AND** if yes, CLI prompts: "Registration type?" with options: "Sync (register)" or "Async (registerAsync)"
- **AND** CLI generates all 7 files (4 port + 3 adapter) plus optional example file

#### Scenario: Interactive port module option selection
- **WHEN** user generates port (any method)
- **THEN** CLI prompts: "Include PortModule? (Y/n)"
- **AND** if user answers yes, CLI generates all 4 files (token, interface, service, module)
- **AND** if user answers no, CLI generates only 3 files (token, interface, service)
- **AND** CLI shows appropriate file count in progress

#### Scenario: Interactive registration option selection
- **WHEN** user generates port (any method)
- **AND** user chose to include PortModule
- **THEN** CLI prompts: "Generate example usage? (Y/n)"
- **AND** if user answers yes, CLI shows radio buttons:
  - "Sync registration (for static config)"
  - "Async registration (for ConfigService/dynamic config)"
- **AND** CLI generates appropriate example based on selection

#### Scenario: Skip example when no module generated
- **WHEN** user generates port without PortModule
- **THEN** CLI does NOT prompt for example generation
- **AND** CLI generates only token, interface, and service files
- **AND** CLI shows message: "Generated 3/3 files (no module)"

### Requirement: Port Generation

The CLI SHALL generate complete port modules (feature modules) with all required files following library conventions.

**Port vs Service Distinction:**
- **Port command**: Generates a complete feature module with domain logic
  - Token file (e.g., `OBJECT_STORAGE_PORT`)
  - Port interface (defines contract)
  - Domain service (business logic, injects port via @InjectPort)
  - PortModule (exports service, accepts adapter via register())
- **Service command**: Generates a standalone service that injects an existing port
  - Single service file with @Injectable
  - No module, no token, no interface
  - For simple services that don't need full feature module structure

#### Scenario: Generate port with module (default)
- **WHEN** user runs `npx nest-hex generate port ObjectStorage`
- **AND** user selects "Include PortModule? (Y/n)": Yes
- **THEN** CLI creates `object-storage.token.ts` with Symbol token export (using PORT suffix, not PROVIDER)
- **AND** CLI creates `object-storage.port.ts` with interface definition
- **AND** CLI creates `object-storage.service.ts` with @InjectPort decorator usage
- **AND** CLI creates `object-storage.module.ts` extending PortModule
- **AND** all files use tabs for indentation (per project defaults)
- **AND** all files compile without TypeScript errors

#### Scenario: Generate port without module
- **WHEN** user runs `npx nest-hex generate port ObjectStorage`
- **AND** user selects "Include PortModule? (Y/n)": No
- **THEN** CLI creates `object-storage.token.ts` with Symbol token export
- **AND** CLI creates `object-storage.port.ts` with interface definition
- **AND** CLI creates `object-storage.service.ts` with @InjectPort decorator usage
- **AND** CLI does NOT create `object-storage.module.ts`
- **AND** CLI shows message: "Skipped module generation"
- **AND** service can be imported directly into existing modules

#### Scenario: Generate port with custom output directory
- **WHEN** user has `nest-hex.config.ts` with `portsDir: 'src/domain/ports'`
- **AND** user runs `npx nest-hex generate port Storage`
- **THEN** CLI creates files in `src/domain/ports/storage/`
- **AND** imports use correct relative paths

#### Scenario: Port name validation
- **WHEN** user provides invalid port name (e.g., "123Invalid", "class", "export")
- **THEN** CLI shows error: "Invalid port name. Must be a valid TypeScript identifier."
- **AND** CLI prompts user to enter a valid name

#### Scenario: Generate with example usage (sync registration)
- **WHEN** user generates port with PortModule included
- **AND** user selects "Generate example usage" option
- **AND** user selects "Sync (register)" registration type
- **THEN** CLI creates additional `object-storage.example.ts` file
- **AND** example shows PortModule.register({ adapter: Adapter.register({ options }) })
- **AND** example includes commented configuration options
- **AND** example shows how to use service in controller

#### Scenario: Generate with example usage (async registration)
- **WHEN** user generates port with PortModule included
- **AND** user selects "Generate example usage" option
- **AND** user selects "Async (registerAsync)" registration type
- **THEN** CLI creates `object-storage.example.ts` with async pattern
- **AND** example shows PortModule.register({ adapter: Adapter.registerAsync({ inject: [ConfigService], useFactory: ... }) })
- **AND** example demonstrates ConfigModule integration
- **AND** example shows environment variable usage

#### Scenario: Generate port without module (use in existing module)
- **WHEN** user generates port without PortModule
- **THEN** service file includes comment showing how to add to existing module
- **AND** comment shows: "Import this service in your module's providers array"
- **AND** comment includes example of direct provider registration

### Requirement: Adapter Generation

The CLI SHALL generate adapter implementations for existing or new ports.

#### Scenario: Generate adapter for existing port
- **WHEN** user runs `npx nest-hex generate adapter S3 --port ObjectStorage`
- **THEN** CLI creates `adapters/s3/s3.adapter.ts` with @Port decorator
- **AND** CLI creates `adapters/s3/s3.service.ts` implementing port interface
- **AND** CLI creates `adapters/s3/s3.types.ts` with options interface
- **AND** adapter imports token from existing port
- **AND** adapter extends Adapter<S3Options>

#### Scenario: Generate adapter without existing port
- **WHEN** user runs `npx nest-hex generate adapter HTTP` without `--port` flag
- **THEN** CLI prompts: "Which port does this adapter implement?"
- **AND** CLI shows list of detected ports in project
- **AND** user can select from list or enter custom port name

#### Scenario: Generate adapter with async configuration
- **WHEN** user generates adapter
- **THEN** adapter includes both register() and registerAsync() support via base class
- **AND** generated service has proper dependency injection setup

### Requirement: Service Generation with @InjectPort

The CLI SHALL generate services that consume ports using @InjectPort decorator.

#### Scenario: Generate service that uses port
- **WHEN** user runs `npx nest-hex generate service FileUpload --port ObjectStorage`
- **THEN** CLI creates `file-upload.service.ts` with @Injectable decorator
- **AND** service constructor uses `@InjectPort(OBJECT_STORAGE_PORT)`
- **AND** service imports port token correctly
- **AND** service has typed port injection

#### Scenario: Generate service without port
- **WHEN** user runs `npx nest-hex generate service Analytics` without `--port`
- **THEN** CLI creates basic @Injectable service
- **AND** service has no port injection
- **AND** service includes comment showing how to add @InjectPort

### Requirement: Full Generation (Port + Adapter)

The CLI SHALL generate both port and adapter in a single command for rapid scaffolding.

#### Scenario: Generate complete module
- **WHEN** user runs `npx nest-hex generate full ObjectStorage S3`
- **THEN** CLI generates port files (token, interface, service, module)
- **AND** CLI generates adapter files (adapter, service, types)
- **AND** all cross-references are correct
- **AND** directory structure matches configuration

#### Scenario: Interactive full generation
- **WHEN** user selects "Full" from multi-select menu
- **THEN** CLI prompts for port name
- **AND** CLI prompts for adapter name
- **AND** CLI generates all files with proper imports

### Requirement: Configuration File Support

The CLI SHALL support project-level configuration via `nest-hex.config.ts` file.

#### Scenario: Initialize configuration file
- **WHEN** user runs `npx nest-hex init`
- **THEN** CLI creates `nest-hex.config.ts` in project root
- **AND** file contains `defineConfig()` with default values
- **AND** file includes JSDoc comments explaining each option
- **AND** CLI shows success message with config path

#### Scenario: Load and apply configuration
- **WHEN** user has custom configuration file
- **AND** user runs any generate command
- **THEN** CLI loads configuration from `nest-hex.config.ts`
- **AND** CLI applies output directories from config
- **AND** CLI applies naming conventions from config
- **AND** CLI applies style preferences (indent, quotes) from config

#### Scenario: Configuration validation
- **WHEN** user has invalid configuration (e.g., invalid indent value)
- **THEN** CLI shows error: "Invalid configuration: indent must be 'tab', 2, or 4"
- **AND** CLI exits with error code 1
- **AND** CLI does not generate files

### Requirement: Template System

The CLI SHALL use templates for file generation with support for customization.

#### Scenario: Use default templates
- **WHEN** user generates components without custom templates
- **THEN** CLI uses built-in EJS templates from `src/cli/templates/`
- **AND** templates render with correct variables (name, paths, style)
- **AND** generated code matches library examples

#### Scenario: Use custom templates
- **WHEN** user configures custom template in config: `templates.portModule = './custom/port.ejs'`
- **AND** user generates port
- **THEN** CLI loads custom template from specified path
- **AND** CLI renders custom template with standard variables
- **AND** CLI generates file using custom template

#### Scenario: Template variable injection
- **WHEN** CLI renders any template
- **THEN** template receives name in all cases: pascal, camel, kebab, snake, screamingSnake
- **AND** template receives import paths relative to output file
- **AND** template receives style preferences: indent, quote, semi
- **AND** template receives metadata: timestamp, author (from git)

### Requirement: File Conflict Handling

The CLI SHALL safely handle file conflicts and prevent accidental overwrites.

#### Scenario: File already exists
- **WHEN** user generates component that would create existing file
- **THEN** CLI detects existing file before writing
- **AND** CLI prompts: "File exists: path/to/file.ts. Overwrite? (y/N)"
- **AND** if user answers "N", CLI skips that file
- **AND** if user answers "y", CLI overwrites file
- **AND** CLI continues with remaining files

#### Scenario: Generate with force flag
- **WHEN** user runs command with `--force` flag
- **THEN** CLI overwrites all existing files without prompting
- **AND** CLI logs warning for each overwritten file

### Requirement: NestJS CLI Integration

The CLI SHALL integrate with NestJS CLI via schematics for users who prefer `nest` command.

#### Scenario: Generate via NestJS CLI
- **WHEN** user runs `nest generate nest-hex:port ObjectStorage`
- **THEN** CLI generates port files using same logic as standalone CLI
- **AND** CLI respects nest-hex.config.ts if present
- **AND** CLI output matches standalone CLI output

#### Scenario: NestJS CLI with options
- **WHEN** user runs `nest generate nest-hex:adapter S3 --port=ObjectStorage --no-interactive`
- **THEN** CLI generates adapter without prompts
- **AND** CLI uses provided options directly

### Requirement: Help and Documentation

The CLI SHALL provide comprehensive help text and usage examples.

#### Scenario: Display help
- **WHEN** user runs `npx nest-hex --help`
- **THEN** CLI shows available commands: generate, init
- **AND** CLI shows global options: --help, --version, --config
- **AND** CLI shows usage examples

#### Scenario: Command-specific help
- **WHEN** user runs `npx nest-hex generate --help`
- **THEN** CLI shows generate subcommands: port, adapter, service, full
- **AND** CLI shows flags: --force, --no-interactive, --dry-run
- **AND** CLI shows examples for each subcommand

#### Scenario: Display version
- **WHEN** user runs `npx nest-hex --version`
- **THEN** CLI shows version from package.json
- **AND** CLI exits with code 0

### Requirement: Dry Run Mode

The CLI SHALL support dry run mode to preview changes without writing files.

#### Scenario: Dry run generation
- **WHEN** user runs `npx nest-hex generate port Storage --dry-run`
- **THEN** CLI shows all files that would be created
- **AND** CLI shows file paths and preview of content (first 10 lines)
- **AND** CLI does NOT write any files to disk
- **AND** CLI exits with success message

### Requirement: Error Handling and Validation

The CLI SHALL provide clear error messages and validate user inputs.

#### Scenario: Invalid command
- **WHEN** user runs `npx nest-hex invalid-command`
- **THEN** CLI shows error: "Unknown command: invalid-command"
- **AND** CLI suggests similar commands: "Did you mean: init, generate?"
- **AND** CLI exits with code 1

#### Scenario: Missing required argument
- **WHEN** user runs `npx nest-hex generate port` (no name)
- **AND** CLI is in non-interactive mode (`--no-interactive`)
- **THEN** CLI shows error: "Missing required argument: name"
- **AND** CLI shows usage help
- **AND** CLI exits with code 1

#### Scenario: Invalid file write
- **WHEN** CLI attempts to write file to read-only directory
- **THEN** CLI catches error and shows: "Cannot write to path/to/file: Permission denied"
- **AND** CLI exits with code 1

### Requirement: Cross-Platform Compatibility

The CLI SHALL work on Windows, macOS, and Linux.

#### Scenario: Path handling on Windows
- **WHEN** user runs CLI on Windows
- **THEN** CLI uses forward slashes in imports (not backslashes)
- **AND** CLI creates directories with correct separators
- **AND** CLI handles Windows line endings (CRLF) if configured

#### Scenario: Path handling on Unix
- **WHEN** user runs CLI on macOS or Linux
- **THEN** CLI creates files with Unix line endings (LF)
- **AND** CLI uses forward slashes in all paths
- **AND** CLI respects Unix file permissions

### Requirement: Code Quality of Generated Files

The CLI SHALL generate code that passes all project quality checks.

#### Scenario: TypeScript compilation
- **WHEN** CLI generates any files
- **THEN** generated code compiles without errors with `tsc --noEmit`
- **AND** generated code passes `isolatedDeclarations` check
- **AND** generated code has no type assertions (`as`) unless necessary

#### Scenario: Linting
- **WHEN** CLI generates files
- **THEN** generated code passes Biome checks
- **AND** generated code uses tabs for indentation (per project config)
- **AND** generated code uses single quotes
- **AND** generated code has consistent formatting

#### Scenario: Decorator usage
- **WHEN** CLI generates port or adapter
- **THEN** generated code uses correct decorator imports from library
- **AND** decorators have proper metadata (@Port, @InjectPort)
- **AND** reflect-metadata is assumed available (peer dependency)

### Requirement: Progress Indicators and Status Updates

The CLI SHALL provide real-time progress feedback during file generation to improve user experience.

#### Scenario: Show generation progress
- **WHEN** CLI generates any files
- **THEN** CLI displays spinner or progress indicator
- **AND** CLI shows current step (e.g., "Creating port token...", "Writing service file...")
- **AND** CLI updates status in real-time as each file is created
- **AND** CLI shows completion message with summary

#### Scenario: Multi-file generation progress
- **WHEN** CLI generates multiple components (e.g., full port + adapter)
- **THEN** CLI shows progress for each file: "Creating token file... ✓"
- **AND** CLI shows overall progress: "3/7 files created"
- **AND** CLI displays estimated or actual time for long operations
- **AND** progress updates are smooth without flickering

#### Scenario: Linting progress indicator
- **WHEN** CLI runs linting on generated files
- **THEN** CLI shows spinner with message: "Linting generated files..."
- **AND** CLI updates to show success: "Linting passed ✓"
- **AND** if linting fails, CLI shows which files have errors
- **AND** CLI displays linting output for debugging

### Requirement: Automatic Linting of Generated Files

The CLI SHALL automatically detect and run project linters on generated files to ensure code quality.

#### Scenario: Detect and run Biome linting
- **WHEN** project has `@biomejs/biome` in package.json or `biome.json` config
- **AND** CLI generates files
- **THEN** CLI automatically runs `biome check --write` on generated files
- **AND** CLI shows progress: "Formatting with Biome..."
- **AND** CLI applies fixes automatically
- **AND** CLI shows success or error results

#### Scenario: Detect and run Prettier formatting
- **WHEN** project has `prettier` in package.json or `.prettierrc` config
- **AND** project does NOT have Biome
- **AND** CLI generates files
- **THEN** CLI automatically runs `prettier --write` on generated files
- **AND** CLI shows progress: "Formatting with Prettier..."
- **AND** CLI applies formatting
- **AND** CLI shows success message

#### Scenario: Run lint script from package.json
- **WHEN** project has `lint:fix` or `lint` script in package.json
- **AND** CLI generates files
- **THEN** CLI offers to run lint script: "Run 'bun run lint:fix' on generated files? (Y/n)"
- **AND** if user accepts, CLI runs the script
- **AND** CLI shows linting output
- **AND** CLI reports success or failures

#### Scenario: No linter available
- **WHEN** project has no detectable linter (no Biome, Prettier, or lint script)
- **AND** CLI generates files
- **THEN** CLI shows info message: "Tip: Install Biome or Prettier for automatic formatting"
- **AND** CLI does not attempt to lint
- **AND** CLI completes generation successfully

#### Scenario: Linting failure handling
- **WHEN** linting fails on generated files
- **THEN** CLI shows error message with details
- **AND** CLI shows which files have issues
- **AND** CLI keeps generated files (does not roll back)
- **AND** CLI suggests running linter manually to fix issues
- **AND** CLI exits with warning status (not error)

#### Scenario: Skip linting with flag
- **WHEN** user runs CLI with `--no-lint` flag
- **THEN** CLI skips all linting steps
- **AND** CLI does not check for linters
- **AND** CLI generates files without formatting
- **AND** CLI shows message: "Skipped linting (--no-lint)"
