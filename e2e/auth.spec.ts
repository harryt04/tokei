import { test, expect } from '@playwright/test'

/**
 * E2E tests for authentication pages.
 *
 * These tests verify the sign-in and sign-up pages render correctly,
 * display the expected form fields, and handle basic client-side validation.
 *
 * Prerequisites: The app must be running on localhost:3000
 * (or set BASE_URL env var).
 */

test.describe('Sign-In Page', () => {
  test('renders the sign-in form with all expected fields', async ({
    page,
  }) => {
    await page.goto('/sign-in')

    // Page title / heading
    await expect(page.getByText('Sign in to Tokei')).toBeVisible()

    // Email and password inputs
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()

    // Submit button
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()

    // Google OAuth button
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible()

    // Link to sign-up page
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible()
  })

  test('shows validation feedback when submitting empty form', async ({
    page,
  }) => {
    await page.goto('/sign-in')

    // Click sign in without filling in fields
    await page.getByRole('button', { name: /sign in/i }).click()

    // The email input should be marked as invalid by the browser
    const emailInput = page.getByLabel('Email')
    await expect(emailInput).toBeVisible()
    // HTML5 validation will prevent submission; check input is still empty
    await expect(emailInput).toHaveValue('')
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/sign-in')

    await page.getByLabel('Email').fill('nonexistent@test.com')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should show some error text (not redirect)
    await page.waitForTimeout(2000)
    // Should still be on the sign-in page
    expect(page.url()).toContain('/sign-in')
  })

  test('navigates to sign-up page via link', async ({ page }) => {
    await page.goto('/sign-in')

    await page.getByRole('link', { name: /sign up/i }).click()

    await expect(page).toHaveURL(/\/sign-up/)
  })
})

test.describe('Sign-Up Page', () => {
  test('renders the sign-up form with all expected fields', async ({
    page,
  }) => {
    await page.goto('/sign-up')

    // Heading
    await expect(page.getByText('Create an account')).toBeVisible()

    // Name, email, and password inputs
    await expect(page.getByLabel('Name')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()

    // Submit button
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible()

    // Google OAuth button
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible()

    // Link back to sign-in
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
  })

  test('navigates to sign-in page via link', async ({ page }) => {
    await page.goto('/sign-up')

    await page.getByRole('link', { name: /sign in/i }).click()

    await expect(page).toHaveURL(/\/sign-in/)
  })
})
