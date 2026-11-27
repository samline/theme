# Changelog

All notable changes to this package. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [semver](https://semver.org/).

## [Unreleased]

### Changed

- Choosing `'system'` (or toggling back to what the system shows) removes the stored entry instead of storing the literal `system`, so following the system is the absence of a choice. When `defaultMode` is another mode the `system` value is still stored. An older stored `system` keeps working.

## [1.1.0] - 2026-11-17

### Changed

- Internal: the DOM controller moved from `src/core` to `src/vanilla`; `src/core` keeps the DOM-free types, constants and helpers. Public entries are unchanged.
- `toggle()` (and `data-theme-toggle`) goes back to `system` when the theme it switches to is the one the operating system shows, instead of storing it. Toggling twice no longer pins the theme against later system changes. With a `defaultMode` other than `system`, it still stores `light` or `dark`.
- The package moved from the `samline/utils` monorepo to its own repository, [samline/theme](https://github.com/samline/theme). Homepage, repository and documentation links point to the package's own site.

### Fixed

- `themeScript()` ignores a `defaultMode` that is not one of `themes` and follows the system, like `createTheme()`. Before, the inline script wrote the unknown name and the controller then switched to the system theme, so the page flashed.

## [1.0.0] - 2026-11-13

### Added

- First release: `createTheme` manages light, dark and system themes, or any named themes, written on `<html>` (or any `target`) as `data-theme` or a class, with `color-scheme`, an optional `<meta name="theme-color">`, a choice remembered in `localStorage` (errors ignored), live system changes while in system mode, sync across tabs, transitions paused while switching, `subscribe`, a `themechange` event and delegated `data-theme-set`, `data-theme-toggle` and `data-theme-select` controls with `aria-pressed` and checked state. `themeScript` returns an inline `<head>` snippet that applies the stored theme before the first paint on server-rendered pages. ESM, CommonJS and a browser global (`window.Theme`) that applies the theme as soon as it loads in `<head>`.
