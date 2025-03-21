# Beanie - Financial Dashboard

## Xero Integration

This application integrates with Xero to provide financial reporting capabilities. To set up the Xero integration:

1. Create a Xero Developer account at https://developer.xero.com/
2. Create a new app in the Xero Developer portal
3. Configure the app with the following settings:

   - App Name: Beanie (or your preferred name)
   - Company or application URL: Your application URL
   - OAuth 2.0 redirect URI: `http://localhost:3001/api/xero/callback` (for development) or your production callback URL
   - Select the scopes: `offline_access`, `openid`, `profile`, `email`, `accounting.reports.read`, `accounting.transactions`

4. Copy the Client ID and Client Secret from the Xero Developer portal
5. Add these credentials to your environment variables:
   - `XERO_CLIENT_ID`: Your Xero Client ID
   - `XERO_CLIENT_SECRET`: Your Xero Client Secret
   - `XERO_CALLBACK_URL`: The callback URL for your backend API (e.g., `http://localhost:3001/api/xero/callback`)

### Testing the Xero Integration

To test the Xero integration:

1. Start the backend server:

   ```
   cd backend
   npm run dev
   ```

2. Start the frontend server:

   ```
   cd frontend
   npm run dev
   ```

3. Navigate to the dashboard in your browser (e.g., http://localhost:5173/dashboard)
4. Click the "Connect Xero" button
5. You will be redirected to Xero's authorization page
6. Log in to your Xero account and authorize the application
7. You will be redirected back to the dashboard
8. The dashboard will show that you are connected to Xero

### Troubleshooting

If you encounter issues with the Xero integration:

1. Check the backend server logs for any errors
2. Verify that your Xero API credentials are correct
3. Make sure the callback URL in your Xero app configuration matches the `XERO_CALLBACK_URL` in your environment variables
4. Ensure that your Xero account has the necessary permissions
   Once configured, users will be able to connect their Xero account from the dashboard.

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
