---
title: 'Accessibility and contrast'
titleAccent: 'contrast'
description: How @samline/theme keeps theme controls accessible, respects the system preference and avoids flashes, and what your CSS still provides.
locale: en
sidebar:
  group: guides
  order: 3
  label: Accessibility
---

## Responsibilities

Theme applies a theme and keeps controls in sync. It guarantees that the stored or system theme is on the page before it paints (when loaded in `<head>`), that controls report their state, and that a change in the system or another tab updates the page. Your CSS provides the colors of each theme and their contrast.

## Keyboard and controls

Use native controls; Theme only reads them:

- `<button data-theme-toggle>` gets `aria-pressed="true"` while dark is in effect. Keep its label stable (for example "Dark mode"), because the pressed state carries the meaning.
- `<button data-theme-set="dark">` gets `aria-pressed="true"` while it is the chosen mode.
- Radios with `data-theme-set` are checked, and `select[data-theme-select]` takes the mode as its value, so their native semantics stay correct.

## Motion and state

- `'system'` follows `prefers-color-scheme` live, so visitors who set a preference in their operating system get it without choosing.
- Transitions are turned off for the instant the theme changes (`disableTransitions`), so the page switches at once instead of fading every color.
- `color-scheme` is written with the theme, so native controls, form fields and scrollbars match it.

## Layout and contrast

Check text, links, focus rings and borders in every theme you define, not only light and dark. Without JavaScript your default CSS applies; repeat the dark values under `@media (prefers-color-scheme: dark)` so those visitors still get their preference (see [Styling and rendering](../layouts/)).
