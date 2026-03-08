import { test, expect } from '@playwright/test'

/**
 * E2E tests for protected route redirects.
 *
 * Unauthenticated users should be redirected to /sign-in when
 * trying to access protected pages. The proxy.ts middleware checks
 * for the Better Auth session cookie.
 *
 * Prerequisites: The app must be running on localhost:3000
 * (or set BASE_URL env var).
 */

test.describe('Protected Route Redirects', () => {
  test('redirects /freestyle to /sign-in when unauthenticated', async ({
    page,
  }) => {
    await page.goto('/freestyle')

    // Should be redirected to sign-in
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('redirects /routines to /sign-in when unauthenticated', async ({
    page,
  }) => {
    await page.goto('/routines')

    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('redirects /routine/some-id to /sign-in when unauthenticated', async ({
    page,
  }) => {
    await page.goto('/routine/507f1f77bcf86cd799439011')

    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('allows access to /sign-in without redirect', async ({ page }) => {
    await page.goto('/sign-in')

    // Should stay on sign-in page (not redirect)
    await expect(page).toHaveURL(/\/sign-in/)
    await expect(page.getByText('Sign in to Tokei')).toBeVisible()
  })

  test('allows access to /sign-up without redirect', async ({ page }) => {
    await page.goto('/sign-up')

    // Should stay on sign-up page (not redirect to sign-in)
    await expect(page).toHaveURL(/\/sign-up/)
    // Wait for client component to hydrate, then check heading
    await expect(
      page.getByText('Create an account', { exact: false }),
    ).toBeVisible({ timeout: 10000 })
  })

  test('root page is accessible (landing page for unauthenticated)', async ({
    page,
  }) => {
    await page.goto('/')

    // Should not redirect to sign-in — the root page shows the landing page
    // when unauthenticated
    await expect(page).not.toHaveURL(/\/sign-in/)
  })
})
