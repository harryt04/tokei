/**
 * Tests for the PostHog server-side client factory.
 * Verifies environment-aware behavior: mock in dev, real in production.
 */

export {} // Ensure this file is treated as a module to avoid variable conflicts

// ─── Mock setup ──────────────────────────────────────────────────────────────

const mockPostHogConstructor = jest.fn()

jest.mock('posthog-node', () => ({
  PostHog: jest.fn((...args: any[]) => {
    mockPostHogConstructor(...args)
    return {
      capture: jest.fn(),
      identify: jest.fn(),
      shutdown: jest.fn(),
    }
  }),
}))

// ─── Test helpers ────────────────────────────────────────────────────────────

const savedEnv = { ...process.env }

beforeEach(() => {
  jest.clearAllMocks()
  // Reset module cache so PostHogClient re-evaluates process.env
  jest.resetModules()
  process.env = { ...savedEnv }
})

afterAll(() => {
  process.env = savedEnv
})

// ═════════════════════════════════════════════════════════════════════════════
// Non-production (development/test)
// ═════════════════════════════════════════════════════════════════════════════

describe('PostHogClient - non-production', () => {
  beforeEach(() => {
    ;(process.env as any).NODE_ENV = 'test'
  })

  it('returns a mock object in development/test', () => {
    const PostHogClient = require('@/lib/posthog-server').default
    const client = PostHogClient()

    expect(client).toBeDefined()
    expect(typeof client.capture).toBe('function')
  })

  it('mock capture is a no-op (does not throw)', () => {
    const PostHogClient = require('@/lib/posthog-server').default
    const client = PostHogClient()

    expect(() =>
      client.capture({ distinctId: 'user-1', event: 'test' }),
    ).not.toThrow()
  })

  it('does not create a real PostHog client in non-production', () => {
    const PostHogClient = require('@/lib/posthog-server').default
    PostHogClient()

    expect(mockPostHogConstructor).not.toHaveBeenCalled()
  })

  it('returns mock even if NEXT_PUBLIC_POSTHOG_KEY is set', () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test_key'
    ;(process.env as any).NODE_ENV = 'development'

    const PostHogClient = require('@/lib/posthog-server').default
    const client = PostHogClient()

    // Should still return mock because not in production
    expect(mockPostHogConstructor).not.toHaveBeenCalled()
    expect(typeof client.capture).toBe('function')
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Production
// ═════════════════════════════════════════════════════════════════════════════

describe('PostHogClient - production', () => {
  beforeEach(() => {
    ;(process.env as any).NODE_ENV = 'production'
  })

  it('throws when NEXT_PUBLIC_POSTHOG_KEY is not set', () => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY

    const PostHogClient = require('@/lib/posthog-server').default

    expect(() => PostHogClient()).toThrow('NEXT_PUBLIC_POSTHOG_KEY is not set')
  })

  it('creates a real PostHog client when key is available', () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test_key'
    process.env.NEXT_PUBLIC_POSTHOG_HOST = 'https://posthog.example.com'

    const PostHogClient = require('@/lib/posthog-server').default
    const client = PostHogClient()

    expect(mockPostHogConstructor).toHaveBeenCalledWith('phc_test_key', {
      host: 'https://posthog.example.com',
      flushAt: 1,
      flushInterval: 0,
    })
    expect(client).toBeDefined()
  })

  it('uses the POSTHOG_HOST env var for the host configuration', () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_key'
    process.env.NEXT_PUBLIC_POSTHOG_HOST = 'https://custom.host.com'

    const PostHogClient = require('@/lib/posthog-server').default
    PostHogClient()

    const [, options] = mockPostHogConstructor.mock.calls[0]
    expect(options.host).toBe('https://custom.host.com')
  })

  it('passes undefined host when POSTHOG_HOST is not set', () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_key'
    delete process.env.NEXT_PUBLIC_POSTHOG_HOST

    const PostHogClient = require('@/lib/posthog-server').default
    PostHogClient()

    const [, options] = mockPostHogConstructor.mock.calls[0]
    expect(options.host).toBeUndefined()
  })

  it('configures immediate flushing (flushAt: 1, flushInterval: 0)', () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_key'

    const PostHogClient = require('@/lib/posthog-server').default
    PostHogClient()

    const [, options] = mockPostHogConstructor.mock.calls[0]
    expect(options.flushAt).toBe(1)
    expect(options.flushInterval).toBe(0)
  })

  it('creates a new client on each call (not a singleton)', () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_key'

    const PostHogClient = require('@/lib/posthog-server').default

    const client1 = PostHogClient()
    const client2 = PostHogClient()

    expect(mockPostHogConstructor).toHaveBeenCalledTimes(2)
    // Different instances
    expect(client1).not.toBe(client2)
  })
})
