import { test, expect } from '@playwright/test'

/**
 * E2E tests for the 404 / not-found pages.
 *
 * Prerequisites: The app must be running on localhost:3000
 * (or set BASE_URL env var).
 */

test.describe('Not Found Pages', () => {
  test('shows global 404 page for unknown routes', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist')

    // Next.js returns 404 status
    expect(response?.status()).toBe(404)

    // Should display the 404 message
    await expect(page.getByText('404')).toBeVisible()
    await expect(page.getByText('Page not found')).toBeVisible()

    // Should have a link to go home
    await expect(page.getByRole('link', { name: /go home/i })).toBeVisible()
  })

  test('clicking "Go home" on 404 navigates to root', async ({ page }) => {
    await page.goto('/nonexistent-page')

    await page.getByRole('link', { name: /go home/i }).click()

    await expect(page).toHaveURL('/')
  })
})
