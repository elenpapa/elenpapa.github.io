# GitHub Copilot Instructions

## Project Vision (docs/plan.md)

- Single-page Vue 3 portfolio with anchor navigation for hero, intro, book timeline, services, posts carousel, contact form, and footer.
- Visual language: light gray + lilac palette, developer-provided logo/typography, transparent media backplates, and smooth scroll-triggered animations.
- Responsive everywhere: nav collapses to a hamburger on small viewports; all sections must look good at 375/768/1024/1280 widths.

## Current State (docs/status.md)

- All core sections/components exist and already consume JSON content via `src/services/content.ts`.
- ESLint + Prettier, Husky + lint-staged, and VS Code settings are configured.
- Scroll animations, responsive passes, and content JSON schema are done.
- Remaining gap: a Lighthouse accessibility/performance pass (≥90) plus any polish that emerges from that review.

## Development Guardrails

- **Content pipeline**: Never hardcode marketing copy; fetch via the typed getters (`getSite`, `getHome`, etc.) that read `public/content/*.json`. Update JSON + associated types when content changes.
- **Styling**: Extend `src/styles/variables.css` for colors/spacing; keep semi-transparent image backgrounds and lilac accents consistent with the plan.
- **Scoped styles**: Keep every component and view styled via dedicated files under `src/styles/components` or `src/styles/views`, imported with `<style scoped src="...">`; promote anything shared into `src/styles/base.css` instead of inline blocks.
- **Animations**: Use the existing IntersectionObserver reveal utility and honor `prefers-reduced-motion`.
- **Responsive nav**: Preserve the hamburger/menu logic already living in `Header.vue` when touching navigation.
- **Assets**: Point to `/images/...` under `public/images` (or update JSON) to avoid broken references highlighted in docs/status notes.
- **SVG icons**: Never hardcode inline SVG markup in components. Extract all SVG icons to separate files in `public/images/common/` and reference them via `<img>` tags.

## Coding Standards

- Stack: Vue 3 + TypeScript + Vite. Use `<script setup lang="ts">`, composition API, and the `@` alias for imports.
- Formatting: Prettier (no semicolons, single quotes, width 100) enforced via VS Code + Husky.
- Lint/type gates: run `npm run lint`, `npm run type-check`, and `npm run build` before opening PRs.
- Tests are manual for now; rely on type-check + Lighthouse runs until automated coverage is added.

## When Adding Features

1. Define/adjust content in `public/content/*.json`, update types in `src/services/content.ts`, and wire components via the service.
2. Favor small, accessible Vue components under `src/components`; reuse shared styles/utilities.
3. Update `docs/status.md` when milestones complete (e.g., Lighthouse scores, new sections, content refreshes).
4. Keep PRs focused on one section/concern; mention if they impact the pending Lighthouse work.

## Outstanding Priorities for Copilot

- Suggest improvements aimed at the pending accessibility/performance audit (semantic markup, ARIA labels, reduced bundle weight).
- Flag any opportunity to enhance scroll reveal without regressing accessibility.
- Surface reminders to verify anchor targets and hamburger behavior after structural changes.
