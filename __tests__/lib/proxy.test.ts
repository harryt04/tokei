/**
 * Tests for the proxy/middleware function that protects routes
 * by checking for the Better Auth session cookie.
 */

import { NextRequest, NextResponse } from 'next/server'

// ─── Mock setup ──────────────────────────────────────────────────────────────

const mockGetSessionCookie = jest.fn()

jest.mock('better-auth/cookies', () => ({
  getSessionCookie: (...args: any[]) => mockGetSessionCookie(...args),
}))

import { proxy, config } from '@/proxy'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRequest(pathname: string): NextRequest {
  return new NextRequest(new URL(pathname, 'http://localhost:3000'))
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ═════════════════════════════════════════════════════════════════════════════
// Protected path detection
// ═════════════════════════════════════════════════════════════════════════════

describe('proxy - protected paths', () => {
  describe('redirects to /sign-in when unauthenticated', () => {
    beforeEach(() => {
      mockGetSessionCookie.mockReturnValue(null)
    })

    it('/freestyle', () => {
      const res = proxy(makeRequest('/freestyle'))
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toContain('/sign-in')
    })

    it('/routines', () => {
      const res = proxy(makeRequest('/routines'))
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toContain('/sign-in')
    })

    it('/routine/ (with trailing slash)', () => {
      const res = proxy(makeRequest('/routine/'))
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toContain('/sign-in')
    })

    it('/routine/some-id', () => {
      const res = proxy(makeRequest('/routine/507f1f77bcf86cd799439011'))
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toContain('/sign-in')
    })

    it('/routines/nested/path', () => {
      const res = proxy(makeRequest('/routines/nested/path'))
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toContain('/sign-in')
    })

    it('/freestyle?param=value (with query params)', () => {
      const res = proxy(makeRequest('/freestyle?tab=timers'))
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toContain('/sign-in')
    })
  })

  describe('does NOT redirect /routine without trailing slash', () => {
    it('/routine (no trailing slash) is NOT in protected paths', () => {
      // protectedPaths includes '/routine/' NOT '/routine'
      // startsWith('/routine/') won't match '/routine'
      mockGetSessionCookie.mockReturnValue(null)

      const res = proxy(makeRequest('/routine'))
      // This path is NOT protected by the proxy
      expect(res.headers.get('location')).toBeNull()
    })
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Public paths (should always pass through)
// ═════════════════════════════════════════════════════════════════════════════

describe('proxy - public paths', () => {
  beforeEach(() => {
    mockGetSessionCookie.mockReturnValue(null) // no cookie
  })

  it('allows / (root)', () => {
    const res = proxy(makeRequest('/'))
    expect(res.headers.get('location')).toBeNull()
  })

  it('allows /sign-in', () => {
    const res = proxy(makeRequest('/sign-in'))
    expect(res.headers.get('location')).toBeNull()
  })

  it('allows /sign-up', () => {
    const res = proxy(makeRequest('/sign-up'))
    expect(res.headers.get('location')).toBeNull()
  })

  it('allows /login', () => {
    const res = proxy(makeRequest('/login'))
    expect(res.headers.get('location')).toBeNull()
  })

  it('allows /api/auth/signin', () => {
    const res = proxy(makeRequest('/api/auth/signin'))
    expect(res.headers.get('location')).toBeNull()
  })

  it('allows any unknown path', () => {
    const res = proxy(makeRequest('/unknown-page'))
    expect(res.headers.get('location')).toBeNull()
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Authenticated user (has cookie)
// ═════════════════════════════════════════════════════════════════════════════

describe('proxy - authenticated user', () => {
  beforeEach(() => {
    mockGetSessionCookie.mockReturnValue('valid-session-cookie-value')
  })

  it('allows /freestyle with valid cookie', () => {
    const res = proxy(makeRequest('/freestyle'))
    expect(res.headers.get('location')).toBeNull()
  })

  it('allows /routines with valid cookie', () => {
    const res = proxy(makeRequest('/routines'))
    expect(res.headers.get('location')).toBeNull()
  })

  it('allows /routine/some-id with valid cookie', () => {
    const res = proxy(makeRequest('/routine/abc123'))
    expect(res.headers.get('location')).toBeNull()
  })

  it('allows public paths with valid cookie', () => {
    const res = proxy(makeRequest('/sign-in'))
    expect(res.headers.get('location')).toBeNull()
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Cookie check behavior
// ═════════════════════════════════════════════════════════════════════════════

describe('proxy - cookie checking', () => {
  it('only checks for cookie existence, not validity', () => {
    // Even a random string cookie should pass the proxy
    mockGetSessionCookie.mockReturnValue('definitely-not-a-real-session')

    const res = proxy(makeRequest('/freestyle'))
    expect(res.headers.get('location')).toBeNull()
  })

  it('treats empty string cookie as falsy (redirects)', () => {
    mockGetSessionCookie.mockReturnValue('')

    const res = proxy(makeRequest('/freestyle'))
    // Empty string is falsy -> !sessionCookie is true
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/sign-in')
  })

  it('passes the request to getSessionCookie', () => {
    mockGetSessionCookie.mockReturnValue(null)

    const req = makeRequest('/freestyle')
    proxy(req)

    expect(mockGetSessionCookie).toHaveBeenCalledWith(req)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Config / matcher
// ═════════════════════════════════════════════════════════════════════════════

describe('proxy config', () => {
  it('exports a matcher array with 2 patterns', () => {
    expect(config.matcher).toHaveLength(2)
  })

  it('first matcher excludes static files', () => {
    const pattern = config.matcher[0]
    // Should be a regex pattern string that excludes _next, images, etc.
    expect(pattern).toContain('_next')
    expect(pattern).toContain('png')
    expect(pattern).toContain('ico')
    expect(pattern).toContain('webmanifest')
  })

  it('second matcher includes API and trpc routes', () => {
    const pattern = config.matcher[1]
    expect(pattern).toContain('api')
    expect(pattern).toContain('trpc')
  })
})
