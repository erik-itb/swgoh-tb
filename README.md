# SWGOH Rise of the Empire TB Recommended Squads

A comprehensive Territory Battle tracker for Star Wars: Galaxy of Heroes Rise of the Empire battles, featuring squad recommendations, strategy videos, and mission analysis.

## Features

- **Territory Battle Navigation**: Navigate through TB → Phase → Planet → Mission hierarchy
- **Squad Recommendations**: Community-driven squad recommendations with success rates
- **Strategy Videos**: Curated video content for mission strategies
- **Admin Dashboard**: Content management for squads, missions, and user management
- **User Authentication**: Role-based access (viewer, contributor, admin, super_admin)
- **Audit Logging**: Complete audit trail for all data modifications

## Tech Stack

### Backend
- Node.js 18+ with TypeScript
- Express.js for REST API
- Prisma ORM with PostgreSQL
- JWT authentication with bcrypt
- Winston logging
- Jest testing framework

### Frontend
- React 18+ with TypeScript
- Zustand for state management
- Tailwind CSS for styling
- React Router v6 for navigation
- React Hook Form + Zod for forms
- Vite for build tooling

### Infrastructure
- PostgreSQL 15+ database
- Docker & Docker Compose
- GitHub Actions CI/CD

## Quick Start

### Development Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd swgoh-rote-tb-recommended-squads
   npm run setup
   ```

2. **Start with Docker (recommended):**
   ```bash
   npm run docker:dev
   ```

3. **Or start manually:**
   ```bash
   # Terminal 1: Start database
   docker-compose -f docker-compose.dev.yml up postgres

   # Terminal 2: Start backend
   cd backend && npm run dev

   # Terminal 3: Start frontend
   cd frontend && npm run dev
   ```

### Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Database**: localhost:5432 (postgres/password)

### Default Admin Account

- **Email**: admin@example.com
- **Password**: admin123
- **Role**: super_admin

## Project Structure

```
swgoh-rote-tb-recommended-squads/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── config/         # Database, environment configuration
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Auth, validation, audit logging
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API routes
│   │   └── utils/          # Utilities and helpers
│   ├── prisma/             # Database schema and migrations
│   └── tests/              # Backend tests
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── store/          # Zustand state management
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript type definitions
│   └── tests/              # Frontend tests
├── docker-compose.dev.yml  # Development environment
├── docker-compose.prod.yml # Production environment
└── docs/                   # Documentation
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Territory Battles
- `GET /api/tb/:slug` - Get TB details
- `GET /api/tb/:slug/phases` - Get TB phases

### Missions & Squads
- `GET /api/missions/:id` - Get mission details
- `GET /api/missions/:id/recommendations` - Get squad recommendations
- `POST /api/squads` - Create squad (auth required)

### Admin
- `GET /api/admin/users` - User management (admin only)
- `GET /api/admin/audit-logs` - Audit logs (admin only)

## Development

### Running Tests
```bash
npm run test                # All tests
npm run test:backend        # Backend tests only
npm run test:frontend       # Frontend tests only
```

### Database Operations
```bash
cd backend
npx prisma migrate dev      # Run migrations
npx prisma db seed          # Seed database
npx prisma studio           # Database browser
```

### Building for Production
```bash
npm run build               # Build both backend and frontend
npm run docker:prod         # Build and run production containers
```

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://postgres:password@postgres:5432/tb_tracker
JWT_SECRET=your-secret-key-here
PORT=5000
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=SWGOH RotE TB Tracker
```

## Deployment

Optimized for small VPS deployment (1-2GB RAM). See production Docker configuration for memory-optimized PostgreSQL settings.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.