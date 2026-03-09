/**
 * Comprehensive unit tests for API route handlers.
 * Tests /api/routine (GET, POST, DELETE) and /api/routines (GET).
 *
 * Mocks: auth, MongoDB, next/headers, ObjectId
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

jest.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: (...args: any[]) => mockGetSession(...args),
    },
  },
}))

jest.mock('next/headers', () => ({
  headers: jest.fn().mockResolvedValue(new Headers()),
}))

jest.mock('@/lib/mongo-client', () => ({
  getMongoClient: jest.fn().mockResolvedValue({ db: mockDb }),
  mongoDBConfig: {
    dbName: 'tokei-test',
    collections: { routines: 'routines' },
  },
}))

jest.mock('mongodb', () => ({
  ObjectId: jest.fn((id: string) => id),
}))

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

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/routines
// ═════════════════════════════════════════════════════════════════════════════

describe('GET /api/routines', () => {
  it('returns 401 when session is null', async () => {
    mockGetSession.mockResolvedValue(null)

    const res = await getRoutines(makeRequest('/api/routines'))

    expect(res.status).toBe(401)
    expect(await parseJson(res)).toEqual({ error: 'Unauthorized' })
  })

  it('returns 401 when session has no user', async () => {
    mockGetSession.mockResolvedValue({ user: null })

    const res = await getRoutines(makeRequest('/api/routines'))

    expect(res.status).toBe(401)
  })

  it('returns 401 when session.user has no id', async () => {
    mockGetSession.mockResolvedValue({ user: { id: '' } })

    const res = await getRoutines(makeRequest('/api/routines'))

    expect(res.status).toBe(401)
  })

  it('returns 401 when session.user.id is undefined', async () => {
    mockGetSession.mockResolvedValue({ user: { id: undefined } })

    const res = await getRoutines(makeRequest('/api/routines'))

    expect(res.status).toBe(401)
  })

  it('returns routines for authenticated user', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    const routines = [
      { _id: '1', userId: 'user-1', name: 'Morning' },
      { _id: '2', userId: 'user-1', name: 'Evening' },
    ]
    mockFind.mockReturnValue({
      toArray: jest.fn().mockResolvedValue(routines),
    })

    const res = await getRoutines(makeRequest('/api/routines'))

    expect(res.status).toBe(200)
    expect(await parseJson(res)).toEqual(routines)
  })

  it('returns empty array when user has no routines', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockFind.mockReturnValue({
      toArray: jest.fn().mockResolvedValue([]),
    })

    const res = await getRoutines(makeRequest('/api/routines'))

    expect(res.status).toBe(200)
    expect(await parseJson(res)).toEqual([])
  })

  it('queries with the correct userId filter', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'specific-user' } })
    mockFind.mockReturnValue({
      toArray: jest.fn().mockResolvedValue([]),
    })

    await getRoutines(makeRequest('/api/routines'))

    expect(mockFind).toHaveBeenCalledWith({ userId: 'specific-user' })
  })

  it('uses the correct collection name', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockFind.mockReturnValue({
      toArray: jest.fn().mockResolvedValue([]),
    })

    await getRoutines(makeRequest('/api/routines'))

    expect(mockCollection).toHaveBeenCalledWith('routines')
  })

  it('returns 500 on database error', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockFind.mockImplementation(() => {
      throw new Error('DB connection failed')
    })

    const res = await getRoutines(makeRequest('/api/routines'))

    expect(res.status).toBe(500)
    expect(await parseJson(res)).toEqual({ error: 'Internal Server Error' })
  })

  it('returns 500 when toArray rejects', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockFind.mockReturnValue({
      toArray: jest.fn().mockRejectedValue(new Error('Cursor error')),
    })

    const res = await getRoutines(makeRequest('/api/routines'))

    expect(res.status).toBe(500)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/routine?id=...
// ═════════════════════════════════════════════════════════════════════════════

describe('GET /api/routine', () => {
  it('returns 400 when id param is missing', async () => {
    const res = await getRoutine(makeRequest('/api/routine'))

    expect(res.status).toBe(400)
    expect(await parseJson(res)).toEqual({ error: 'Missing ID' })
  })

  it('returns 400 when id param is empty string', async () => {
    const res = await getRoutine(makeRequest('/api/routine?id='))

    // Empty string is truthy for the check (!id), but "" is falsy
    // Actually: !("") === true, so it returns 400
    expect(res.status).toBe(400)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    const res = await getRoutine(makeRequest('/api/routine?id=abc'))

    expect(res.status).toBe(401)
    expect(await parseJson(res)).toEqual({ error: 'Unauthorized' })
  })

  it('returns 401 when session.user is null', async () => {
    mockGetSession.mockResolvedValue({ user: null })

    const res = await getRoutine(makeRequest('/api/routine?id=abc'))

    expect(res.status).toBe(401)
  })

  it('returns 404 when routine does not exist', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockFindOne.mockResolvedValue(null)

    const res = await getRoutine(makeRequest('/api/routine?id=nonexistent'))

    expect(res.status).toBe(404)
    expect(await parseJson(res)).toEqual({
      error: 'Routine not found or unauthorized',
    })
  })

  it('returns 404 when routine belongs to another user (authorization)', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockFindOne.mockResolvedValue({
      _id: 'abc',
      userId: 'user-2',
      name: 'Not yours',
    })

    const res = await getRoutine(makeRequest('/api/routine?id=abc'))

    expect(res.status).toBe(404)
    expect(await parseJson(res)).toEqual({
      error: 'Routine not found or unauthorized',
    })
  })

  it('does not distinguish between not-found and unauthorized (security)', async () => {
    // Both cases return 404 with the same message — prevents ID enumeration
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })

    mockFindOne.mockResolvedValue(null)
    const res1 = await getRoutine(makeRequest('/api/routine?id=not-found'))

    mockFindOne.mockResolvedValue({ _id: 'abc', userId: 'other-user' })
    const res2 = await getRoutine(makeRequest('/api/routine?id=abc'))

    const body1 = await parseJson(res1)
    const body2 = await parseJson(res2)

    expect(body1.error).toBe(body2.error)
    expect(res1.status).toBe(res2.status)
  })

  it('returns the routine when found and owned by user', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    const routine = {
      _id: 'abc',
      userId: 'user-1',
      name: 'My Routine',
      swimLanes: [],
      notes: 'test',
    }
    mockFindOne.mockResolvedValue(routine)

    const res = await getRoutine(makeRequest('/api/routine?id=abc'))

    expect(res.status).toBe(200)
    expect(await parseJson(res)).toEqual(routine)
  })

  it('returns 500 when findOne throws (e.g., invalid ObjectId)', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockFindOne.mockRejectedValue(new Error('Invalid ObjectId'))

    const res = await getRoutine(makeRequest('/api/routine?id=invalid!!!'))

    expect(res.status).toBe(500)
    expect(await parseJson(res)).toEqual({ error: 'Internal Server Error' })
  })

  it('returns 500 on unexpected database error', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockFindOne.mockRejectedValue(new Error('Connection timeout'))

    const res = await getRoutine(makeRequest('/api/routine?id=abc'))

    expect(res.status).toBe(500)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/routine
// ═════════════════════════════════════════════════════════════════════════════

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

  it('returns 401 when session.user.id is empty', async () => {
    mockGetSession.mockResolvedValue({ user: { id: '' } })

    const req = makeRequest('/api/routine', {
      method: 'POST',
      body: JSON.stringify({ name: 'New' }),
    })
    const res = await postRoutine(req)

    expect(res.status).toBe(401)
  })

  // ─── Create (no id param) ──────────────────────────────────────────────

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
    expect(body.updatedCount).toBe(1)
    expect(body.updatedRoutine.name).toBe('New Routine')
    expect(body.updatedRoutine.userId).toBe('user-1')
    expect(body.updatedRoutine.updatedAt).toBeDefined()
  })

  it('always stamps the authenticated userId on new routines', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'real-user' } })
    mockInsertOne.mockResolvedValue({ insertedId: 'new-id' })

    // Body tries to set a different userId
    const req = makeRequest('/api/routine', {
      method: 'POST',
      body: JSON.stringify({ name: 'Hack', userId: 'attacker' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await postRoutine(req)

    const body = await parseJson(res)
    // The server should overwrite the userId with the session user's id
    expect(body.updatedRoutine.userId).toBe('real-user')
  })

  it('insertOne is called and awaited on create', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockInsertOne.mockResolvedValue({ insertedId: 'new-id' })

    const req = makeRequest('/api/routine', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test' }),
      headers: { 'Content-Type': 'application/json' },
    })
    await postRoutine(req)

    expect(mockInsertOne).toHaveBeenCalled()
    const insertedDoc = mockInsertOne.mock.calls[0][0]
    expect(insertedDoc.name).toBe('Test')
    expect(insertedDoc.userId).toBe('user-1')
    expect(insertedDoc.updatedAt).toBeInstanceOf(Date)
  })

  // ─── Update (id param present, routine exists) ─────────────────────────

  it('updates an existing routine when id is provided and exists', async () => {
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
  })

  it('strips _id from the update payload to avoid overwriting MongoDB _id', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockFindOne.mockResolvedValue({
      _id: 'existing-id',
      userId: 'user-1',
      name: 'Old',
    })
    mockUpdateOne.mockResolvedValue({ modifiedCount: 1 })

    const req = makeRequest('/api/routine?id=existing-id', {
      method: 'POST',
      body: JSON.stringify({ _id: 'evil-override', name: 'Updated' }),
      headers: { 'Content-Type': 'application/json' },
    })
    await postRoutine(req)

    // The $set payload should NOT contain _id
    const setPayload = mockUpdateOne.mock.calls[0][1].$set
    expect(setPayload._id).toBeUndefined()
    expect(setPayload.name).toBe('Updated')
  })

  it('stamps userId on update (overrides any userId in body)', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'real-user' } })
    mockFindOne.mockResolvedValue({
      _id: 'id1',
      userId: 'real-user',
      name: 'Old',
    })
    mockUpdateOne.mockResolvedValue({ modifiedCount: 1 })

    const req = makeRequest('/api/routine?id=id1', {
      method: 'POST',
      body: JSON.stringify({ name: 'Updated', userId: 'attacker' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await postRoutine(req)
    const body = await parseJson(res)

    expect(body.updatedRoutine.userId).toBe('real-user')
  })

  it('sets updatedAt timestamp on update', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockFindOne.mockResolvedValue({ _id: 'id1', userId: 'user-1' })
    mockUpdateOne.mockResolvedValue({ modifiedCount: 1 })

    const beforeTime = new Date()

    const req = makeRequest('/api/routine?id=id1', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await postRoutine(req)
    const body = await parseJson(res)

    const updatedAt = new Date(body.updatedRoutine.updatedAt)
    expect(updatedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
  })

  it('returns modifiedCount 0 when no fields actually changed', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockFindOne.mockResolvedValue({
      _id: 'id1',
      userId: 'user-1',
      name: 'Same',
    })
    mockUpdateOne.mockResolvedValue({ modifiedCount: 0 })

    const req = makeRequest('/api/routine?id=id1', {
      method: 'POST',
      body: JSON.stringify({ name: 'Same' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await postRoutine(req)
    const body = await parseJson(res)

    expect(body.success).toBe(true)
    expect(body.updatedCount).toBe(0)
  })

  // ─── Upsert fallback (id param present but not found) ──────────────────

  it('inserts when id is provided but routine does not exist', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockFindOne.mockResolvedValue(null)
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
    expect(mockUpdateOne).not.toHaveBeenCalled()
  })

  // ─── POST does NOT check ownership on update ──────────────────────────

  it("allows updating another user's routine (no ownership check on update)", async () => {
    // This documents the current behavior — POST does not verify
    // existingRoutine.userId === session.user.id before updating
    mockGetSession.mockResolvedValue({ user: { id: 'attacker' } })
    mockFindOne.mockResolvedValue({
      _id: 'victim-routine',
      userId: 'victim-user',
      name: 'Victim Routine',
    })
    mockUpdateOne.mockResolvedValue({ modifiedCount: 1 })

    const req = makeRequest('/api/routine?id=victim-routine', {
      method: 'POST',
      body: JSON.stringify({ name: 'Hacked' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await postRoutine(req)

    // Current behavior: succeeds (no auth check on update)
    expect(res.status).toBe(200)
    expect(mockUpdateOne).toHaveBeenCalled()
  })

  // ─── Error handling ────────────────────────────────────────────────────

  it('returns 500 when req.json() throws (invalid JSON body)', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })

    const req = makeRequest('/api/routine', {
      method: 'POST',
      body: 'not valid json{{{',
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await postRoutine(req)

    expect(res.status).toBe(500)
    expect(await parseJson(res)).toEqual({ error: 'Internal Server Error' })
  })

  it('returns 500 when insertOne fails on create (insertOne is now awaited)', async () => {
    // insertOne IS awaited on the create path, so a failure propagates as 500.
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockInsertOne.mockRejectedValue(new Error('Write conflict'))

    const req = makeRequest('/api/routine', {
      method: 'POST',
      body: JSON.stringify({ name: 'Fail' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await postRoutine(req)

    // Since insertOne is awaited, a DB error is caught and returns 500
    expect(res.status).toBe(500)
    expect(mockInsertOne).toHaveBeenCalled()
  })

  it('response includes the inserted _id from MongoDB on create', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockInsertOne.mockResolvedValue({ insertedId: 'generated-id-123' })

    const req = makeRequest('/api/routine', {
      method: 'POST',
      body: JSON.stringify({ name: 'New' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await postRoutine(req)

    expect(res.status).toBe(200)
    const body = await parseJson(res)
    expect(body.updatedRoutine._id).toBe('generated-id-123')
  })

  it('returns 500 when updateOne throws', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockFindOne.mockResolvedValue({ _id: 'id1', userId: 'user-1' })
    mockUpdateOne.mockRejectedValue(new Error('Write conflict'))

    const req = makeRequest('/api/routine?id=id1', {
      method: 'POST',
      body: JSON.stringify({ name: 'Fail' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await postRoutine(req)

    // updateOne IS awaited, so this should be caught
    expect(res.status).toBe(500)
    expect(await parseJson(res)).toEqual({ error: 'Internal Server Error' })
  })

  it('returns 500 when findOne throws during update lookup', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockFindOne.mockRejectedValue(new Error('DB error'))

    const req = makeRequest('/api/routine?id=abc', {
      method: 'POST',
      body: JSON.stringify({ name: 'Fail' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await postRoutine(req)

    expect(res.status).toBe(500)
  })

  it('handles empty body object', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockInsertOne.mockResolvedValue({ insertedId: 'new-id' })

    const req = makeRequest('/api/routine', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await postRoutine(req)

    expect(res.status).toBe(200)
    const body = await parseJson(res)
    expect(body.updatedRoutine.userId).toBe('user-1')
    expect(body.updatedRoutine.updatedAt).toBeDefined()
  })

  it('preserves all fields from request body in created routine', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockInsertOne.mockResolvedValue({ insertedId: 'new-id' })

    const routineData = {
      name: 'Complex',
      notes: 'Important notes',
      swimLanes: [
        {
          id: 'l1',
          name: 'Lane 1',
          steps: [
            {
              id: 's1',
              swimLaneId: 'l1',
              name: 'Step 1',
              sequence: 0,
              durationInSeconds: 60,
              startType: 'automatic',
            },
          ],
        },
      ],
      prepTasks: [{ id: 'p1', name: 'Prep' }],
      syncConfig: { syncAll: true },
    }

    const req = makeRequest('/api/routine', {
      method: 'POST',
      body: JSON.stringify(routineData),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await postRoutine(req)
    const body = await parseJson(res)

    expect(body.updatedRoutine.name).toBe('Complex')
    expect(body.updatedRoutine.notes).toBe('Important notes')
    expect(body.updatedRoutine.swimLanes).toHaveLength(1)
    expect(body.updatedRoutine.prepTasks).toHaveLength(1)
    expect(body.updatedRoutine.syncConfig.syncAll).toBe(true)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// DELETE /api/routine?id=...
// ═════════════════════════════════════════════════════════════════════════════

describe('DELETE /api/routine', () => {
  it('returns 400 when id param is missing', async () => {
    const res = await deleteRoutine(
      makeRequest('/api/routine', { method: 'DELETE' }),
    )

    expect(res.status).toBe(400)
    expect(await parseJson(res)).toEqual({ error: 'Missing ID' })
  })

  it('returns 400 when id param is empty string', async () => {
    const res = await deleteRoutine(
      makeRequest('/api/routine?id=', { method: 'DELETE' }),
    )

    expect(res.status).toBe(400)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)

    const res = await deleteRoutine(
      makeRequest('/api/routine?id=abc', { method: 'DELETE' }),
    )

    expect(res.status).toBe(401)
    expect(await parseJson(res)).toEqual({ error: 'Unauthorized' })
  })

  it('returns 401 when session.user.id is falsy', async () => {
    mockGetSession.mockResolvedValue({ user: { id: '' } })

    const res = await deleteRoutine(
      makeRequest('/api/routine?id=abc', { method: 'DELETE' }),
    )

    expect(res.status).toBe(401)
  })

  it('returns 404 when routine does not exist', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockFindOne.mockResolvedValue(null)

    const res = await deleteRoutine(
      makeRequest('/api/routine?id=abc', { method: 'DELETE' }),
    )

    expect(res.status).toBe(404)
    expect(await parseJson(res)).toEqual({
      error: 'Routine not found or unauthorized',
    })
  })

  it("returns 404 when trying to delete another user's routine", async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockFindOne.mockResolvedValue({ _id: 'abc', userId: 'user-2' })

    const res = await deleteRoutine(
      makeRequest('/api/routine?id=abc', { method: 'DELETE' }),
    )

    expect(res.status).toBe(404)
    expect(await parseJson(res)).toEqual({
      error: 'Routine not found or unauthorized',
    })
  })

  it('does not call deleteOne when ownership check fails', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockFindOne.mockResolvedValue({ _id: 'abc', userId: 'user-2' })

    await deleteRoutine(
      makeRequest('/api/routine?id=abc', { method: 'DELETE' }),
    )

    expect(mockDeleteOne).not.toHaveBeenCalled()
  })

  it('deletes the routine and returns success with deletedCount', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockFindOne.mockResolvedValue({ _id: 'abc', userId: 'user-1' })
    mockDeleteOne.mockResolvedValue({ deletedCount: 1 })

    const res = await deleteRoutine(
      makeRequest('/api/routine?id=abc', { method: 'DELETE' }),
    )

    expect(res.status).toBe(200)
    const body = await parseJson(res)
    expect(body.success).toBe(true)
    expect(body.deletedCount).toBe(1)
  })

  it('returns success even if deletedCount is 0 (race condition)', async () => {
    // If the document is deleted between findOne and deleteOne
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockFindOne.mockResolvedValue({ _id: 'abc', userId: 'user-1' })
    mockDeleteOne.mockResolvedValue({ deletedCount: 0 })

    const res = await deleteRoutine(
      makeRequest('/api/routine?id=abc', { method: 'DELETE' }),
    )

    expect(res.status).toBe(200)
    const body = await parseJson(res)
    expect(body.success).toBe(true)
    expect(body.deletedCount).toBe(0)
  })

  it('returns 500 when findOne throws', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockFindOne.mockRejectedValue(new Error('DB error'))

    const res = await deleteRoutine(
      makeRequest('/api/routine?id=abc', { method: 'DELETE' }),
    )

    expect(res.status).toBe(500)
    expect(await parseJson(res)).toEqual({ error: 'Internal Server Error' })
  })

  it('returns 500 when deleteOne throws', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockFindOne.mockResolvedValue({ _id: 'abc', userId: 'user-1' })
    mockDeleteOne.mockRejectedValue(new Error('Delete failed'))

    const res = await deleteRoutine(
      makeRequest('/api/routine?id=abc', { method: 'DELETE' }),
    )

    expect(res.status).toBe(500)
  })
})
