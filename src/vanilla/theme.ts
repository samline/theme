import { isBrowser } from '@samline/internal'
import {
  type ThemeMode,
  type ThemeState,
  type ThemeOptions,
  type Theme,
  SYSTEM,
  EVENT,
  DARK_QUERY,
  SETTERS,
  TOGGLES,
  SELECTS,
  defaults,
  normalize,
} from '../core/theme.js'

const readStored = (key: string | false): string | null => {
  if (!key) return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

const writeStored = (key: string | false, value: string) => {
  if (!key) return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Private mode or blocked storage: the choice lasts for this page only.
  }
}

const prefersDark = () =>
  typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches

/** Turn transitions off; the returned function restores them once the change is styled. */
const suppressTransitions = () => {
  const style = document.createElement('style')
  style.textContent = '*,*::before,*::after{transition:none!important}'
  document.head.appendChild(style)
  return () => {
    // Style the new theme while transitions are off, then let them run again.
    void window.getComputedStyle(document.body ?? document.documentElement).opacity
    setTimeout(() => style.remove(), 1)
  }
}

/**
 * Manage the page theme: read the stored choice, resolve `'system'` from the
 * operating system, write it on `<html>` (or `target`), remember changes, and
 * follow the system and other tabs. Controls with `data-theme-set`,
 * `data-theme-toggle` or `data-theme-select` work anywhere in `scope`.
 */
export const createTheme = (options: ThemeOptions = {}): Theme => {
  const themes = options.themes?.length ? options.themes : defaults.themes
  const attribute = options.attribute ?? defaults.attribute
  const storageKey = options.storageKey === undefined ? defaults.storageKey : options.storageKey
  const fallback = normalize(options.defaultMode, themes) ?? defaults.defaultMode
  const colorScheme = options.colorScheme ?? true
  const listeners = new Set<(state: ThemeState) => void>()
  if (options.onChange) listeners.add(options.onChange)

  const resolve = (mode: ThemeMode) => (mode === SYSTEM ? (prefersDark() ? 'dark' : 'light') : mode)

  if (!isBrowser()) {
    const theme = resolve(fallback)
    return {
      mode: fallback,
      theme,
      set: () => {},
      toggle: () => {},
      subscribe: () => () => {},
      destroy: () => {},
    }
  }

  const root =
    (typeof options.target === 'string'
      ? document.querySelector(options.target)
      : options.target) ?? document.documentElement
  const scope: ParentNode = options.scope ?? document
  const listenOn = scope as unknown as Document
  let mode: ThemeMode = normalize(readStored(storageKey), themes) ?? fallback
  let theme = ''

  const write = (next: string) => {
    if (attribute === 'class') {
      root.classList.remove(...themes.filter(name => name !== next))
      root.classList.add(next)
    } else {
      root.setAttribute(attribute, next)
    }
    const style = (root as HTMLElement).style
    if (colorScheme && style) {
      if (next === 'light' || next === 'dark') style.colorScheme = next
      else style.removeProperty('color-scheme')
    }
    const color = options.themeColor?.[next]
    if (color) {
      let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      if (!meta) {
        meta = document.createElement('meta')
        meta.name = 'theme-color'
        document.head.appendChild(meta)
      }
      meta.content = color
    }
  }

  const syncControls = () => {
    if (options.controls === false) return
    scope.querySelectorAll<HTMLElement>(SETTERS).forEach(control => {
      const on = normalize(control.getAttribute('data-theme-set'), themes) === mode
      if (control instanceof HTMLInputElement) control.checked = on
      else control.setAttribute('aria-pressed', String(on))
    })
    scope.querySelectorAll<HTMLElement>(TOGGLES).forEach(control => {
      control.setAttribute('aria-pressed', String(theme === 'dark'))
    })
    scope.querySelectorAll<HTMLSelectElement>(SELECTS).forEach(select => {
      select.value = mode
    })
  }

  /** Apply `next`; `animate` is false on the first paint. */
  const apply = (nextMode: ThemeMode, animate: boolean) => {
    const nextTheme = resolve(nextMode)
    const changed = nextMode !== mode || nextTheme !== theme
    mode = nextMode
    if (nextTheme !== theme) {
      const restore = animate && options.disableTransitions !== false ? suppressTransitions() : null
      theme = nextTheme
      write(theme)
      restore?.()
    }
    syncControls()
    if (!changed || !animate) return
    const state = { mode, theme }
    listeners.forEach(listener => listener(state))
    root.dispatchEvent(new CustomEvent(EVENT, { detail: state, bubbles: true }))
  }

  const set = (next: ThemeMode) => {
    const valid = normalize(next, themes)
    if (!valid) return
    writeStored(storageKey, valid)
    apply(valid, true)
  }

  // Switch to the opposite of what is shown. When that is what the system
  // already shows, the user is undoing an override: follow the system again
  // instead of storing a value that would pin the theme against later changes.
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    const followsSystem = fallback === SYSTEM && typeof window.matchMedia === 'function'
    set(followsSystem && next === resolve(SYSTEM) ? SYSTEM : next)
  }

  // The system preference only matters while following it.
  const query = typeof window.matchMedia === 'function' ? window.matchMedia(DARK_QUERY) : null
  const onSystem = () => {
    if (mode === SYSTEM) apply(SYSTEM, true)
  }
  // Another tab changed the choice.
  const onStorage = (event: StorageEvent) => {
    if (!storageKey || event.key !== storageKey) return
    apply(normalize(event.newValue, themes) ?? fallback, true)
  }
  const onClick = (event: Event) => {
    const target = event.target as Element | null
    const toggleControl = target?.closest?.(TOGGLES)
    if (toggleControl) return toggle()
    const setter = target?.closest?.(SETTERS)
    if (setter && !(setter instanceof HTMLInputElement)) set(setter.getAttribute('data-theme-set')!)
  }
  const onInput = (event: Event) => {
    const target = event.target as HTMLInputElement | HTMLSelectElement
    if (target.matches?.(SELECTS)) set(target.value)
    else if (target.matches?.(`input${SETTERS}`) && (target as HTMLInputElement).checked) {
      set(target.getAttribute('data-theme-set')!)
    }
  }
  const onReady = () => syncControls()

  apply(mode, false)

  query?.addEventListener('change', onSystem)
  window.addEventListener('storage', onStorage)
  if (options.controls !== false) {
    listenOn.addEventListener('click', onClick)
    listenOn.addEventListener('change', onInput)
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onReady, { once: true })
    }
  }

  return {
    get mode() {
      return mode
    },
    get theme() {
      return theme
    },
    set,
    toggle,
    subscribe: listener => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    destroy: () => {
      query?.removeEventListener('change', onSystem)
      window.removeEventListener('storage', onStorage)
      listenOn.removeEventListener('click', onClick)
      listenOn.removeEventListener('change', onInput)
      document.removeEventListener('DOMContentLoaded', onReady)
      listeners.clear()
    },
  }
}
