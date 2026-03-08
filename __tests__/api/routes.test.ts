/**
 * Unit tests for API route handlers: /api/routine and /api/routines
 *
 * These mock out the auth layer and MongoDB to test the route handler
 * logic in isolation (auth checks, status codes, request validation).
 */

import { NextRequest } from 'next/server'

// ─── Mock setup ──────────────────────────────────────────────────────────────

const mockGetSession = jest.fn()
const mockFindOne = jest.fn()
const mockFind = jest.fn()
const mockInsertOne = jest.fn()
const mockUpdateOne = jest.fn()
const mockDeleteOne = jest.fn()

const mockCollection = jest.fn().mockReturnValue({
  findOne: mockFindOne,
  find: mockFind,
  insertOne: mockInsertOne,
  updateOne: mockUpdateOne,
  deleteOne: mockDeleteOne,
})

const mockDb = jest.fn().mockReturnValue({
  collection: mockCollection,
})

// Mock auth module
jest.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: (...args: any[]) => mockGetSession(...args),
    },
  },
}))

// Mock next/headers
jest.mock('next/headers', () => ({
  headers: jest.fn().mockResolvedValue(new Headers()),
}))

// Mock mongo-client module
jest.mock('@/lib/mongo-client', () => ({
  getMongoClient: jest.fn().mockResolvedValue({ db: mockDb }),
  mongoDBConfig: {
    dbName: 'tokei-test',
    collections: { routines: 'routines' },
  },
}))

// Mock ObjectId — just pass through the string
jest.mock('mongodb', () => ({
  ObjectId: jest.fn((id: string) => id),
}))

// Import route handlers after mocks are set up
import {
  GET as getRoutine,
  POST as postRoutine,
  DELETE as deleteRoutine,
} from '@/app/api/routine/route'
import { GET as getRoutines } from '@/app/api/routines/route'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRequest(url: string, options: any = {}): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options)
}

async function parseJson(response: Response) {
  return response.json()
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── GET /api/routines ───────────────────────────────────────────────────────

describe('GET /api/routines', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    const req = makeRequest('/api/routines')
    const res = await getRoutines(req)

    expect(res.status).toBe(401)
    const body = await parseJson(res)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns routines for authenticated user', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    const routines = [
      { _id: '1', userId: 'user-1', name: 'Morning' },
      { _id: '2', userId: 'user-1', name: 'Evening' },
    ]
    mockFind.mockReturnValue({ toArray: jest.fn().mockResolvedValue(routines) })

    const req = makeRequest('/api/routines')
    const res = await getRoutines(req)

    expect(res.status).toBe(200)
    const body = await parseJson(res)
    expect(body).toEqual(routines)
    expect(mockCollection).toHaveBeenCalledWith('routines')
  })

  it('returns 500 on database error', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockFind.mockImplementation(() => {
      throw new Error('DB connection failed')
    })

    const req = makeRequest('/api/routines')
    const res = await getRoutines(req)

    expect(res.status).toBe(500)
    const body = await parseJson(res)
    expect(body.error).toBe('Internal Server Error')
  })
})

// ─── GET /api/routine?id=... ─────────────────────────────────────────────────

describe('GET /api/routine', () => {
  it('returns 400 when id param is missing', async () => {
    const req = makeRequest('/api/routine')
    const res = await getRoutine(req)

    expect(res.status).toBe(400)
    const body = await parseJson(res)
    expect(body.error).toBe('Missing ID')
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    const req = makeRequest('/api/routine?id=abc')
    const res = await getRoutine(req)

    expect(res.status).toBe(401)
    const body = await parseJson(res)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 404 when routine does not exist', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockFindOne.mockResolvedValue(null)

    const req = makeRequest('/api/routine?id=nonexistent')
    const res = await getRoutine(req)

    expect(res.status).toBe(404)
    const body = await parseJson(res)
    expect(body.error).toBe('Routine not found or unauthorized')
  })

  it('returns 404 when routine belongs to another user', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockFindOne.mockResolvedValue({
      _id: 'abc',
      userId: 'user-2',
      name: 'Not yours',
    })

    const req = makeRequest('/api/routine?id=abc')
    const res = await getRoutine(req)

    expect(res.status).toBe(404)
    const body = await parseJson(res)
    expect(body.error).toBe('Routine not found or unauthorized')
  })

  it('returns the routine when found and owned by user', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    const routine = { _id: 'abc', userId: 'user-1', name: 'My Routine' }
    mockFindOne.mockResolvedValue(routine)

    const req = makeRequest('/api/routine?id=abc')
    const res = await getRoutine(req)

    expect(res.status).toBe(200)
    const body = await parseJson(res)
    expect(body).toEqual(routine)
  })
})

