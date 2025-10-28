# Chithi: Real time messaging

Chithi is an anonymous messaging platform designed to give anyone a private space to connect, share experiences, and support each other. The app provides secure authentication, real-time chat, user blocking, and reporting to keep the community safe.

---

## Table of Contents

* [Architecture](#architecture)
* [Tech Stack](#tech-stack)
* [Local Development](#local-development)
  * [Prerequisites](#prerequisites)
  * [Environment Variables](#environment-variables)
  * [Backend Setup](#backend-setup)
  * [Frontend Setup](#frontend-setup)
* [Available Scripts](#available-scripts)
  * [Backend](#backend-scripts)
  * [Frontend](#frontend-scripts)
* [Realtime Messaging](#realtime-messaging)
* [Project Structure](#project-structure)
* [API Overview](#api-overview)
* [Troubleshooting](#troubleshooting)
* [Future Enhancements](#future-enhancements)

---

## Architecture

Chithi is built as a full-stack TypeScript application with a NestJS backend and a React (Vite) frontend.

```
+------------------------+          +---------------------------+
|        Frontend        |  HTTP    |           Backend         |
|  React + Vite + TS     | <------> | NestJS + Prisma + Socket.IO|
|  Port: 3000            |  WebSocket| Port: 3001               |
+------------------------+          +---------------------------+
            |                                        |
            v                                        v
      Local Storage                           PostgreSQL @ Laragon
   (JWT access/refresh)                         via Prisma ORM
```

* __Frontend (`frontend/`)__ Vite app using React hooks and Context API for authentication, React Router for navigation, and Socket.IO client for realtime updates.
* __Backend (`backend/`)__ NestJS with Fastify adapter, Prisma ORM for PostgreSQL, Socket.IO gateway for realtime messaging, and modular organization (`modules/`) for features like auth, threads, messages, etc.
* __Database__ PostgreSQL managed via Prisma migrations. Ensure Laragon's PostgreSQL service is running on port 5432 (default).

---

## Tech Stack

* __Frontend__ React 18, TypeScript, Vite, React Router, Socket.IO Client
* __Backend__ NestJS 10, TypeScript, Fastify, Prisma ORM, Socket.IO
* __Database__ PostgreSQL (Laragon packaged or external instance)
* __Tooling__ npm, Node.js LTS, Prisma CLI, Socket.IO, JWT authentication

---

## Local Development

### Prerequisites

* Node.js 18+ and npm 9+
* Laragon (or equivalent) with PostgreSQL running
* Git
* (Optional) Two browser profiles/windows for realtime testing

### Environment Variables

Create a `.env` file in `backend/` (already gitignored). Example configuration:

```env
# backend/.env
DATABASE_URL="postgresql://<username>:<password>@localhost:5432/chithi?pgbouncer=true"
JWT_SECRET="replace-with-strong-secret"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_SECRET="replace-with-strong-refresh-secret"
REFRESH_TOKEN_EXPIRES_IN="7d"
```

Adjust `<username>` and `<password>` to match your Laragon/PostgreSQL credentials. The `?pgbouncer=true` flag disables prepared statements which is required when using proxies like PgBouncer; it is safe to leave even for local setups.

For the frontend you may create `frontend/.env` if you need to override defaults, but the project is already configured to point to `http://localhost:3001` for APIs and WebSockets.

### Backend Setup

```bash
cd backend
npm install
npx prisma generate
npm run build
npm run start:dev
```

The backend listens on `http://localhost:3001` (HTTP) and `ws://localhost:3001` (Socket.IO). You should see logs such as `✅ Application is running on: http://localhost:3001` and `✅ WebSocket server is running on: ws://localhost:3001`.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server runs on `http://localhost:3000`. Login/register pages are available at `/login` and `/register`; the chat UI is under `/threads`.

To test realtime messaging, open two browser windows, log in as different users, and send messages—new messages should appear immediately without refreshing.

---

## Available Scripts

### Backend Scripts

* `npm run build` Compile NestJS application to `dist/`
* `npm run start` Start production build
* `npm run start:dev` Start dev server with hot reload (recommended during development)
* `npm run start:prod` Run compiled `dist/` code
* `npm run lint` Run ESLint
* `npm run test` Execute unit tests (Jest)
* `npx prisma migrate dev` Run pending Prisma migrations
* `npx prisma studio` Open Prisma data browser

### Frontend Scripts

* `npm run dev` Start Vite dev server (port 3000)
* `npm run build` Create production build in `dist/`
* `npm run preview` Preview production build locally

---

## Realtime Messaging

The chat experience uses Socket.IO for immediate message delivery. Key points:

* The frontend connects via `io('http://localhost:3001', { transports: ['polling', 'websocket'] })` and authenticates using the JWT access token.
* The backend gateway (`backend/src/events/events.gateway.ts`) validates the token, joins users to `user:<id>` rooms, and emits `newMessage` and `messageRead` events.
* When a message is created (`message.service.ts`), the backend emits to both sender and receiver rooms to ensure both views update instantly.
* Ensure CORS is properly configured and that both frontend (port 3000) and backend (port 3001) are running simultaneously.

---

## Project Structure

```
app/
├── backend/
│   ├── src/
│   │   ├── adapters/fastify-socket-io.adapter.ts
│   │   ├── app.module.ts, main.ts, prisma/
│   │   ├── events/ (Socket.IO gateway)
│   │   └── modules/
│   │       ├── auth/
│   │       ├── message/
│   │       ├── thread/
│   │       ├── block/
│   │       └── report/
│   └── prisma/schema.prisma
├── frontend/
│   ├── src equivalent files (Vite uses /frontend root)
│   ├── App.tsx, index.tsx
│   ├── components/
│   │   ├── Chat.tsx, ThreadList.tsx, MessageView.tsx
│   │   ├── Auth.tsx (login/register views)
│   │   └── modal components
│   ├── context/AuthContext.tsx
│   └── types/chat.ts
└── README.md (this file)
```

---

## API Overview

Basic REST endpoints (all prefixed with `http://localhost:3001`):

* `POST /auth/register` Create a new user
* `POST /auth/login` Login and receive access/refresh tokens
* `POST /auth/refresh` Refresh the access token
* `GET /users/me` Retrieve current user's profile
* `PATCH /users/me` Update profile (e.g., change anonymous tag)
* `GET /threads` List threads for authenticated user
* `GET /threads/:id/messages` Fetch messages in a thread
* `POST /messages` Send a message (`{ receiverTag, content }`)
* `PATCH /messages/:id/read` Mark message as read
* `POST /block` Block a user by anonymous tag
* `POST /report` Report a user with a reason

All authenticated routes require the `Authorization: Bearer <accessToken>` header.

---

## Troubleshooting

* __WebSocket errors__ Ensure frontend uses `http://localhost:3001` for Socket.IO connections, backend server is restarted after changes, and tokens are valid.
* __Prisma `prepared statement "s0" already exists`__ Append `?pgbouncer=true` to `DATABASE_URL` and restart Postgres/Laragon.
* __Login issues__ Verify `.env` secrets, database credentials, and run `npx prisma migrate dev` if database schema is outdated.
* __Frontend not updating__ Clear browser cache or hard reload. Ensure both backend and frontend are running simultaneously.

---

## Future Enhancements

* Real-time typing indicators and online status
* Push notifications for new messages
* Dedicated mobile-friendly UI improvements
* Automated moderation tooling for reported content
* Additional analytics/admin dashboards

---

Built with ❤️ for a safe, anonymous community.
