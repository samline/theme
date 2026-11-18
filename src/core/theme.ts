// DOM-free part of theme: types, constants and pure helpers. The DOM
// controller lives in src/vanilla/theme.ts.

/** A theme name, or `'system'` to follow the operating system. */
export type ThemeMode = string

export interface ThemeState {
  /** What was chosen: a theme name or `'system'`. */
  mode: ThemeMode
  /** The theme in effect: `'system'` resolved to `'light'` or `'dark'`. */
  theme: string
}

export interface ThemeOptions {
  /** Themes that can be chosen, besides `'system'`. Defaults to `['light', 'dark']`. */
  themes?: string[]
  /** Mode used when nothing is stored. Defaults to `'system'`. */
  defaultMode?: ThemeMode
  /**
   * How the theme is written on the target: an attribute name (`'data-theme'`)
   * or `'class'` to add the theme as a class. Defaults to `'data-theme'`.
   */
  attribute?: string
  /**
   * Element that receives the theme, for themed widgets or previews: an
   * element or a selector. Defaults to `<html>`.
   */
  target?: Element | string
  /**
   * Browser UI color per theme, written to `<meta name="theme-color">`, for
   * example `{ light: '#ffffff', dark: '#111111' }`.
   */
  themeColor?: Record<string, string>
  /** localStorage key, or `false` to not remember the choice. Defaults to `'theme'`. */
  storageKey?: string | false
  /** Set `color-scheme` on the target for light and dark, so native controls follow. Defaults to `true`. */
  colorScheme?: boolean
  /** Turn CSS transitions off while switching, so the page does not animate. Defaults to `true`. */
  disableTransitions?: boolean
  /**
   * Handle `[data-theme-set]`, `[data-theme-toggle]` and `select[data-theme-select]`
   * controls. Defaults to `true`.
   */
  controls?: boolean
  /** Where controls are looked for. Defaults to `document`. */
  scope?: ParentNode
  /** Called whenever the mode or the resolved theme changes. */
  onChange?: (state: ThemeState) => void
}

export interface Theme {
  /** What was chosen: a theme name or `'system'`. */
  readonly mode: ThemeMode
  /** The theme in effect. */
  readonly theme: string
  /** Choose a theme name or `'system'`. Unknown names are ignored. */
  set: (mode: ThemeMode) => void
  /** Switch between light and dark, from the theme in effect. */
  toggle: () => void
  /** Listen to changes. Returns an unsubscribe function. */
  subscribe: (listener: (state: ThemeState) => void) => () => void
  /** Stop listening to the system, other tabs and controls. The theme stays applied. */
  destroy: () => void
}

export const SYSTEM = 'system'
export const EVENT = 'themechange'
export const DARK_QUERY = '(prefers-color-scheme: dark)'
export const SETTERS = '[data-theme-set]'
export const TOGGLES = '[data-theme-toggle]'
export const SELECTS = 'select[data-theme-select]'

export const defaults = {
  themes: ['light', 'dark'],
  defaultMode: SYSTEM,
  attribute: 'data-theme',
  storageKey: 'theme' as string | false,
}

/** `'auto'` (older markup) means `'system'`; anything unknown is `null`. */
export const normalize = (value: string | null | undefined, themes: string[]): ThemeMode | null => {
  if (!value) return null
  const mode = value === 'auto' ? SYSTEM : value
  return mode === SYSTEM || themes.includes(mode) ? mode : null
}

/**
 * A small inline script for `<head>` that applies the stored theme before
 * the page paints, so a dark page never flashes light. Pass the same
 * `themes`, `defaultMode`, `attribute`, `storageKey`, `colorScheme` and
 * `themeColor` you give `createTheme`. It always writes on `<html>`.
 */
export const themeScript = (
  options: Pick<
    ThemeOptions,
    'themes' | 'defaultMode' | 'attribute' | 'storageKey' | 'colorScheme' | 'themeColor'
  > = {}
): string => {
  const themes = options.themes?.length ? options.themes : defaults.themes
  const config = {
    t: themes,
    // Same fallback as createTheme, so the first paint and the controller agree.
    d: normalize(options.defaultMode, themes) ?? defaults.defaultMode,
    a: options.attribute ?? defaults.attribute,
    k: options.storageKey === undefined ? defaults.storageKey : options.storageKey,
    c: options.colorScheme ?? true,
    m: options.themeColor ?? {},
  }
  return `(function(o){var m=null,r=document.documentElement;try{m=o.k&&localStorage.getItem(o.k)}catch(e){}if(m==="auto")m="system";if(m!=="system"&&o.t.indexOf(m)<0)m=o.d==="auto"?"system":o.d;var t=m==="system"?(window.matchMedia&&matchMedia("${DARK_QUERY}").matches?"dark":"light"):m;if(o.a==="class")r.classList.add(t);else r.setAttribute(o.a,t);if(o.c&&(t==="light"||t==="dark"))r.style.colorScheme=t;if(o.m[t]){var e=document.querySelector('meta[name="theme-color"]');if(!e){e=document.createElement("meta");e.name="theme-color";document.head.appendChild(e)}e.content=o.m[t]}})(${JSON.stringify(config).replace(/</g, '\\u003c')})`
}
