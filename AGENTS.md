# AGENTS.md

Monorepo with Angular 20 frontend + .NET backend.

## Repository Structure

- **frontend/** - Angular 20.3.15 standalone component app (strict TypeScript, SASS styles)
- **backend/** - .NET solution (`RapidDev.slnx`) with clean architecture layers in `src/` (Application, Domain, Infrastructure, WebApi)
- **.husky/pre-commit** - Runs `cd frontend && npm exec -- lint-staged` (Prettier format on staged TS, HTML, SCSS, JSON)

## Frontend (Angular 20)

### Key Setup Facts

- **Standalone components only** - uses `bootstrapApplication()`, no NgModules
- **Strict mode enforced** - `strict: true`, `strictTemplates: true`, `noImplicitOverride: true` in tsconfig
- **Folder structure** - `core/`, `features/`, `layout/`, `shared/` (feature-based organization)
- **Routes** - defined in `app.routes.ts`, provided via `provideRouter()`
- **Styles** - SASS by default, loaded globally via `src/styles.sass`
- **Prettier config** - `printWidth: 100`, `singleQuote: true`, parser: `angular` for `.html`

### Commands (run from `frontend/`)

```bash
npm start              # ng serve on localhost:4200 (development mode)
npm run build          # ng build (production, ES2022 target, output to dist/)
npm run watch          # ng build --watch --configuration development
npm test               # ng test (Karma runner)
npm run format         # prettier --write src/**/*.{ts,html,scss,json}
```

### Angular CLI Quirks

- Default component style: SASS (configured in `angular.json` schematics)
- **Tests auto-skipped** - components generated without spec files (skipTests: true in angular.json)
- Component prefix: `app-`
- Generate syntax: `ng generate component path/component-name`

### Build Constraints

- Initial bundle: 500kB warning / 1MB error
- Component styles: 4kB warning / 8kB error

### Pre-commit Hook

Runs only from `frontend/`. Triggered by git commit. Prettier must pass or commit will fail.

## Development Workflow

1. **Start dev server** - `npm start` in `frontend/`
2. **Create components** - `ng generate component features/component-name` (auto-SASS, no tests)
3. **Commit** - Husky pre-commit formats staged files with Prettier (runs in `frontend/` only)
4. **Build** - `npm run build` produces `dist/` with production optimizations

## Backend (.NET)

Located in `backend/src/` with layered structure. (This repo does not include agent guidance for backend workflows yet.)

## Important Constraints for Agents

- **Prettier autorun** - Any TypeScript/HTML file committed in frontend will be formatted. Don't fight it; check the printWidth and quote style.
- **No tests by default** - `ng generate component` skips spec files. To generate with tests, omit `--skip-tests` or run `ng generate component --skip-tests=false`.
- **Standalone only** - Always use standalone components, never create NgModules unless explicitly required.
- **TypeScript strict** - Template type errors will fail compilation. Rely on strict type checking, not runtime inference.
