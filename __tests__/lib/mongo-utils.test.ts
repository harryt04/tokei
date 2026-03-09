/**
 * Tests for lib/mongo-utils.ts — createMongoDbIndexes.
 */

// ─── Mock setup ──────────────────────────────────────────────────────────────

const mockCreateIndexes = jest.fn().mockResolvedValue(undefined)
const mockCreateCollection = jest.fn().mockResolvedValue(undefined)
const mockListCollections = jest.fn()

const mockCollection = jest.fn().mockReturnValue({
  createIndexes: mockCreateIndexes,
})

const mockDb = jest.fn().mockReturnValue({
  collection: mockCollection,
  listCollections: mockListCollections,
  createCollection: mockCreateCollection,
})

jest.mock('@/lib/mongo-client', () => ({
  getMongoClient: jest.fn().mockResolvedValue({ db: mockDb }),
  mongoDBConfig: {
    dbName: 'tokei-test',
    collections: { routines: 'routines' },
  },
}))

import { createMongoDbIndexes } from '@/lib/mongo-utils'

beforeEach(() => {
  jest.clearAllMocks()
  // Restore default implementations (clearAllMocks only resets call history)
  mockCreateIndexes.mockResolvedValue(undefined)
  mockCreateCollection.mockResolvedValue(undefined)
  // Default: collection exists
  mockListCollections.mockReturnValue({
    toArray: jest.fn().mockResolvedValue([{ name: 'routines' }]),
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Happy path
// ═════════════════════════════════════════════════════════════════════════════

describe('createMongoDbIndexes — happy path', () => {
  it('creates indexes on existing routines collection', async () => {
    await createMongoDbIndexes('tokei-test')

    expect(mockDb).toHaveBeenCalledWith('tokei-test')
    expect(mockCollection).toHaveBeenCalledWith('routines')
    expect(mockCreateIndexes).toHaveBeenCalledWith([
      { key: { userId: 1 } },
      { key: { _id: 1 } },
    ])
  })

  it('does not create collection when it already exists', async () => {
    await createMongoDbIndexes('tokei-test')

    expect(mockCreateCollection).not.toHaveBeenCalled()
  })

  it('works with different db names', async () => {
    await createMongoDbIndexes('tokei-production')

    expect(mockDb).toHaveBeenCalledWith('tokei-production')
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Collection does not exist
// ═════════════════════════════════════════════════════════════════════════════

describe('createMongoDbIndexes — collection creation', () => {
  it('creates collection if it does not exist', async () => {
    mockListCollections.mockReturnValue({
      toArray: jest.fn().mockResolvedValue([]), // no collections
    })

    await createMongoDbIndexes('tokei-test')

    expect(mockCreateCollection).toHaveBeenCalledWith('routines')
    expect(mockCreateIndexes).toHaveBeenCalled()
  })

  it('creates collection only for missing ones', async () => {
    mockListCollections.mockReturnValue({
      toArray: jest.fn().mockResolvedValue([{ name: 'other-collection' }]),
    })

    await createMongoDbIndexes('tokei-test')

    // 'routines' not in list, so should be created
    expect(mockCreateCollection).toHaveBeenCalledWith('routines')
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Error handling
// ═════════════════════════════════════════════════════════════════════════════

describe('createMongoDbIndexes — error handling', () => {
  it('propagates error when listCollections fails', async () => {
    mockListCollections.mockReturnValue({
      toArray: jest.fn().mockRejectedValue(new Error('List failed')),
    })

    await expect(createMongoDbIndexes('tokei-test')).rejects.toThrow(
      'List failed',
    )
  })

  it('propagates error when createIndexes fails', async () => {
    mockCreateIndexes.mockRejectedValue(new Error('Index creation failed'))

    await expect(createMongoDbIndexes('tokei-test')).rejects.toThrow(
      'Index creation failed',
    )
  })

  it('propagates error when createCollection fails', async () => {
    mockListCollections.mockReturnValue({
      toArray: jest.fn().mockResolvedValue([]),
    })
    mockCreateCollection.mockRejectedValue(
      new Error('Collection creation failed'),
    )

    await expect(createMongoDbIndexes('tokei-test')).rejects.toThrow(
      'Collection creation failed',
    )
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Logging
// ═════════════════════════════════════════════════════════════════════════════

describe('createMongoDbIndexes — logging', () => {
  it('logs start and success messages', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

    await createMongoDbIndexes('tokei-test')

    expect(consoleSpy).toHaveBeenCalledWith(
      'Ensuring indexes for db: tokei-test ...',
    )
    expect(consoleSpy).toHaveBeenCalledWith(
      'Indexes ensured successfully for db: ',
      'tokei-test',
    )

    consoleSpy.mockRestore()
  })

  it('logs collection creation when collection does not exist', async () => {
    mockListCollections.mockReturnValue({
      toArray: jest.fn().mockResolvedValue([]),
    })

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

    await createMongoDbIndexes('tokei-test')

    expect(consoleSpy).toHaveBeenCalledWith(
      'Collection "routines" does not exist. Creating it...',
    )

    consoleSpy.mockRestore()
  })
})
