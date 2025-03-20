# Beanie - React/Node.js Full Stack Application

A full-stack application with React frontend and Node.js backend using PostgreSQL database.

## Project Structure

- `frontend/` - React application built with Vite, TypeScript, and Tailwind CSS
- `backend/` - Node.js API with Express, TypeScript, and Prisma ORM
- `vercel.json` - Configuration for Vercel deployment

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn

## Getting Started

### Setup Database

1. Create a PostgreSQL database
2. Update the connection string in `backend/.env` file

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run migrations (optional, if you have schema changes)
npm run prisma:migrate

# Start development server
npm run dev
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Start development server
npm run dev
```

## Development

During development, the backend will run on port 3001 and the frontend on port 5173 (default Vite port).

## CORS Configuration

The backend is configured to allow requests from the following origins:

- https://beanie-six.vercel.app (production)
- http://localhost:5173 (Vite default development port)
- http://localhost:3000 (alternative development port)

If you need to add additional allowed origins, update the `allowedOrigins` array in `backend/src/index.ts`.

## Building for Production

```bash
# Build backend
cd backend
npm run build

# Build frontend
cd ../frontend
npm run build
```

## Deployment to Vercel

This project is configured to deploy to Vercel as a single application. The `vercel.json` file handles routing API requests to the backend and all other requests to the frontend.

1. Push your code to a Git repository
2. Connect the repository to Vercel
3. Configure environment variables in Vercel dashboard (DATABASE_URL, VITE_API_URL, etc.)
4. Deploy

## Environment Variables

### Backend

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Port for the backend server (default: 3001)
- `NODE_ENV` - Node environment (development, production, test)

### Frontend

- `VITE_API_URL` - URL of the backend API (default: http://localhost:3001)

## License

MIT
