import Hackathon from '../models/Hackathon.js'

const EVENTBRITE_API = 'https://www.eventbriteapi.com/v3'
const PAGE_SIZE = 50
const MAX_PAGES = 10

export class EventbriteIntegrationError extends Error {
  constructor(message, statusCode = 502) {
    super(message)
    this.name = 'EventbriteIntegrationError'
    this.statusCode = statusCode
  }
}

const readText = (value) => {
  if (typeof value === 'string') return value.trim()
  if (typeof value?.text === 'string') return value.text.trim()
  if (typeof value?.name === 'string') return value.name.trim()
  return ''
}

const validDate = (value) => {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date : null
}

const getDomain = (event) => {
  const category = readText(event.category?.name).toLowerCase()
  if (category.includes('artificial intelligence') || category.includes('machine learning')) return 'AI/ML'
  if (category.includes('technology') || category.includes('science')) return 'Web Development'
  return undefined
}

export const normalizeEventbriteEvent = (event, syncedAt = new Date()) => {
  const externalId = String(event?.id || '').trim()
  const title = readText(event?.name)
  const startDate = validDate(event?.start?.utc || event?.start?.local)
  const endDate = validDate(event?.end?.utc || event?.end?.local) || startDate

  if (!externalId || !title || !startDate || !endDate || endDate < startDate) return null

  const salesDeadlines = (Array.isArray(event.ticket_classes) ? event.ticket_classes : [])
    .map((ticketClass) => validDate(ticketClass.sales_end))
    .filter((date) => date && date <= startDate)
    .sort((first, second) => second - first)
  const registrationDeadline = salesDeadlines[0] || startDate
  const description = readText(event.summary) || readText(event.description) ||
    'Event details are available on Eventbrite.'
  const venue = event.venue
  const location = readText(venue?.address?.localized_area_display) ||
    [readText(venue?.address?.city), readText(venue?.address?.region)].filter(Boolean).join(', ') ||
    readText(venue?.name)
  const hasVenue = Boolean(event.venue_id || venue)

  return {
    title: title.slice(0, 120),
    organizer: readText(event.organizer?.name) || 'Eventbrite organizer',
    description: description.slice(0, 5000),
    startDate,
    endDate,
    registrationDeadline,
    registrationDeadlineIsEstimated: salesDeadlines.length === 0,
    mode: event.online_event ? (hasVenue ? 'hybrid' : 'online') : 'offline',
    location,
    prizePool: 0,
    teamSizeMin: 1,
    teamSizeMax: 4,
    domains: [getDomain(event)].filter(Boolean),
    requiredSkills: [],
    difficulty: 'unspecified',
    registrationLink: readText(event.url),
    image: readText(event.logo?.original?.url) || readText(event.logo?.url),
    isFeatured: false,
    source: 'eventbrite',
    externalId,
    externalKey: `eventbrite:${externalId}`,
    externalUrl: readText(event.url),
    lastSyncedAt: syncedAt,
  }
}

export const fetchEventbriteEvents = async ({
  token,
  organizationId,
  fetchImpl = globalThis.fetch,
  maxPages = MAX_PAGES,
} = {}) => {
  if (!token || !organizationId) {
    throw new EventbriteIntegrationError(
      'Configure EVENTBRITE_TOKEN and EVENTBRITE_ORGANIZATION_ID on the server.',
      503,
    )
  }
  if (typeof fetchImpl !== 'function') {
    throw new EventbriteIntegrationError('This Node.js runtime does not provide fetch.', 500)
  }

  const endpoint = new URL(`${EVENTBRITE_API}/organizations/${encodeURIComponent(organizationId)}/events/`)
  endpoint.searchParams.set('status', 'live')
  endpoint.searchParams.set('time_filter', 'current_future')
  endpoint.searchParams.set('page_size', String(PAGE_SIZE))
  endpoint.searchParams.set('expand', 'venue,logo,organizer,category,format')

  const events = []
  let continuation = ''

  for (let page = 0; page < maxPages; page += 1) {
    const url = new URL(endpoint)
    if (continuation) url.searchParams.set('continuation', continuation)

    let response
    try {
      response = await fetchImpl(url, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
    } catch {
      throw new EventbriteIntegrationError('Could not connect to the Eventbrite API.')
    }

    let payload
    try {
      payload = await response.json()
    } catch {
      throw new EventbriteIntegrationError('Eventbrite returned an unreadable response.')
    }

    if (!response.ok) {
      const detail = payload.error_description || payload.error || `HTTP ${response.status}`
      throw new EventbriteIntegrationError(`Eventbrite request failed: ${detail}`)
    }

    events.push(...(Array.isArray(payload.events) ? payload.events : []))
    continuation = payload.pagination?.has_more_items
      ? payload.pagination.continuation || ''
      : ''
    if (!continuation) break
  }

  return events
}

export const syncEventbriteHackathons = async ({
  token = process.env.EVENTBRITE_TOKEN,
  organizationId = process.env.EVENTBRITE_ORGANIZATION_ID,
  fetchImpl,
  model = Hackathon,
  syncedAt = new Date(),
} = {}) => {
  const events = await fetchEventbriteEvents({ token, organizationId, fetchImpl })
  const records = events
    .map((event) => normalizeEventbriteEvent(event, syncedAt))
    .filter(Boolean)

  if (!records.length) {
    return { fetched: events.length, created: 0, updated: 0, skipped: events.length }
  }

  const operations = records.map((record) => ({
    updateOne: {
      filter: { externalKey: record.externalKey },
      update: {
        $set: {
          title: record.title,
          organizer: record.organizer,
          description: record.description,
          startDate: record.startDate,
          endDate: record.endDate,
          registrationDeadline: record.registrationDeadline,
          registrationDeadlineIsEstimated: record.registrationDeadlineIsEstimated,
          mode: record.mode,
          location: record.location,
          registrationLink: record.registrationLink,
          image: record.image,
          source: record.source,
          externalId: record.externalId,
          externalKey: record.externalKey,
          externalUrl: record.externalUrl,
          lastSyncedAt: record.lastSyncedAt,
        },
        $setOnInsert: {
          prizePool: record.prizePool,
          teamSizeMin: record.teamSizeMin,
          teamSizeMax: record.teamSizeMax,
          domains: record.domains,
          requiredSkills: record.requiredSkills,
          difficulty: record.difficulty,
          isFeatured: record.isFeatured,
        },
      },
      upsert: true,
    },
  }))
  const result = await model.bulkWrite(operations, { ordered: false })

  return {
    fetched: events.length,
    created: result.upsertedCount || 0,
    updated: result.modifiedCount || 0,
    skipped: events.length - records.length,
  }
}