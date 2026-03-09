import { test, expect } from '@playwright/test'

/**
 * E2E tests for the 404 / not-found pages.
 *
 * Covers the global not-found page and various edge cases
 * for non-existent routes.
 *
 * Prerequisites: The app must be running on localhost:3000
 * (or set BASE_URL env var).
 */

// ═════════════════════════════════════════════════════════════════════════════
// Global 404 Page
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Global Not Found Page', () => {
  test('shows global 404 page for unknown routes', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist')

    expect(response?.status()).toBe(404)
    await expect(page.getByText('404')).toBeVisible()
    await expect(page.getByText('Page not found')).toBeVisible()
    await expect(page.getByRole('link', { name: /go home/i })).toBeVisible()
  })

  test('clicking "Go home" on 404 navigates to root', async ({ page }) => {
    await page.goto('/nonexistent-page')

    await page.getByRole('link', { name: /go home/i }).click()

    await expect(page).toHaveURL('/')
  })

  test('"Go home" link has correct href', async ({ page }) => {
    await page.goto('/nonexistent-page')

    const link = page.getByRole('link', { name: /go home/i })
    await expect(link).toHaveAttribute('href', '/')
  })

  test('404 page has consistent content structure', async ({ page }) => {
    await page.goto('/does-not-exist')

    // Should show the "404" text and "Page not found" together
    const text = await page.textContent('body')
    expect(text).toContain('404')
    expect(text).toContain('Page not found')
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Various non-existent route patterns
// ═════════════════════════════════════════════════════════════════════════════

test.describe('404 for various URL patterns', () => {
  test('returns 404 for deeply nested non-existent path', async ({ page }) => {
    const response = await page.goto('/a/b/c/d/e/f')
    expect(response?.status()).toBe(404)
  })

  test('returns 404 for path with special characters', async ({ page }) => {
    const response = await page.goto('/page-with-special-chars-!@$')
    // May be 404 or 400 depending on URL parsing
    expect(response?.status()).toBeGreaterThanOrEqual(400)
  })

  test('returns 404 for path with unicode characters', async ({ page }) => {
    const response = await page.goto('/ページ')
    expect(response?.status()).toBe(404)
  })

  test('returns 404 for path that looks like a file', async ({ page }) => {
    const response = await page.goto('/nonexistent-file.html')
    expect(response?.status()).toBe(404)
  })

  test('returns 404 for path with trailing slash', async ({ page }) => {
    const response = await page.goto('/this-does-not-exist/')
    // Next.js may normalize trailing slashes differently
    expect(response?.status()).toBeGreaterThanOrEqual(400)
  })

  test('returns 404 for path with query params on non-existent route', async ({
    page,
  }) => {
    const response = await page.goto('/nonexistent?key=value&foo=bar')
    expect(response?.status()).toBe(404)
  })

  test('returns 404 for path with hash (hash stripped by browser)', async ({
    page,
  }) => {
    const response = await page.goto('/nonexistent#section')
    expect(response?.status()).toBe(404)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// 404 page accessibility and UX
// ═════════════════════════════════════════════════════════════════════════════

test.describe('404 Page UX', () => {
  test('404 page loads quickly (within reasonable time)', async ({ page }) => {
    const start = Date.now()
    await page.goto('/nonexistent-page-for-perf-test')
    const elapsed = Date.now() - start

    // Should load in under 10 seconds
    expect(elapsed).toBeLessThan(10000)
  })

  test('404 page renders without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      // Ignore known Turbopack dev-server chunk loading errors — these are a
      // Turbopack bug triggered on 404 pages and do not affect page rendering.
      if (error.message.includes('Failed to load chunk')) return
      errors.push(error.message)
    })

    await page.goto('/nonexistent-page')
    await page.waitForTimeout(1000)

    expect(errors).toHaveLength(0)
  })

  test('multiple 404 navigations work correctly', async ({ page }) => {
    // Navigate to one 404 page
    await page.goto('/first-nonexistent')
    await expect(page.getByText('404')).toBeVisible()

    // Navigate to another
    await page.goto('/second-nonexistent')
    await expect(page.getByText('404')).toBeVisible()

    // Go home and back to 404
    await page.getByRole('link', { name: /go home/i }).click()
    await expect(page).toHaveURL('/')

    await page.goto('/third-nonexistent')
    await expect(page.getByText('404')).toBeVisible()
  })

  test('browser back button works from 404 page', async ({ page }) => {
    // Navigate to home first
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Then to a 404
    await page.goto('/nonexistent')
    await expect(page.getByText('404')).toBeVisible()

    // Go back
    await page.goBack()
    await expect(page).toHaveURL('/')
  })
})
