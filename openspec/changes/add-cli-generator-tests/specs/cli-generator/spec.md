# CLI Generator Testing Requirements

## ADDED Requirements

### Requirement: Configuration Option Testing
The test suite SHALL verify that all nest-hex.config.ts configuration options correctly affect generated output.

#### Scenario: Custom output directories are respected
- **WHEN** config specifies `output.portsDir = 'custom/ports'` and `output.adaptersDir = 'custom/adapters'`
- **THEN** generators SHALL create files in the specified directories

#### Scenario: Naming conventions are applied
- **WHEN** config specifies `naming.portSuffix = 'CONTRACT'`, `naming.adapterSuffix = 'Implementation'`, and `naming.fileCase = 'kebab'`
- **THEN** generated tokens SHALL use CONTRACT suffix, classes SHALL use Implementation suffix, and files SHALL use kebab-case naming

#### Scenario: Code style preferences are applied
- **WHEN** config specifies `style.indent = 2`, `style.quotes = 'double'`, and `style.semicolons = false`
- **THEN** generated code SHALL use 2-space indentation, double quotes, and omit semicolons

#### Scenario: Custom templates override defaults
- **WHEN** config specifies custom template paths in `templates.*`
- **THEN** generators SHALL use the custom templates instead of built-in templates

### Requirement: Generator Output Validation
The test suite SHALL verify that all generators produce correct and complete output for their respective types.

#### Scenario: PortGenerator creates complete module structure
- **WHEN** PortGenerator runs with `includeModule = true` and `includeService = true`
- **THEN** it SHALL generate port token file, port interface file, port service file, port module file, and index.ts with correct exports

#### Scenario: PortGenerator respects component options
- **WHEN** PortGenerator runs with `includeModule = false`
- **THEN** it SHALL NOT generate a module file and index.ts SHALL NOT export a module

#### Scenario: AdapterGenerator links to existing port
- **WHEN** AdapterGenerator runs with `portName = 'object-storage'` and `portPath = '../ports/object-storage'`
- **THEN** generated adapter SHALL import the port token from the correct path and reference it in @Adapter decorator

#### Scenario: ServiceGenerator includes port injection
- **WHEN** ServiceGenerator runs with `portName = 'object-storage'`
- **THEN** generated service SHALL use @InjectPort decorator with the correct port token

### Requirement: Generated Code Compilation
The test suite SHALL verify that all generated code compiles without errors and follows TypeScript best practices.

#### Scenario: Generated files type-check successfully
- **WHEN** any generator produces output
- **THEN** running `tsc --noEmit` on the generated files SHALL complete without errors

#### Scenario: Generated files pass isolatedDeclarations check
- **WHEN** any generator produces output
- **THEN** TypeScript's `isolatedDeclarations` check SHALL pass, ensuring proper type exports

#### Scenario: Generated imports resolve correctly
- **WHEN** any generator produces files with imports
- **THEN** all import paths SHALL be valid relative paths that resolve to existing files

### Requirement: Token Naming Convention Validation
The test suite SHALL verify that generated port tokens use the PORT suffix convention, not legacy PROVIDER naming.

#### Scenario: Port tokens use PORT suffix
- **WHEN** PortGenerator creates a token file
- **THEN** the token name SHALL end with `_PORT` (e.g., `OBJECT_STORAGE_PORT`)

#### Scenario: Token suffix respects configuration
- **WHEN** config specifies `naming.portSuffix = 'CONTRACT'`
- **THEN** generated token SHALL end with `_CONTRACT` instead of `_PORT`

### Requirement: Edge Case Handling
The test suite SHALL verify that generators handle edge cases gracefully with helpful error messages.

#### Scenario: Missing output directory is created
- **WHEN** generator runs with outputPath pointing to non-existent directory
- **THEN** the directory SHALL be created automatically

#### Scenario: Existing files prevent overwrite without force
- **WHEN** generator runs and output files already exist and `force = false`
- **THEN** generator SHALL error with message indicating files exist and suggesting --force flag

#### Scenario: Force option overwrites existing files
- **WHEN** generator runs with `force = true` and files already exist
- **THEN** existing files SHALL be overwritten without error

#### Scenario: Invalid names are rejected
- **WHEN** generator receives name with invalid characters (e.g., spaces, special symbols)
- **THEN** generator SHALL error with helpful message explaining valid naming rules

### Requirement: Cross-Platform Compatibility
The test suite SHALL verify that generators work correctly on Windows, macOS, and Linux.

