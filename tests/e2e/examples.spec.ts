// The website shows each example twice: a live preview and copyable files
// (site/examples.ts) that load the browser bundle. These tests run the copyable
// files against the built bundle, so the code people copy keeps working.
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

import themeExamples from '../../site/examples'

const bundle = (pkg: string) =>
  fileURLToPath(new URL(`../../dist/browser/${pkg}.global.js`, import.meta.url))

type Example = { id: string; files: { html: string; css?: string; js: string } }

const open = async (page: import('@playwright/test').Page, pkg: string, example: Example) => {
  await page.setContent(
    `<!doctype html><html><head><style>${example.files.css ?? ''}</style></head><body><main>${example.files.html}</main></body></html>`
  )
  await page.addScriptTag({ path: bundle(pkg) })
  await page.addScriptTag({ content: example.files.js })
}

const find = <T extends Example>(list: readonly T[], id: string) =>
  list.find(item => item.id === id)!

test.describe('theme copyable examples', () => {
  type Page = import('@playwright/test').Page
  // Like the copied index.html: the bundle in the head, with the example's
  // script tag attributes, then the example script at the end of the body.
  const openDocument = async (
    page: Page,
    example: Example & { cdnScript?: { attributes?: Readonly<Record<string, string>> } }
  ) => {
    const script = readFileSync(bundle('theme'), 'utf8')
    const attributes = Object.entries(example.cdnScript?.attributes ?? {})
      .map(([name, value]) => ` ${name}="${value}"`)
      .join('')
    const body = `<!doctype html><html lang="en"><head><script${attributes}>${script}</script><style>${example.files.css ?? ''}</style></head><body><main>${example.files.html}</main><script>${example.files.js}</script></body></html>`
    await page.emulateMedia({ colorScheme: 'light' })
    // A real origin, so the choice is stored like on a site.
    await page.unroute('http://theme.test/')
    await page.route('http://theme.test/', route =>
      route.fulfill({ contentType: 'text/html', body })
    )
    await page.goto('http://theme.test/')
  }
  const html = (page: Page) => page.locator('html')

  test('the toggle switches dark mode and reports it', async ({ page }) => {
    await openDocument(page, find(themeExamples, 'toggle'))
    const toggle = page.getByRole('button', { name: 'Dark mode' })
    await expect(html(page)).toHaveAttribute('data-theme', 'light')
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await toggle.click()
    await expect(html(page)).toHaveAttribute('data-theme', 'dark')
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.emulateMedia({ colorScheme: 'light' })
    await expect(html(page)).toHaveAttribute('data-theme', 'dark')
  })

  test('buttons and the select stay in sync and report changes', async ({ page }) => {
    await openDocument(page, find(themeExamples, 'picker'))
    await expect(page.locator('#status')).toHaveText('Following the system: light')
    await page.getByRole('button', { name: 'Dark' }).click()
    await expect(page.locator('select')).toHaveValue('dark')
    await expect(page.locator('#status')).toHaveText('Chosen: dark')
    await page.locator('select').selectOption('system')
    await expect(page.getByRole('button', { name: 'System' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    await expect(html(page)).toHaveAttribute('data-theme', 'light')
    await page.emulateMedia({ colorScheme: 'dark' })
    await expect(page.locator('#status')).toHaveText('Following the system: dark')
  })

  test('custom themes are written as a class with a theme color', async ({ page }) => {
    await openDocument(page, find(themeExamples, 'custom'))
    await expect(page.getByLabel('Light')).toBeChecked()
    await page.getByLabel('Sepia').check()
    await expect(html(page)).toHaveClass('sepia')
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#f4ecd8')
    await page.getByLabel('Dark').check()
    await expect(html(page)).toHaveClass('dark')
    await expect(html(page)).toHaveCSS('color-scheme', 'dark')
  })

  test('a stored custom theme is on the page before the example script runs', async ({ page }) => {
    const example = find(themeExamples, 'custom')
    await openDocument(page, example)
    await page.getByLabel('Sepia').check()
    // Reload without the example script: the script tag alone must restore sepia.
    await openDocument(page, { ...example, files: { ...example.files, js: '' } })
    await expect(html(page)).toHaveClass('sepia')
    await expect(page.getByLabel('Sepia')).toBeChecked()
  })
})
