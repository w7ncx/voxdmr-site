# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VoxDMR is a landing and documentation site for VoxDMR — a cross-platform app that streams audio to DMR talkgroups (BrandMeister and other DMR networks) via the Rewind protocol. Available as a Rust desktop app for Linux and Windows (GitHub Releases) and as an Android app on Google Play. Built with React 19, Vite, Tailwind CSS v4, and Framer Motion (via `motion/react`).

## Commands

- `npm run dev` — Start dev server on port 3000
- `npm run build` — Production build to `dist/`
- `npm run lint` — Type-check via `tsc --noEmit` (no ESLint)
- `npm run clean` — Remove `dist/`

## Architecture

Single-page app. The landing page lives in `src/App.tsx` as one component.

- `src/main.tsx` — React entry point; sets up React Router
- `src/App.tsx` — Full landing page (nav, hero, features, CTA, footer)
- `src/PrivacyPage.tsx` — Privacy policy page
- `src/Logo.tsx` — Logo component (renders `/logo.png` with size variants)
- `src/index.css` — Tailwind v4 config using `@theme` directive for custom design tokens
- `src/i18n/` — i18n machinery: `en.json`, `pt.json`, `LanguageContext.tsx`, `LanguageSwitcher.tsx`
- `src/docs/` — Docs section: `DocsLayout.tsx`, `DocsNav.tsx`, `DocsSidebar.tsx`, `DocsContent.tsx`, `config.ts`, `docs.css`, plus the platform toggle (`platform.ts`, `PlatformContext.tsx`, `PlatformSwitcher.tsx`)
- `docs/` — Markdown doc pages (English at root, Portuguese in `docs/pt/`)
- `vite.config.ts` — Vite config with `@` path alias mapped to project root

## Docs authoring: platform-specific content

Each doc page is rendered once, then post-processed in `src/docs/platform.ts` (`tagPlatformSections`) to tag each element with `data-platform="desktop" | "mobile"` where appropriate. The docs root carries `data-platform-filter="<active>"`, and a single CSS rule in `docs.css` hides the non-matching elements. The toggle (`PlatformSwitcher` in `DocsNav`) persists the user's choice to `localStorage`; the default on first visit comes from UA sniffing (mobile UA → mobile, else desktop).

When writing or editing markdown in `docs/` (or `docs/pt/`), the conventions are:

1. **Heading sections** — a heading (h2/h3/h4) becomes platform-specific when its text is:
   - exactly `Desktop` → desktop-only
   - exactly `Android` or `Mobile` → mobile-only
   - ends with `(desktop)` (e.g. `## Input device (desktop)`) → desktop-only
   - ends with `(android)` or `(mobile)` → mobile-only

   Detection is case-insensitive. Every element after a platform heading inherits its platform until the next non-platform heading of equal-or-shallower level closes the section. Nesting works (`## How it's stored` containing `### Desktop` and `### Android` h3s scopes per-h3 while the outer h2 stays always-visible).

2. **Per-image override** — an `<img>` whose alt text ends in `(desktop)` / `(mobile)` / `(android)` tags its wrapping paragraph with that platform. Use this when you want different screenshots on a page that doesn't otherwise split by platform:

   ```markdown
   ![Profile editor (desktop)](/screenshots/profile-editor.png)
   ![Profile editor (mobile)](/screenshots/android-profile-editor.png)
   ```

3. **Default = always visible** — anything not matching the rules above shows in both modes. Use this for intro paragraphs, "Next steps" sections, protocol-agnostic content, etc.

Two surface-level implications when editing existing docs:
- Don't rename `## Desktop` / `## Android` to free-form headings without keeping a `(desktop)` / `(android)` suffix, or the toggle will stop scoping that section.
- When adding Android screenshots later, give them a `(mobile)` alt-text suffix and the desktop counterpart `(desktop)`.

## Styling

Uses Tailwind CSS v4 with the `@tailwindcss/vite` plugin (not PostCSS). Custom theme tokens are defined in `src/index.css` via `@theme {}`:

- Fonts: `font-sans` (Inter), `font-headline` (Poppins)
- Key colors: `vibrant-blue` (#38BDF8), `vibrant-orange` (#FB923C), `community-bg` (#020617), `background` (#0F172A)
- Custom utility: `.soft-shadow`

## Dependencies of Note

- `motion/react` — Animation library (Framer Motion). Import as `motion` from `"motion/react"`.
- `lucide-react` — Icon library
- `express` — Listed but not currently used; placeholder for a future server file
- `marked` — Used in `DocsContent.tsx` to render Markdown docs

## Design Context

### Product

VoxDMR connects to DMR talkgroups (BrandMeister and other DMR networks) via the Rewind protocol. The AMBE+2 vocoder is powered by the MD-380 firmware, downloaded at runtime on first launch (SHA-256 verified). Available on:

- **Desktop** — Rust app for Linux and Windows. Published as binaries on GitHub Releases.
- **Android** — Native app on Google Play (`com.jcalado.voxdmr`).

### Users

Ham radio operators with DMR IDs who want to get on BrandMeister or other DMR networks from their phone or computer without buying a DMR radio. Technically literate; familiar with DMR, BrandMeister, and hotspot concepts.

### Brand Personality

Practical and technical, but with a modern polished feel. Not corporate SaaS. Think a well-designed open-source tool — clean, dark, no fluff.

### Aesthetic Direction

- **Theme**: Dark mode only. Deep slate/navy backgrounds with vibrant accent pops.
- **Colors**: Sky blue (#38BDF8) as primary, orange (#FB923C) as secondary energy color, indigo as tertiary.
- **Typography**: Poppins for bold headlines, Inter for body. Heavy use of uppercase tracking on labels and badges.
- **Shape language**: Very rounded corners (2.5rem–4rem on cards/sections), pill buttons, soft shadows.
- **Motion**: Gentle, smooth animations — entrance fades, floating elements, hover lifts. Never jarring.

### Design Principles

1. **Dark and vibrant** — Deep backgrounds make accent colors pop. Use blue and orange intentionally for hierarchy.
2. **Accessible by default** — WCAG AA minimum. Ensure sufficient contrast on slate backgrounds.
3. **Motion with purpose** — Animations guide attention and add personality, never distract.
4. **No screenshots yet** — VoxDMR doesn't have desktop screenshots ready. The hero uses the logo with a glow effect instead.
