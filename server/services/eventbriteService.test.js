import assert from 'node:assert/strict'
import test from 'node:test'
import {
  fetchEventbriteEvents,
  normalizeEventbriteEvent,
  syncEventbriteHackathons,
} from './eventbriteService.js'

const eventFixture = {
  id: 'evt-123',
  name: { text: 'Campus Hackathon' },
  summary: 'Build a useful project with a team.',
  start: { utc: '2027-02-10T09:00:00Z' },
  end: { utc: '2027-02-11T17:00:00Z' },
  url: 'https://www.eventbrite.com/e/evt-123',
  online_event: true,
}

test('normalizes Eventbrite events without inventing missing fields', () => {
  const syncedAt = new Date('2026-10-09T00:00:00Z')
  const event = normalizeEventbriteEvent(eventFixture, syncedAt)

  assert.equal(event.title, 'Campus Hackathon')
  assert.equal(event.difficulty, 'unspecified')
  assert.equal(event.registrationDeadline.toISOString(), event.startDate.toISOString())
  assert.equal(event.registrationDeadlineIsEstimated, true)
  assert.equal(event.externalKey, 'eventbrite:evt-123')
  assert.equal(event.mode, 'online')
})

test('uses ticket sales end when Eventbrite provides a registration deadline', () => {
  const event = normalizeEventbriteEvent({
    ...eventFixture,
    ticket_classes: [{ sales_end: '2027-02-08T23:59:00Z' }],
  })

  assert.equal(event.registrationDeadline.toISOString(), '2027-02-08T23:59:00.000Z')
  assert.equal(event.registrationDeadlineIsEstimated, false)
})

test('fetches all Eventbrite pages with bearer authentication', async () => {
  const requests = []
  const fetchImpl = async (url, options) => {
    requests.push({ url: new URL(url), options })
    const secondPage = new URL(url).searchParams.has('continuation')
    return {
      ok: true,
      json: async () => secondPage
        ? { events: [{ id: 'evt-2' }], pagination: { has_more_items: false } }
        : { events: [{ id: 'evt-1' }], pagination: { has_more_items: true, continuation: 'next-page' } },
    }
  }

  const events = await fetchEventbriteEvents({
    token: 'private-token',
    organizationId: 'org-7',
    fetchImpl,
  })

  assert.equal(events.length, 2)
  assert.equal(requests.length, 2)
  assert.equal(requests[0].options.headers.Authorization, 'Bearer private-token')
  assert.equal(requests[1].url.searchParams.get('continuation'), 'next-page')
})

test('upserts by stable provider key without overwriting local curation', async () => {
  let capturedOperations
  const model = {
    bulkWrite: async (operations) => {
      capturedOperations = operations
      return { upsertedCount: 1, modifiedCount: 0 }
    },
  }
  const result = await syncEventbriteHackathons({
    token: 'private-token',
    organizationId: 'org-7',
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ events: [eventFixture], pagination: { has_more_items: false } }),
    }),
    model,
  })

  assert.equal(capturedOperations[0].updateOne.filter.externalKey, 'eventbrite:evt-123')
  assert.equal(capturedOperations[0].updateOne.upsert, true)
  assert.equal(capturedOperations[0].updateOne.update.$setOnInsert.difficulty, 'unspecified')
  assert.equal(capturedOperations[0].updateOne.update.$setOnInsert.isFeatured, false)
  assert.equal('difficulty' in capturedOperations[0].updateOne.update.$set, false)
  assert.deepEqual(result, { fetched: 1, created: 1, updated: 0, skipped: 0 })
})