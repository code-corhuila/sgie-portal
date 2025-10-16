# Repository Guidelines

## Project Structure & Module Organization

`src/` houses all application code: domain flows live in `src/modules/`, shared UI in `src/components/`, API helpers under `src/api/`, design tokens in `src/theme/`, and cross-cutting utilities (e.g., interceptors) in `src/utils/`. Static assets belong in `public/`; Vite copies them into `dist/` during build. Generated bundles land in `dist/` and should never be committed.

## Build, Test, and Development Commands

- `npm install` — install exact versions from `package-lock.json`.
- `npm run dev` — launch the Vite dev server with hot reload at `http://localhost:5173`.
- `npm run build` — type-check with `tsc -b` and emit an optimized production bundle into `dist/`.
- `npm run preview` — serve the built bundle locally for sanity checks.
- `npm run lint` — run ESLint across TypeScript/React sources; add `--fix` to auto-resolve safe issues.

## Coding Style & Naming Conventions

Code is TypeScript-first; favor explicit types on public functions and API contracts. Follow ESLint’s recommended + TypeScript + React Hooks rules enforced by `eslint.config.js`. Run Prettier (`npx prettier --check .`) before pushing; default settings assume 2-space indentation and single quotes. Name components in PascalCase (`UserTable`), hooks in camelCase prefixed with `use`, and files to mirror their default export (`LoginPage.tsx`). Keep Chakra UI theming tokens in `src/theme/` and reuse shared styles from there rather than duplicating CSS.

## Testing Guidelines

Automated testing is not yet configured. When introducing new behavior, include manual verification steps in the PR description and, where feasible, add unit tests using `vitest` and `@testing-library/react` in a colocated `__tests__/` directory (install dependencies as part of the change). Aim for meaningful coverage on data transforms and route guards, and mock HTTP calls via the interceptor utilities to keep tests deterministic.

## Commit & Pull Request Guidelines

Match the existing Conventional Commits pattern (`feat:`, `fix:`, `chore:`) and write concise, Spanish-friendly subjects when relevant. Limit commits to a single concern and include context in the body if the change is non-trivial. PRs should describe the motivation, outline functional and visual changes, list testing performed (commands or screenshots), and link to any related issue or task tracker entry. Request review once the lint/build pipeline passes locally and all TODOs are resolved.
