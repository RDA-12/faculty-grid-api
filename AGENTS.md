# NestJS

This app's version of NestJS is likely newer than what you know. https://docs.nestjs.com/llms.txt indexes its documentation, with a markdown page per chapter.

Nest has first-party packages for these, so check them before adding another library or writing your own:

Databases: @nestjs/typeorm, @nestjs/drizzle, @nestjs/mongoose, @nestjs/sequelize.
OpenAPI: @nestjs/swagger. GraphQL: @nestjs/graphql. WebSockets: @nestjs/websockets. Microservices: @nestjs/microservices.
Sign-in: @nestjs/authentication. Permissions: @nestjs/authorization. Rate limiting: @nestjs/throttler.
Configuration: @nestjs/config. Caching: @nestjs/cache-manager. Health checks: @nestjs/terminus. Events inside the app: @nestjs/event-emitter.
Email: @nestjs/mail. Files, S3 included: @nestjs/storage. Translations: @nestjs/i18n.
Retries, timeouts and circuit breakers: @nestjs/resilience.
Idempotency keys: @nestjs/idempotency. Transactional outbox: @nestjs/outbox. Sending and receiving webhooks: @nestjs/webhooks.
Queues: @nestjs/bullmq. Scheduled jobs: @nestjs/schedule.
Running a scheduled job on one instance, and locks: @nestjs/locks. Processes that take days: @nestjs/workflows.
Language models, tools and agents: @nestjs/ai. MCP servers: @nestjs/mcp.

