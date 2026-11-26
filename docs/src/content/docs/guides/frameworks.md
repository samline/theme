---
title: 'Framework integrations'
titleAccent: 'integrations'
description: Use @samline/theme in React, Vue, Svelte, Astro, Next.js, Shopify and WordPress, with the head snippet for no flash and the controller in your components.
locale: en
sidebar:
  group: guides
  order: 4
---

Create one controller for the page and share it. Apply the theme in `<head>` first, with the CDN script or `themeScript()`, so nothing flashes before your bundle runs.

## React

```jsx
import { createTheme } from '@samline/theme'
import { useSyncExternalStore } from 'react'

export const theme = createTheme()

export function useTheme() {
  return useSyncExternalStore(
    theme.subscribe,
    () => theme.theme,
    () => 'light'
  )
}

export function ThemeToggle() {
  const current = useTheme()
  return (
    <button type="button" aria-pressed={current === 'dark'} onClick={theme.toggle}>
      Dark mode
    </button>
  )
}
```

## Next.js

```jsx
import { themeScript } from '@samline/theme'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript() }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

Create the controller in a client component.

## Vue

```vue
<script setup>
import { createTheme } from '@samline/theme'
import { onBeforeUnmount, ref } from 'vue'

const theme = createTheme()
const current = ref(theme.theme)
const stop = theme.subscribe(state => (current.value = state.theme))
onBeforeUnmount(stop)
</script>
```

## Svelte

```svelte
<script>
  import { createTheme } from '@samline/theme'
  import { readable } from 'svelte/store'

  const theme = createTheme()
  const current = readable(theme.theme, set => theme.subscribe(state => set(state.theme)))
</script>

<button type="button" on:click={theme.toggle}>{$current}</button>
```

## Astro

```astro
---
import { themeScript } from '@samline/theme'
---

<head>
  <script is:inline data-astro-rerun set:html={themeScript()} />
</head>

<script>
  import { createTheme } from '@samline/theme'

  createTheme()
</script>
```

With view transitions, `<html>` attributes are replaced on each navigation; `data-astro-rerun` runs the snippet again after every swap. The controller's listeners are on `document` and `window`, so they keep working.

## Shopify

Load the pinned classic script once from theme assets, in `<head>` and without `defer` or `async`, so the stored theme is written on `<html>` before the first paint. Copy `dist/browser/theme.global.js` from the matching published release to `assets/theme.global.js` (the package ships no stylesheet) and add this to `layout/theme.liquid`, before your stylesheets.

```liquid
<head>
  <script src="{{ 'theme.global.js' | asset_url }}"></script>
  {{ 'base.css' | asset_url | stylesheet_tag }}
</head>
```

Keep the rest in your sections: `data-theme-toggle`, `data-theme-set` and `data-theme-select` controls are delegated, so controls inside sections the theme editor adds or re-renders on `shopify:section:load` work with no setup, and nothing needs cleanup on `shopify:section:unload`. Options go on the script tag as `data-themes`, `data-default`, `data-attribute` and `data-storage-key`. See [Shopify's section events](https://shopify.dev/docs/storefronts/themes/best-practices/editor/integrate-sections-and-blocks).

## WordPress

Copy the same pinned `theme.global.js` into your theme and enqueue it in `wp_enqueue_scripts` in the `<head>`. Leave out `'strategy' => 'defer'`: a deferred script runs after the first paint and brings back the flash.

```php
add_action('wp_enqueue_scripts', function () {
  wp_enqueue_script(
    'samline-theme',
    get_theme_file_uri('assets/theme.global.js'),
    [],
    '1.1.0',
    ['in_footer' => false]
  );
});
```

Controls in your templates or Custom HTML blocks work as soon as they are on the page. See [wp_enqueue_script](https://developer.wordpress.org/reference/functions/wp_enqueue_script/).
