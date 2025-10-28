# Mom's Anonymous Messaging - Backend

This directory contains the backend service for the anonymous messaging platform, built with NestJS, Fastify, Prisma, and PostgreSQL.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- Docker (for PostgreSQL, if not using Supabase)

### Installation

1. Clone the repository.
2. Navigate to the `backend` directory: `cd backend`
3. Install dependencies: `npm install`
4. Set up your `.env` file by copying `.env.example` and filling in the `DATABASE_URL` and `JWT_SECRET`.

### Running the App

```bash
# development
npm run start:dev

# production mode
npm run start:prod
```

### Prisma

```bash
# Generate Prisma Client
npm run prisma:generate

# Create a new migration
npm run prisma:migrate

# Open Prisma Studio to view/edit data
npm run prisma:studio
```