Validation works with Zod, Valibot, ArkType or any other Standard Schema library, with no classes or decorator metadata: StandardSchemaValidationPipe with @Body({ schema }) or @Param('id', { schema }) (https://docs.nestjs.com/application/validation.md). class-validator still works, through ValidationPipe.

A route handler can return a web Response, a ReadableStream or an async generator, and Nest streams it as it's produced (https://docs.nestjs.com/http/streaming-responses.md).

Nest's packages are ESM only. A CommonJS project loads them through require(esm), which needs Node.js 20.19+ or 22.12+, and doesn't have to convert (https://docs.nestjs.com/migration-guide.md).

---

# Agent Rules & Guardrails

Follow these rules strictly on every task:

1. **Never implement before plan approval.** Always present a concrete implementation plan (including the tests to verify it) and wait for explicit user approval before modifying or creating code.
2. **Never commit changes unless explicitly asked.** Do not run `git commit` or `git push` unless the user explicitly instructs you to.
3. **Always ask before creating a new module.** Before introducing a new NestJS feature module, ask for user approval and clearly explain:
   - Why a new module is needed (instead of extending an existing feature module).
   - What entities the new module will manage.
4. **Always ask before running or generating migrations.** Never generate, run, or revert database migrations without explicit user approval.
5. **Prefer NestJS first-party packages.** Check the NestJS package list above before adding third-party libraries.
6. **Use the simplest solution.** Choose the simplest, cleanest approach that solves the given task without unnecessary abstractions or over-engineering.
7. **Treat `AGENTS.md` as a living document.** Propose updates to `AGENTS.md` whenever project structure, conventions, or patterns change—always ask for user approval before modifying it.
8. **Ask for clarification when unclear.** If any part of the task is ambiguous or underspecified, ask the user before proceeding. Never make assumptions about requirements, context, or behavior outside what is explicitly stated or present in this repository.

---

# Development Workflow

Follow this exact sequence for every implementation task:

1. **Task given** — Read the request and inspect the related modules, layers, and tests.
2. **Run preflight tests** — Run existing unit and/or e2e tests for the related code before planning or changing anything:
   - Targeted unit tests: `npx vitest run <path-to-spec>`
   - All unit tests: `npm test`
   - Targeted e2e tests: `npx vitest run --config ./vitest.config.e2e.ts <path-to-e2e-spec>`
   - All e2e tests: `npm run test:e2e`
3. **Early exit on preflight failure** — If any preflight test fails, **stop immediately** and report the failure to the user. Do not proceed to planning or implementation.
4. **Create implementation plan** — Draft a plan that follows existing codebase patterns and includes the tests (unit, repository, and/or e2e) required to verify the changes. If a new module or migration is needed, request approval with full justification.
5. **Revise plan when needed** — Update the plan based on user feedback until approved.
6. **Implement when approved** — Only after explicit approval, implement the changes and tests.
7. **Run related tests** — Run all unit and e2e tests related to the changed code.
8. **Early exit after 3 failed fix attempts** — If tests fail, diagnose and attempt up to **3 solutions**. If tests still fail after 3 attempts, **stop immediately** and report the failure and what was tried.
9. **Run linter** — Run `npm run lint` (`oxlint --type-aware src/ test/`) and ensure it exits cleanly with no errors or warnings.
10. **Run formatter** — Run `npm run format` (`prettier --write "src/**/*.ts" "test/**/*.ts"`).

---

# Tech Stack & Packages

This project is an ESM (`"type": "module"`, `"module": "nodenext"`) NestJS 12 REST API backed by PostgreSQL + TypeORM, validated with `class-validator` / `class-transformer`, and documented with Swagger (`/docs`). Always use `.js` extensions on relative TypeScript imports, and use `import type` (or inline `type` specifiers) whenever an import is only used as a type (keeping value imports only where runtime metadata or values are required, such as NestJS DI tokens or `class-validator` DTOs).

### Runtime Packages
- **Framework**: `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`, `reflect-metadata`, `rxjs`
- **Database**: `@nestjs/typeorm`, `typeorm`, `pg` (PostgreSQL)
- **Configuration**: `@nestjs/config` (`.env.local`, `.env`, typed via `src/common/config.ts`)
- **Auth & Authz**: `@nestjs/authentication` (JWT access tokens, `@Public()`, `@CurrentUser()`, `PasswordHasher`), `@nestjs/authorization` (`@Policy()`, `Can`)
- **Validation & Serialization**: `class-validator`, `class-transformer`
- **OpenAPI / Swagger**: `@nestjs/swagger`

### Tooling & Testing Packages
- **Test Runner**: `vitest`, `@vitest/coverage-v8` (`vitest.config.ts` for `*.spec.ts`, `vitest.config.e2e.ts` for `*.e2e-spec.ts` with `fileParallelism: false`)
- **Testing Utilities**: `@nestjs/testing`, `supertest`
- **In-Memory Postgres for Tests**: `@electric-sql/pglite`, `typeorm-pglite`
- **Linting & Formatting**: `oxlint`, `oxlint-tsgolint` (`.oxlintrc.json`), `prettier` (`.prettierrc`: single quotes, trailing commas, no semicolons)
- **Migrations**: `typeorm-ts-node-esm`, `ts-node`

---

# Project Structure

The codebase is organized into **feature-based modules** under `src/` and shared infrastructure under `src/common/`. Some modules manage multiple closely related entities (e.g., `organization` manages `faculty`, `program`, and structural `title`; `lecturer` manages `rank`, `functional_rank`, and `lecturer`), while others manage a single entity (e.g., `user` manages only `user`, `title-appointment` manages `lecturer_title`).

```text
src/
├── main.ts                         # Bootstrap, Swagger setup, configureApp()
├── app.module.ts                   # Root module importing DatabaseModule, ConfigModule, and feature modules
├── common/                         # Shared infrastructure & cross-cutting concerns
│   ├── app-exception.ts            # Abstract AppException + domain/HTTP exceptions
│   ├── app-response.ts             # SuccessResponse, PaginatedSucessResponse, FailedResponse, Swagger decorators
│   ├── app-result.ts               # AppResult<T> discriminated result wrapper (success / failed)
│   ├── base-use-case.ts            # PromiseUseCase<P, R> interface
│   ├── config.ts                   # Typed appConfig() loader
│   ├── pagination.ts               # Pagination, PaginationResult, PaginationOut, PaginatedResult, PaginationQuery
│   ├── database/
│   │   ├── config.ts               # TypeORM DataSourceOptions & exported typeOrmDatasource
│   │   ├── database.module.ts      # TypeOrmModule.forRootAsync(...)
│   │   ├── entities/               # Centralized TypeORM *DBEntity classes + common.entity.ts base classes
│   │   └── migrations/             # Generated TypeORM migrations
│   ├── decorators/                 # Custom parameter/route/validation decorators (e.g., @ApiKeyHeader, @IsAfter)
│   ├── exception-filter/           # Global filters (CatchEverything, InvalidRequest, Unauthorized)
│   ├── interceptors/               # Global interceptors (LoggingInterceptor, ResponseTransformerIntereceptor)
│   └── pipes/                      # Custom pipes (e.g., ApiKeyValidationPipe)
├── auth/                           # Authentication (login, register-admin, refresh token, credentials, JWT/hashing utils)
├── authz/                          # Authorization (roles, user-roles, AuthorizationModule, @RequiredPermisson, @Anyone)
├── user/                           # Single-entity module managing users only (credentials live in auth)
├── organization/                   # Multi-entity module managing organization master data (faculty, program & structural title)
├── lecturer/                       # Multi-entity module managing lecturer data (rank, functional rank & lecturer profile)
├── title-appointment/              # Single-entity module managing rotatable structural title assignments (lecturer_title)
├── course/                         # Single-entity module managing courses offered by a program per semester
└── academic-calendar/              # Multi-entity module managing academic calendar data (academic year & terms)

test/
├── helper.ts                       # createTestingApp(), getAccessToken(), auth error assertions
├── common/
│   ├── test-config.ts              # TestConfig override for ConfigService
│   ├── database/test-database.ts   # createTestDataSource() & TestDatabaseModule using PGlite
│   └── mock/db-mock-data.ts        # createUserMock() seeding an admin user + credentials + role
└── <module>/<feature>.e2e-spec.ts  # End-to-end HTTP tests
```

### Feature Module Layout
Each feature module follows this layered folder structure:
```text
src/<feature>/
├── <feature>.module.ts
├── controllers/      # *.controller.ts, *.controller.spec.ts, *.dto.ts
├── entities/         # Pure domain classes (e.g., faculty.entity.ts)
├── policies/         # @Policy() authorization classes (when protected by permissions)
├── repositories/     # *.repository.ts, *.repository.spec.ts
├── use-cases/        # *.use-case.ts, *.use-case.spec.ts (note: organization currently uses user-cases/)
└── utils/            # Optional feature-specific utilities (e.g., auth/utils/)
```

---

# Architecture & Layer Implementation Patterns

### 1. Error & Result Handling (`AppResult` & `AppException`)
- Repositories and use cases **do not throw** for expected domain/business errors; they return `Promise<AppResult<T>>` via `AppResult.success(data)` or `AppResult.failed(exception)`.
- Exceptions extend `AppException` (`src/common/app-exception.ts`) with `{ status, title, detail }` (e.g., `NotFoundException`, `AlreadyExistsException`, `InvalidCredentialException`, `InvalidRefreshTokenException`, `InvalidRequestException`, `UnexpectedException`).
- `ResponseTransformerIntereceptor` automatically converts:
  - `AppResult.success(data)` -> `SuccessResponse(statusCode, data)`
  - `AppResult.success(PaginatedResult)` -> `PaginatedSucessResponse(statusCode, data, pagination)`
  - `AppResult.failed(InvalidRequestException)` -> sets status `422` and returns `InvalidRequestReponse(errors)` (matching `InvalidRequestExceptionFilter`)
  - `AppResult.failed(exception)` -> sets `response.status(exception.status)` and returns `FailedResponse(status, title, detail)`
  - `204 No Content` -> empty body (`undefined`)
  - `StreamableFile` -> untouched
- Global pipes/filters configured in `configureApp(app)` (`src/main.ts`):
  - `ValidationPipe({ transform: true, errorHttpStatusCode: 422, exceptionFactory: InvalidRequestException.fromValidationPipe })`
  - `LoggingInterceptor` + `ResponseTransformerIntereceptor`
  - `CatchEverythingExceptionFilter`, `InvalidRequestExceptionFilter`, `UnauthorizedExceptionFilter`
  - `ConsoleLogger` redacts sensitive fields (`password`, `accessToken`, `refreshToken`, `apiKey`, `hashedPassword`, `hashed`).

### 2. Database Entities (`src/common/database/entities/`)
- All TypeORM entities live centrally in `src/common/database/entities/*.entity.ts` and use the `*DBEntity` suffix.
- Extend `AutoIdTimestamp` (UUIDv7 `@PrimaryColumn` generated in `@BeforeInsert()`, `created_at`, `updated_at`, `deleted_at` soft-delete column) or `AutoIdTimestampCreatedBy` (adds `created_by` FK to `users`).
- Register every new `*DBEntity` in `typeOrmConfig.entities` in `src/common/database/config.ts`.
- Implement `toDomain()` to convert DB entities into pure domain entities (and optional `static fromParams(...)` factory methods).
- Use `type Relation<T>` from `typeorm` for relation properties to avoid circular ESM metadata issues.
- On nullable union-typed columns (e.g., `string | null`), always specify `type` explicitly (such as `'varchar'` or `'date'`) alongside `nullable: true`.
- Enforce active-record uniqueness on soft-deletable tables using partial unique indexes (`@Index(..., { unique: true, where: '"deleted_at" IS NULL' })`).

### 3. Domain Entities (`src/<module>/entities/`)
- Pure TypeScript classes with `readonly` properties and a typed constructor object.
- No TypeORM decorators or HTTP/Swagger decorators.

### 4. Repositories (`src/<module>/repositories/`)
- `@Injectable()` classes injecting `DataSource` and obtaining `dataSource.getRepository(*DBEntity)` in the constructor.
- Instantiate a `private readonly logger = new Logger('<RepositoryName>')` for debug/error logs.
- Return `Promise<AppResult<T>>`. Map `QueryFailedError` Postgres error codes (e.g., `23503` foreign key violation -> `NotFoundException`, `23505` unique violation -> `AlreadyExistsException`) and wrap unknown errors in `UnexpectedException`.
- Use `createQueryBuilder` with `.skip((page - 1) * pageSize).take(pageSize)` and `.getManyAndCount()` to return `PaginatedResult` + `PaginationResult`.
- Deletions use `this.repository.softRemove(...)` (soft delete; idempotent when record is not found).

### 5. Use Cases (`src/<module>/use-cases/`)
- `@Injectable()` classes implementing `PromiseUseCase<P, R>` (`execute(params: P): Promise<AppResult<R>>`).
- Define a dedicated `*Params` class (extending `Pagination` for paginated queries) when passing structured inputs.
- **Cross-module boundary**: A module must only interact with another module through that module's **exported use cases** (never by importing another module's repository directly).

### 6. Policies & Authorization (`src/<module>/policies/` & `src/authz/`)
- Policies are `@Policy()` classes from `@nestjs/authorization` receiving `AuthzUser | null` and checking `user?.isA(Role.*) ?? false`.
- **Every new policy must be registered** in `AuthorizationModule.forRootAsync({ policies: [...] })` in `src/authz/authz.module.ts`.
- Apply access control on controller routes using:
  - `@RequiredPermisson(SomePolicy, 'action')` — enforces policy + adds `@ApiBearerAuth()` and 401/403 Swagger docs.
  - `@Anyone()` — any authenticated user + adds `@ApiBearerAuth()` and 401 Swagger docs.
  - `@Public()` (from `@nestjs/authentication`) — unauthenticated routes (optionally combined with `@ApiKeyHeader()`).

### 7. Controllers & DTOs (`src/<module>/controllers/`)
- Thin HTTP adapters that delegate to use cases, check `result.exception`, and map domain entities to `*Out` DTOs (e.g., `FacultyOut.fromFaculty(data)` or `result.data!.mapData(...)`).
- Request DTOs (`*DTO`, `*Query`) use `class-validator` and `class-transformer` decorators (paginated query DTOs extend `PaginationQuery`).
- Resource updates use `PUT /:id` (replacing editable fields).
- Response DTOs (`*Out`) expose `@ApiProperty()` fields and static mapper methods (`from<Entity>`). Provide `example` values on `@ApiProperty(...)` for non-ID properties, and omit `example` on ID-based properties.
- Document endpoints with `@ApiTags`, `@ApiSuccessResponse`, `@ApiFailedResponse`, `@ApiInvalidRequestResponse`, and `@ApiNoContentResponse`.

---

# Testing Patterns

### 1. Repository Tests (`*.repository.spec.ts`)
- Run against an in-memory PostgreSQL instance via `PGliteDriver` (`createTestDataSource` from `test/common/database/test-database.ts`).
- Build a `Test.createTestingModule` providing `{ provide: DataSource, useFactory: createTestDataSource }` and the repository under test.
- Seed required prerequisite rows (e.g., `UserDBEntity`) in `beforeAll`, and `TRUNCATE TABLE "<tableName>" RESTART IDENTITY CASCADE` in `beforeEach` to keep tests isolated.
- Assert both the returned `AppResult` and actual persisted/soft-deleted DB state via `dataSource.manager`.

### 2. Use Case Tests (`*.use-case.spec.ts`)
- Build a `Test.createTestingModule` with the use case and mocked dependencies (`useValue: { method: vi.fn().mockResolvedValue(...) }`).
- Verify dependency invocation (`toHaveBeenCalledExactlyOnceWith(...)`), success return value, and failure propagation using `AppException.test()`.

### 3. Controller Unit Tests (`*.controller.spec.ts`)
- Build a `Test.createTestingModule` with `controllers: [SomeController]` and mocked use cases (`vi.fn()`).
- Call `vi.clearAllMocks()` in `afterEach`.
- Verify use case delegation with exact params, `*Out` DTO mapping on success, and `AppResult.failed(e)` passthrough on failure.

### 4. End-to-End Tests (`test/<module>/<feature>.e2e-spec.ts`)
- Compile `AppModule` with:
  - `.overrideModule(DatabaseModule).useModule(TestDatabaseModule)`
  - `.overrideProvider(ConfigService).useClass(TestConfig)`
- Create the app via `createTestingApp(moduleRef)` (applies `configureApp(app)`) and call `await app.init()` / `await app.close()`.
- Seed an admin user with `createUserMock(moduleRef)` and obtain a JWT via `getAccessToken(app)`.
- Use `supertest` to test happy paths, pagination/search queries, validation errors (`422`), and auth failures (`excpectResponseMissingAuth`, `excpectResponseInvalidAuth`).

---

# Database Migrations

TypeORM `synchronize` is **disabled** (`synchronize: false`). All schema changes must be managed via migrations.

> **Always ask for user approval before generating, running, or reverting any migration.**

- **Generate a migration** (after updating/adding `*DBEntity` and registering it in `src/common/database/config.ts`):
  ```bash
  npm run migration:generate -- ./src/common/database/migrations/<one-line-migration-summary>
  ```
  - Immediately after generating, update line 1 of the migration file to `import type { MigrationInterface, QueryRunner } from 'typeorm'` so TypeORM's dynamic ESM loading does not fail on type-only exports.
- **Run pending migrations**:
  ```bash
  npm run migration:run
  ```
- **Revert the last migration**:
  ```bash
  npm run migration:revert
  ```
