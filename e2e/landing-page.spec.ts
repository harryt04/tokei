import { test, expect } from '@playwright/test'

/**
 * E2E tests for the landing page (/).
 *
 * The landing page is a client component that checks for an active session.
 * - Authenticated users are redirected to /freestyle
 * - Unauthenticated users see the LandingPage component
 *
 * Prerequisites: The app must be running on localhost:3000
 * (or set BASE_URL env var).
 */

// ═════════════════════════════════════════════════════════════════════════════
// Landing page content (unauthenticated)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Landing Page - Unauthenticated', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for client-side hydration
    await page.waitForLoadState('networkidle')
  })

  test('displays the hero section with app name', async ({ page }) => {
    await expect(page.getByText('Master Your Time with Tokei')).toBeVisible({
      timeout: 10000,
    })
  })

  test('displays the app description', async ({ page }) => {
    await expect(
      page.getByText('timer app built for power users', { exact: false }),
    ).toBeVisible({ timeout: 10000 })
  })

  test('displays the header with brand name', async ({ page }) => {
    await expect(page.getByText('Tokei 時計').first()).toBeVisible({
      timeout: 10000,
    })
  })

  test('has a "Get Started" button in the header', async ({ page }) => {
    await expect(page.getByRole('link', { name: /get started/i })).toBeVisible({
      timeout: 10000,
    })
  })

  test('"Get Started" links to /login', async ({ page }) => {
    const link = page.getByRole('link', { name: /get started/i })
    await expect(link).toHaveAttribute('href', '/login')
  })

  test('has a "Start Timing Now" CTA button', async ({ page }) => {
    const ctaButtons = page.getByRole('link', { name: /start timing now/i })
    await expect(ctaButtons.first()).toBeVisible({ timeout: 10000 })
  })

  test('has a GitHub link', async ({ page }) => {
    const githubLink = page.getByRole('link', { name: /github/i }).first()
    await expect(githubLink).toBeVisible({ timeout: 10000 })
  })

  test('GitHub link opens in new tab (target=_blank)', async ({ page }) => {
    const githubLink = page.getByRole('link', { name: /github/i }).first()
    await expect(githubLink).toHaveAttribute('target', '_blank')
  })

  test('GitHub link has noopener noreferrer for security', async ({ page }) => {
    const githubLink = page.getByRole('link', { name: /github/i }).first()
    await expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  // ─── Features section ──────────────────────────────────────────────────

  test('displays the Features section heading', async ({ page }) => {
    await expect(page.getByText('Features')).toBeVisible({ timeout: 10000 })
  })

  test('displays all three feature cards', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Multiple Timers' }),
    ).toBeVisible({
      timeout: 10000,
    })
    await expect(
      page.getByRole('heading', { name: 'Intuitive Interface' }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Free & Open Source' }),
    ).toBeVisible()
  })

  test('feature cards have descriptive text', async ({ page }) => {
    await expect(
      page.getByText('manage numerous timers', { exact: false }),
    ).toBeVisible({ timeout: 10000 })
    await expect(
      page.getByText('quick glances', { exact: false }),
    ).toBeVisible()
    await expect(
      page.getByText('source code available', { exact: false }),
    ).toBeVisible()
  })

  // ─── CTA section ───────────────────────────────────────────────────────

  test('displays "Ready to Get Started?" section', async ({ page }) => {
    await expect(page.getByText('Ready to Get Started?')).toBeVisible({
      timeout: 10000,
    })
  })

  test('displays "Tokei is free forever" text', async ({ page }) => {
    await expect(
      page.getByText('Tokei is free forever', { exact: false }),
    ).toBeVisible({ timeout: 10000 })
  })

  // ─── Footer ────────────────────────────────────────────────────────────

  test('displays footer with author attribution', async ({ page }) => {
    await expect(page.getByText('Built by', { exact: false })).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByText('Harry Thomas', { exact: false })).toBeVisible()
  })

  test('footer has link to author GitHub', async ({ page }) => {
    const authorLink = page.getByRole('link', { name: /harry thomas/i })
    await expect(authorLink).toBeVisible({ timeout: 10000 })
    await expect(authorLink).toHaveAttribute('target', '_blank')
  })

  // ─── Navigation from landing page ──────────────────────────────────────

  test('clicking "Get Started" navigates to sign-in (via /login redirect)', async ({
    page,
  }) => {
    await page.getByRole('link', { name: /get started/i }).click()

    // /login redirects to /sign-in
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('clicking "Start Timing Now" navigates to sign-in (via /login redirect)', async ({
    page,
  }) => {
    await page
      .getByRole('link', { name: /start timing now/i })
      .first()
      .click()

    await expect(page).toHaveURL(/\/sign-in/)
  })

  // ─── Page health ───────────────────────────────────────────────────────

  test('landing page renders without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    expect(errors).toHaveLength(0)
  })

  test('landing page returns 200 status', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// /login redirect
// ═════════════════════════════════════════════════════════════════════════════

test.describe('/login redirect', () => {
  test('/login redirects to /sign-in', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('/login redirect preserves sign-in page content', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Sign in to Tokei')).toBeVisible()
  })

  test('/login with query params redirects to /sign-in', async ({ page }) => {
    await page.goto('/login?source=landing')
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('/login redirect returns proper HTTP status', async ({ page }) => {
    const response = await page.goto('/login')
    // Should be 200 (after redirect) or 307/308 redirect
    expect(response?.status()).toBeLessThan(400)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Theme switcher
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Theme Switcher on Landing Page', () => {
  test('theme switcher is present in the header', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // The landing page header contains the ThemeSwitcher button
    const themeButton = page.getByRole('button', { name: /toggle theme/i })
    await expect(themeButton).toBeVisible({ timeout: 10000 })
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// API route responses (unauthenticated)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('API Routes - Unauthenticated', () => {
  test('GET /api/routines returns 401 without auth', async ({ request }) => {
    const response = await request.get('/api/routines')
    expect(response.status()).toBe(401)

    const body = await response.json()
    expect(body.error).toBe('Unauthorized')
  })

  test('GET /api/routine?id=abc returns 400 or 401', async ({ request }) => {
    const response = await request.get('/api/routine?id=abc')
    // Either 400 (missing ID check first) or 401 (auth check first)
    expect([400, 401]).toContain(response.status())
  })

  test('GET /api/routine without id returns 400', async ({ request }) => {
    const response = await request.get('/api/routine')
    expect(response.status()).toBe(400)
  })

  test('POST /api/routine returns 401 without auth', async ({ request }) => {
    const response = await request.post('/api/routine', {
      data: { name: 'Test Routine' },
    })
    expect(response.status()).toBe(401)
  })

  test('DELETE /api/routine?id=abc returns 400 or 401', async ({ request }) => {
    const response = await request.delete('/api/routine?id=abc')
    expect([400, 401]).toContain(response.status())
  })

  test('DELETE /api/routine without id returns 400', async ({ request }) => {
    const response = await request.delete('/api/routine')
    expect(response.status()).toBe(400)
  })

  test('API returns JSON content type', async ({ request }) => {
    const response = await request.get('/api/routines')
    const contentType = response.headers()['content-type']
    expect(contentType).toContain('application/json')
  })

  test('API error response has consistent shape', async ({ request }) => {
    const response = await request.get('/api/routines')
    const body = await response.json()

    // Error responses should have an 'error' field
    expect(body).toHaveProperty('error')
    expect(typeof body.error).toBe('string')
  })
})