// ─── POST /api/routine ───────────────────────────────────────────────────────

describe('POST /api/routine', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    const req = makeRequest('/api/routine', {
      method: 'POST',
      body: JSON.stringify({ name: 'New' }),
    })
    const res = await postRoutine(req)

    expect(res.status).toBe(401)
  })

  it('creates a new routine when no id is provided', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockInsertOne.mockResolvedValue({ insertedId: 'new-id' })

    const req = makeRequest('/api/routine', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Routine' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await postRoutine(req)

    expect(res.status).toBe(200)
    const body = await parseJson(res)
    expect(body.success).toBe(true)
    expect(body.updatedRoutine.name).toBe('New Routine')
    expect(body.updatedRoutine.userId).toBe('user-1')
    expect(body.updatedRoutine.updatedAt).toBeDefined()
  })

  it('updates an existing routine when id is provided', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockFindOne.mockResolvedValue({
      _id: 'existing-id',
      userId: 'user-1',
      name: 'Old Name',
    })
    mockUpdateOne.mockResolvedValue({ modifiedCount: 1 })

    const req = makeRequest('/api/routine?id=existing-id', {
      method: 'POST',
      body: JSON.stringify({ name: 'Updated Name' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await postRoutine(req)

    expect(res.status).toBe(200)
    const body = await parseJson(res)
    expect(body.success).toBe(true)
    expect(body.updatedCount).toBe(1)
    expect(body.updatedRoutine.name).toBe('Updated Name')
    expect(body.updatedRoutine.userId).toBe('user-1')
  })

  it('inserts when id is provided but routine does not exist', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockFindOne.mockResolvedValue(null) // not found
    mockInsertOne.mockResolvedValue({ insertedId: 'new-id' })

    const req = makeRequest('/api/routine?id=nonexistent', {
      method: 'POST',
      body: JSON.stringify({ name: 'Fallback Insert' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await postRoutine(req)

    expect(res.status).toBe(200)
    const body = await parseJson(res)
    expect(body.success).toBe(true)
    expect(mockInsertOne).toHaveBeenCalled()
  })
})

// ─── DELETE /api/routine?id=... ──────────────────────────────────────────────

describe('DELETE /api/routine', () => {
  it('returns 400 when id param is missing', async () => {
    const req = makeRequest('/api/routine', { method: 'DELETE' })
    const res = await deleteRoutine(req)

    expect(res.status).toBe(400)
    const body = await parseJson(res)
    expect(body.error).toBe('Missing ID')
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    const req = makeRequest('/api/routine?id=abc', { method: 'DELETE' })
    const res = await deleteRoutine(req)

    expect(res.status).toBe(401)
  })

  it('returns 404 when routine does not exist', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockFindOne.mockResolvedValue(null)

    const req = makeRequest('/api/routine?id=abc', { method: 'DELETE' })
    const res = await deleteRoutine(req)

    expect(res.status).toBe(404)
  })

  it("returns 404 when trying to delete another user's routine", async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockFindOne.mockResolvedValue({ _id: 'abc', userId: 'user-2' })

    const req = makeRequest('/api/routine?id=abc', { method: 'DELETE' })
    const res = await deleteRoutine(req)

    expect(res.status).toBe(404)
    const body = await parseJson(res)
    expect(body.error).toBe('Routine not found or unauthorized')
  })

  it('deletes the routine and returns success', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockFindOne.mockResolvedValue({ _id: 'abc', userId: 'user-1' })
    mockDeleteOne.mockResolvedValue({ deletedCount: 1 })

    const req = makeRequest('/api/routine?id=abc', { method: 'DELETE' })
    const res = await deleteRoutine(req)

    expect(res.status).toBe(200)
    const body = await parseJson(res)
    expect(body.success).toBe(true)
    expect(body.deletedCount).toBe(1)
  })
})
