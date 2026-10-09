# DevConnect

DevConnect helps developers discover teammates, form hackathon teams, manage requests, and collaborate in persistent real-time team chats.

## Features

- Secure cookie-based authentication and developer profiles
- Deterministic teammate matching with explainable scores
- Team creation, recruitment, join requests, and invitations
- Persistent Socket.IO team chat with presence and typing indicators
- Activity dashboard with teams, requests, recommendations, and unread messages
- Hackathon discovery and bookmarks

Phase 9 hackathon integration is intentionally skipped.

## Stack

- Frontend: React, Vite, React Router, Tailwind CSS, Framer Motion
- Backend: Node.js, Express, Socket.IO
- Database: MongoDB with Mongoose
- Storage: Cloudinary for avatars
- Authentication: JWT in HTTP-only cookies

## Architecture

The Vite frontend calls the Express REST API under `/api`. REST handles authentication, profiles, teams, requests, recommendations, dashboard data, and chat history. Socket.IO handles authenticated team rooms, live messages, presence, and typing events. Messages are saved in MongoDB before they are emitted to the room.

## Local Setup

Install both dependency sets:

```bash
npm install
npm install --prefix server
```

Copy `server/.env.example` to `server/.env` and fill in the required values. The development database falls back to MongoDB Memory Server when `MONGO_URI` is left as its documented placeholder. This fallback is never allowed in production.

Start the frontend and backend in separate terminals:

```bash
npm run dev
npm run dev:server
```

The frontend runs on `http://localhost:5173` and the API/socket server runs on `http://localhost:5000` by default.

## Environment Variables

Backend variables are documented in [server/.env.example](server/.env.example):

- `NODE_ENV`, `PORT`, `MONGO_URI`
- `JWT_SECRET` (32+ random characters in production)
- `CLIENT_URL` (the exact HTTPS frontend origin in production)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Optional `EVENTBRITE_TOKEN` and `EVENTBRITE_ORGANIZATION_ID` for syncing live events owned by an Eventbrite organization. Configure both only in `server/.env`; the token must never be added to frontend environment variables.

The frontend optionally uses `VITE_API_URL`, documented in [.env.example](.env.example). Never commit real `.env` files, credentials, JWTs, or API keys.

## API Overview

- `/api/auth`: register, login, session, logout
- `/api/users`: profiles, teams summary, notifications
- `/api/hackathons`: discovery, recommendations, bookmarks
- `/api/teams`, `/api/requests`: team formation and request lifecycle
- `/api/matching`: teammate recommendations and team invites
- `/api/teams/:id/messages`: member-only paginated chat history
- Socket.IO: authenticated `team:join`, `team:leave`, `team:message`, and `team:typing` events

## Testing and Quality Checks

```bash
npm run build
npm run lint
npm test --prefix server
```

The backend tests cover deterministic matching and schema validation for profile interests and chat messages. Production smoke testing should use two authenticated users in the same team to verify chat, presence, and request flows.

## Deployment

Build the frontend with `npm run build` and serve `dist/` from a static hosting provider. Deploy the backend as a persistent Node.js service with WebSocket support and run `npm start --prefix server`. Use a managed MongoDB deployment and Cloudinary in production.

Set `NODE_ENV=production`, a real `MONGO_URI`, a long random `JWT_SECRET`, and the exact HTTPS `CLIENT_URL`. The backend validates these settings before listening, enables security headers, restricts CORS, and applies rate limits to authentication, requests, and chat history. The deployment platform must support long-lived Socket.IO connections and configure HTTPS termination correctly.

For Eventbrite sync, configure a server-side Eventbrite private token and organization ID, then use **Sync Eventbrite** on the admin hackathons page. The importer only reads live, current/future events from that organization and upserts them by Eventbrite event ID. Eventbrite does not provide this app's prize, team size, skill, or difficulty data; those fields are left unspecified/defaulted, and estimated registration deadlines are labeled in the UI.

## Future Improvements

Cursor pagination for larger dashboard histories, richer notification aggregation, distributed Socket.IO presence, and automated browser end-to-end tests can be added without changing the core REST or matching contracts.
