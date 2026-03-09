# GoldExclude Trading Portal

## Project Structure
- `client`: Next.js Frontend (Port 3000)
- `server`: NestJS Backend (Port 4000)

## Getting Started

### 1. Backend (Server)
The backend uses NestJS with Prisma. By default, it uses SQLite for easy local development without Docker.

```bash
cd server
npm install
# Set up database
npx prisma migrate dev --name init
# Start server
npm run start:dev
```
Server will run at `http://localhost:4000`.
Swagger API docs (if enabled) or API endpoints are available.
- `POST /auth/register`: Register new user
- `POST /auth/login`: Login

### 2. Frontend (Client)
The frontend uses Next.js with Tailwind CSS.

```bash
cd client
npm install
npm run dev
```
Frontend will run at `http://localhost:3010`.

## Features Implemented
- **Landing Page**: Premium Black & Gold theme, Product Showcase (No Prices), Agent CTA.
- **Database Schema**: Full schema including Users, Products, Orders, Agent Sales, etc.
- **Authentication**: JWT-based auth with Role (Admin, Agent, Customer, Funder).
- **Backend API**: User registration and login endpoints.

## Switching to PostgreSQL
To use PostgreSQL:
1. Update `server/prisma/schema.prisma`: change `provider = "sqlite"` to `provider = "postgresql"`.
2. Update `server/.env`: set `DATABASE_URL` to your Postgres connection string.
3. Run `npx prisma migrate dev`.