#### Scenario: Path separators are normalized
- **WHEN** generator runs on Windows with backslash paths
- **THEN** generated import statements SHALL use forward slashes (TypeScript/ESM standard)

#### Scenario: File operations succeed on all platforms
- **WHEN** generator creates files on any platform
- **THEN** files SHALL be created with correct permissions and line endings

#### Scenario: Relative path calculation is cross-platform
- **WHEN** generator calculates import paths
- **THEN** paths SHALL be correct regardless of platform path separator conventions

### Requirement: Configuration Loading and Validation
The test suite SHALL verify that the configuration system loads and validates configs correctly.

#### Scenario: Valid config file is loaded
- **WHEN** nest-hex.config.ts exists with valid configuration
- **THEN** config loader SHALL parse and return the configuration

#### Scenario: Missing config falls back to defaults
- **WHEN** nest-hex.config.ts does not exist
- **THEN** config loader SHALL return default configuration without error

#### Scenario: Partial config merges with defaults
- **WHEN** nest-hex.config.ts specifies only some options
- **THEN** config loader SHALL deep merge provided options with defaults

#### Scenario: Invalid config values are rejected
- **WHEN** config contains invalid enum values (e.g., `fileCase = 'invalid'`)
- **THEN** config validator SHALL error with message listing valid values

### Requirement: Template System Testing
The test suite SHALL verify that the template rendering system works correctly with all templates.

#### Scenario: Templates receive correct context
- **WHEN** template is rendered
- **THEN** all name variations (kebab, camel, pascal, snake, screamingSnake) and config options SHALL be available in context

#### Scenario: Conditional template rendering works
- **WHEN** template includes conditional blocks (e.g., `{{#if includeModule}}`)
- **THEN** blocks SHALL render or be omitted based on context values

#### Scenario: Invalid templates provide helpful errors
- **WHEN** template file is missing or has syntax errors
- **THEN** renderer SHALL error with message indicating the template file and error location

### Requirement: Integration Testing
The test suite SHALL include end-to-end integration tests that run the complete generation pipeline.

#### Scenario: Port and adapter work together
- **WHEN** PortGenerator creates a port, then AdapterGenerator creates an adapter for that port
- **THEN** generated adapter SHALL correctly import and reference the port token, and all files SHALL compile together

#### Scenario: Generated module can be imported
- **WHEN** generator creates a complete module with all files
- **THEN** the generated module SHALL be importable in a test NestJS application

#### Scenario: Multiple generations with same config
- **WHEN** multiple generators run sequentially with the same configuration
- **THEN** all outputs SHALL consistently follow the same naming and style conventions

### Requirement: Snapshot Testing
The test suite SHALL include snapshot tests to detect unintended changes in generated output.

#### Scenario: Default generation snapshots
- **WHEN** generators run with default configuration
- **THEN** generated output SHALL match stored snapshots

#### Scenario: Custom config generation snapshots
- **WHEN** generators run with custom configuration
- **THEN** generated output SHALL match stored snapshots for that configuration

#### Scenario: Snapshot mismatches are reported clearly
- **WHEN** generated output differs from snapshot
- **THEN** test framework SHALL show clear diff of what changed

### Requirement: Utility Function Testing
The test suite SHALL verify that all utility functions work correctly.

#### Scenario: Name transformation functions
- **WHEN** name transformer receives input like "object-storage"
- **THEN** it SHALL produce correct outputs: "object-storage" (kebab), "objectStorage" (camel), "ObjectStorage" (pascal), "object_storage" (snake), "OBJECT_STORAGE" (screamingSnake)

#### Scenario: Path resolution calculates correct relative paths
- **WHEN** path resolver receives source and target paths
- **THEN** it SHALL calculate the correct relative import path with forward slashes

#### Scenario: File writer handles dry run mode
- **WHEN** file writer runs with `dryRun = true`
- **THEN** it SHALL simulate file creation without actually writing files

### Requirement: Test Coverage Metrics
The test suite SHALL achieve minimum coverage thresholds to ensure adequate testing.

#### Scenario: Generator code coverage
- **WHEN** test coverage is measured for generators (port, adapter, service)
- **THEN** line coverage SHALL be at least 80%

#### Scenario: Utility code coverage
- **WHEN** test coverage is measured for utility functions
- **THEN** line coverage SHALL be at least 90%

#### Scenario: Configuration code coverage
- **WHEN** test coverage is measured for config loading and validation
- **THEN** line coverage SHALL be at least 85%
