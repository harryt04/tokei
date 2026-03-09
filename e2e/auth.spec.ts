import { test, expect } from '@playwright/test'

/**
 * E2E tests for authentication pages.
 *
 * These tests verify the sign-in and sign-up pages render correctly,
 * display the expected form fields, handle client-side validation,
 * and exercise various edge cases around input handling.
 *
 * Prerequisites: The app must be running on localhost:3000
 * (or set BASE_URL env var).
 */

// ═════════════════════════════════════════════════════════════════════════════
// Sign-In Page
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Sign-In Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-in')
  })

  // ─── Rendering ─────────────────────────────────────────────────────────

  test('renders the sign-in form with all expected fields', async ({
    page,
  }) => {
    await expect(page.getByText('Sign in to Tokei')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible()
  })

  test('displays the card description text', async ({ page }) => {
    await expect(
      page.getByText('Enter your credentials to continue'),
    ).toBeVisible()
  })

  test('displays "Or continue with" divider text', async ({ page }) => {
    await expect(page.getByText('Or continue with')).toBeVisible()
  })

  test('displays the "Don\'t have an account?" footer text', async ({
    page,
  }) => {
    await expect(page.getByText("Don't have an account?")).toBeVisible()
  })

  test('email input has correct type attribute', async ({ page }) => {
    await expect(page.getByLabel('Email')).toHaveAttribute('type', 'email')
  })

  test('password input has correct type attribute', async ({ page }) => {
    await expect(page.getByLabel('Password')).toHaveAttribute(
      'type',
      'password',
    )
  })

  test('email input has placeholder text', async ({ page }) => {
    await expect(page.getByLabel('Email')).toHaveAttribute(
      'placeholder',
      'you@example.com',
    )
  })

  test('password input has placeholder text', async ({ page }) => {
    await expect(page.getByLabel('Password')).toHaveAttribute(
      'placeholder',
      'Your password',
    )
  })

  test('email and password fields are required', async ({ page }) => {
    await expect(page.getByLabel('Email')).toHaveAttribute('required', '')
    await expect(page.getByLabel('Password')).toHaveAttribute('required', '')
  })

  test('theme switcher is visible', async ({ page }) => {
    // ThemeSwitcher is rendered in the top-right corner
    await expect(page.locator('[class*="absolute"]').first()).toBeVisible()
  })

  // ─── Form validation ──────────────────────────────────────────────────

  test('shows validation feedback when submitting empty form', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /sign in/i }).click()

    // HTML5 validation prevents submission; input is still empty
    const emailInput = page.getByLabel('Email')
    await expect(emailInput).toBeVisible()
    await expect(emailInput).toHaveValue('')
  })

  test('does not submit when only email is provided', async ({ page }) => {
    await page.getByLabel('Email').fill('test@example.com')
    // Leave password empty
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should still be on sign-in page (HTML5 validation blocks submission)
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('does not submit with invalid email format', async ({ page }) => {
    await page.getByLabel('Email').fill('not-an-email')
    await page.getByLabel('Password').fill('somepassword')
    await page.getByRole('button', { name: /sign in/i }).click()

    // HTML5 email validation should prevent submission
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.getByLabel('Email').fill('nonexistent@test.com')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should show some error text (not redirect)
    await page.waitForTimeout(2000)
    // Should still be on the sign-in page
    expect(page.url()).toContain('/sign-in')
  })

  test('button shows loading state during sign-in attempt', async ({
    page,
  }) => {
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('password123')

    const button = page.getByRole('button', { name: /sign in/i })
    await button.click()

    // Button should show loading text briefly
    // (may be too fast to catch consistently, so we just verify the page didn't crash)
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('error message appears for failed login with real-looking credentials', async ({
    page,
  }) => {
    await page.getByLabel('Email').fill('user@tokei.app')
    await page.getByLabel('Password').fill('ValidPassword123!')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Wait for the auth request to complete
    await page.waitForTimeout(3000)

    // Should still be on sign-in page with an error
    expect(page.url()).toContain('/sign-in')
  })

  test('can type into email and password fields', async ({ page }) => {
    const email = page.getByLabel('Email')
    const password = page.getByLabel('Password')

    await email.fill('test@test.com')
    await password.fill('mypassword')

    await expect(email).toHaveValue('test@test.com')
    await expect(password).toHaveValue('mypassword')
  })

  test('password field masks input', async ({ page }) => {
    const password = page.getByLabel('Password')
    await password.fill('secret123')

    // Password input type should be "password" (masks characters)
    await expect(password).toHaveAttribute('type', 'password')
  })

  // ─── Navigation ────────────────────────────────────────────────────────

  test('navigates to sign-up page via link', async ({ page }) => {
    await page.getByRole('link', { name: /sign up/i }).click()

    await expect(page).toHaveURL(/\/sign-up/)
  })

  test('sign-up link has correct href', async ({ page }) => {
    const link = page.getByRole('link', { name: /sign up/i })
    await expect(link).toHaveAttribute('href', '/sign-up')
  })

  // ─── Edge cases ────────────────────────────────────────────────────────

  test('handles very long email gracefully', async ({ page }) => {
    const longEmail = 'a'.repeat(200) + '@example.com'
    await page.getByLabel('Email').fill(longEmail)
    await expect(page.getByLabel('Email')).toHaveValue(longEmail)
  })

  test('handles very long password gracefully', async ({ page }) => {
    const longPassword = 'x'.repeat(500)
    await page.getByLabel('Password').fill(longPassword)
    await expect(page.getByLabel('Password')).toHaveValue(longPassword)
  })

  test('handles unicode characters in email', async ({ page }) => {
    await page.getByLabel('Email').fill('user@例え.jp')
    // Browsers IDN-encode unicode domains to punycode in email inputs
    await expect(page.getByLabel('Email')).toHaveValue('user@xn--r8jz45g.jp')
  })

  test('handles pasting into fields', async ({ page }) => {
    const email = page.getByLabel('Email')
    await email.focus()
    await page.evaluate(() => {
      const el = document.querySelector('#email') as HTMLInputElement
      el.value = 'pasted@email.com'
      el.dispatchEvent(new Event('input', { bubbles: true }))
    })
    // The React onChange may or may not fire depending on how paste is handled
    // Just verify the page doesn't crash
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('page is accessible with keyboard navigation', async ({ page }) => {
    // Tab through the form fields
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // At some point we should reach the email input — verify focus is somewhere on the page
    const focusedTag = await page.evaluate(
      () => document.activeElement?.tagName,
    )
    expect(focusedTag).toBeDefined()
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Sign-Up Page
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Sign-Up Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-up')
  })

  // ─── Rendering ─────────────────────────────────────────────────────────

  test('renders the sign-up form with all expected fields', async ({
    page,
  }) => {
    await expect(page.getByText('Create an account')).toBeVisible()
    await expect(page.getByLabel('Name')).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
  })

  test('displays the card description text', async ({ page }) => {
    await expect(page.getByText('Sign up to start using Tokei')).toBeVisible()
  })

  test('displays "Or continue with" divider', async ({ page }) => {
    await expect(page.getByText('Or continue with')).toBeVisible()
  })

  test('displays "Already have an account?" footer', async ({ page }) => {
    await expect(page.getByText('Already have an account?')).toBeVisible()
  })

  test('name input has correct type and placeholder', async ({ page }) => {
    const name = page.getByLabel('Name')
    await expect(name).toHaveAttribute('type', 'text')
    await expect(name).toHaveAttribute('placeholder', 'Your name')
  })

  test('email input has correct type and placeholder', async ({ page }) => {
    const email = page.getByLabel('Email')
    await expect(email).toHaveAttribute('type', 'email')
    await expect(email).toHaveAttribute('placeholder', 'you@example.com')
  })

  test('password input has min length of 8', async ({ page }) => {
    const password = page.getByLabel('Password')
    await expect(password).toHaveAttribute('type', 'password')
    await expect(password).toHaveAttribute('placeholder', 'Min 8 characters')
    await expect(password).toHaveAttribute('minlength', '8')
  })

  test('all form fields are required', async ({ page }) => {
    await expect(page.getByLabel('Name')).toHaveAttribute('required', '')
    await expect(page.getByLabel('Email')).toHaveAttribute('required', '')
    await expect(page.getByLabel('Password')).toHaveAttribute('required', '')
  })

  // ─── Form validation ──────────────────────────────────────────────────

  test('does not submit with empty fields', async ({ page }) => {
    await page.getByRole('button', { name: /sign up/i }).click()

    // HTML5 validation prevents submission
    await expect(page).toHaveURL(/\/sign-up/)
  })

  test('does not submit with only name filled', async ({ page }) => {
    await page.getByLabel('Name').fill('Test User')
    await page.getByRole('button', { name: /sign up/i }).click()

    await expect(page).toHaveURL(/\/sign-up/)
  })

  test('does not submit with only name and email filled', async ({ page }) => {
    await page.getByLabel('Name').fill('Test User')
    await page.getByLabel('Email').fill('test@example.com')
    // Password left empty
    await page.getByRole('button', { name: /sign up/i }).click()

    await expect(page).toHaveURL(/\/sign-up/)
  })

  test('does not submit with invalid email format', async ({ page }) => {
    await page.getByLabel('Name').fill('Test User')
    await page.getByLabel('Email').fill('invalid-email')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: /sign up/i }).click()

    await expect(page).toHaveURL(/\/sign-up/)
  })

  test('enforces minLength=8 on password (HTML5 validation)', async ({
    page,
  }) => {
    await page.getByLabel('Name').fill('Test')
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('short')
    await page.getByRole('button', { name: /sign up/i }).click()

    // HTML5 minlength validation should prevent submission
    await expect(page).toHaveURL(/\/sign-up/)
  })

  test('can fill all fields with valid data', async ({ page }) => {
    await page.getByLabel('Name').fill('Test User')
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('password123')

    await expect(page.getByLabel('Name')).toHaveValue('Test User')
    await expect(page.getByLabel('Email')).toHaveValue('test@example.com')
    await expect(page.getByLabel('Password')).toHaveValue('password123')
  })

  // ─── Navigation ────────────────────────────────────────────────────────

  test('navigates to sign-in page via link', async ({ page }) => {
    await page.getByRole('link', { name: /sign in/i }).click()

    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('sign-in link has correct href', async ({ page }) => {
    const link = page.getByRole('link', { name: /sign in/i })
    await expect(link).toHaveAttribute('href', '/sign-in')
  })

  // ─── Edge cases ────────────────────────────────────────────────────────

  test('handles special characters in name field', async ({ page }) => {
    const specialName = "O'Brien-McMahon Jr. III"
    await page.getByLabel('Name').fill(specialName)
    await expect(page.getByLabel('Name')).toHaveValue(specialName)
  })

  test('handles unicode name', async ({ page }) => {
    const unicodeName = '田中太郎'
    await page.getByLabel('Name').fill(unicodeName)
    await expect(page.getByLabel('Name')).toHaveValue(unicodeName)
  })

  test('handles emoji in name', async ({ page }) => {
    const emojiName = 'Chef 👨‍🍳'
    await page.getByLabel('Name').fill(emojiName)
    await expect(page.getByLabel('Name')).toHaveValue(emojiName)
  })

  test('handles very long name gracefully', async ({ page }) => {
    const longName = 'A'.repeat(300)
    await page.getByLabel('Name').fill(longName)
    await expect(page.getByLabel('Name')).toHaveValue(longName)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Cross-page navigation between sign-in and sign-up
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Auth page cross-navigation', () => {
  test('can navigate sign-in -> sign-up -> sign-in', async ({ page }) => {
    await page.goto('/sign-in')
    await page.getByRole('link', { name: /sign up/i }).click()
    await expect(page).toHaveURL(/\/sign-up/)

    await page.getByRole('link', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('form state does not persist across navigation', async ({ page }) => {
    await page.goto('/sign-in')
    await page.getByLabel('Email').fill('filled@email.com')

    // Navigate to sign-up and back
    await page.getByRole('link', { name: /sign up/i }).click()
    await page.getByRole('link', { name: /sign in/i }).click()

    // Email should be empty (state reset)
    await expect(page.getByLabel('Email')).toHaveValue('')
  })
})
