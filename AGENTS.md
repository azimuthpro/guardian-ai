# Repository Guidelines

## Project Structure & Module Organization
- Source code lives in `src/` and should export clean, typed entry points for `dist/index.js`.
- Distribution artifacts belong in `dist/` and are generated via the TypeScript compiler; never hand-edit files there.
- Co-locate unit tests beside their subjects under `src/**/__tests__` or `src/**/__fixtures__` to keep monitoring features easy to trace.
- Place shared configuration (e.g., `tsconfig.json`, `.eslintrc`) at the repository root so the published package stays predictable.

## Build, Test, and Development Commands
- Run `npm install` once per clone to hydrate local dependencies.
- Use `npm run build` to compile TypeScript to distributable JavaScript and declaration files in `dist/`.
- Execute `npm test` for the Jest suite; integrate this into your workflow before opening a pull request.
- Lint locally with `npm run lint` to catch style and safety issues early; set your editor to run ESLint on save when possible.

## Coding Style & Naming Conventions
- Follow the ESLint TypeScript rules bundled with the project; they assume ES2020 targets and strict null checks.
- Favor two-space indentation, `camelCase` for variables/functions, and `PascalCase` for classes and exported types.
- Keep modules small and focused: agent monitors, analyzers, and transports should live in separate folders under `src/`.
- Use named exports for public APIs so tree-shaking remains effective for consumers.

## Testing Guidelines
- Write Jest specs in `*.spec.ts` files; mirror the folder structure of the code under test for clarity.
- Mock external services at the boundary and assert on security behaviors (e.g., alert throttling, anomalous event detection).
- Aim for broad coverage of critical monitoring paths; run `npm test -- --coverage` when validating major changes.

## Commit & Pull Request Guidelines
- Adopt Conventional Commits (e.g., `feat: add behavioral anomaly detector`) to keep changelog generation straightforward.
- Group work into logical, reviewable commits, each passing build, lint, and test checks.
- Pull requests should include: concise description, risk assessment, validation notes (commands run), and relevant issue links or screenshots.
- Surface any security-impacting changes explicitly and request focused review from maintainers before merge.
