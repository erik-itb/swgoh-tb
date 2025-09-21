# Testing Guide

This project includes comprehensive test suites for both backend and frontend components.

## Backend Testing (Jest + Supertest)

### Setup
- **Framework**: Jest with TypeScript support
- **API Testing**: Supertest for HTTP endpoint testing
- **Database**: PostgreSQL test database with automatic cleanup
- **Coverage**: Minimum 70% coverage threshold

### Test Structure
```
backend/
├── tests/
│   ├── setup.ts              # Test configuration and database setup
│   ├── auth.test.ts           # Authentication API tests
│   ├── territory-battles.test.ts  # TB hierarchy API tests
│   └── squads.test.ts         # Squad management API tests
└── jest.config.js             # Jest configuration
```

### Running Backend Tests
```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.ts
```

### Test Database Setup
1. Ensure PostgreSQL is running (via Docker Compose)
2. Create test database:
   ```bash
   docker-compose exec postgres psql -U postgres -c "CREATE DATABASE swgoh_tb_test;"
   ```
3. Run Prisma migrations for test database:
   ```bash
   npx prisma migrate deploy --schema prisma/schema.prisma
   ```

### Coverage Reports
Coverage reports are generated in `backend/coverage/` directory:
- **HTML Report**: `coverage/lcov-report/index.html`
- **Text Summary**: Displayed in terminal
- **LCOV Data**: `coverage/lcov.info`

## Frontend Testing (Vitest + React Testing Library)

### Setup
- **Framework**: Vitest with jsdom environment
- **Component Testing**: React Testing Library
- **Mocking**: Vitest mocking capabilities
- **Coverage**: Minimum 70% coverage threshold

### Test Structure
```
frontend/src/
├── test/
│   ├── setup.ts               # Test configuration and mocks
│   └── utils.tsx              # Test utilities and providers
├── components/
│   └── common/__tests__/
│       └── Header.test.tsx    # Component tests
├── store/__tests__/
│   └── authStore.test.ts      # Store tests
└── pages/__tests__/
    └── Login.test.tsx         # Page component tests
```

### Running Frontend Tests
```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Test Utilities
The project includes custom test utilities in `src/test/utils.tsx`:
- **renderWithProviders**: Renders components with router and auth context
- **mockUsers**: Predefined user objects for testing
- **Authentication Mocking**: Easy auth state setup for tests

### Example Usage
```typescript
import { render, screen } from '../test/utils';
import { mockUsers } from '../test/utils';

test('renders for authenticated admin', () => {
  render(<AdminComponent />, {
    user: mockUsers.admin,
    isAuthenticated: true
  });

  expect(screen.getByText('Admin Panel')).toBeInTheDocument();
});
```

## Test Categories

### Authentication Tests
- User registration and login
- JWT token validation
- Role-based access control
- Password hashing and verification
- Session management

### API Endpoint Tests
- CRUD operations for all entities
- Authorization checks
- Input validation
- Error handling
- Rate limiting

### Component Tests
- Rendering with different props
- User interaction simulation
- State management integration
- Navigation and routing
- Form validation

### Store Tests
- State mutations
- Async actions
- Error handling
- Persistence
- Computed values

## Continuous Integration

### Pre-commit Checks
Before committing code, ensure:
```bash
# Backend
cd backend
npm run lint
npm run test
npm run build

# Frontend
cd frontend
npm run lint
npm run test
npm run build
```

### Docker Testing
Run tests in Docker environment:
```bash
# Start services
docker-compose up -d

# Run backend tests
docker-compose exec backend npm test

# Run frontend tests
docker-compose exec frontend npm test
```

## Coverage Goals

### Current Coverage Targets
- **Minimum**: 70% for all metrics (lines, functions, branches, statements)
- **Target**: 80%+ for critical business logic
- **Goal**: 90%+ for authentication and security components

### Coverage Exclusions
- Generated files (Prisma client, build artifacts)
- Configuration files
- Development utilities
- Type definition files

## Best Practices

### Test Organization
- Group related tests using `describe` blocks
- Use descriptive test names that explain the expected behavior
- Follow the Arrange-Act-Assert pattern
- Clean up after each test to prevent side effects

### Mocking Strategy
- Mock external dependencies (APIs, services)
- Use real implementations for business logic
- Mock heavy dependencies (file system, network)
- Preserve type safety with mocked functions

### Data Management
- Use factories for test data creation
- Clean database state between tests
- Use meaningful test data that reflects real usage
- Avoid shared test state

### Assertion Quality
- Use specific assertions over generic ones
- Test both positive and negative cases
- Verify error states and edge cases
- Check side effects (database changes, API calls)

## Troubleshooting

### Common Issues
1. **Database Connection**: Ensure PostgreSQL is running and test database exists
2. **Port Conflicts**: Check that test ports (3001) are available
3. **Environment Variables**: Verify `.env.test` is properly configured
4. **TypeScript Errors**: Run `npm run build` to check compilation

### Debug Mode
Run tests with debug output:
```bash
# Backend
DEBUG=* npm test

# Frontend
npm run test:watch
```

### Test Performance
- Use `--maxWorkers=1` for backend tests to prevent database conflicts
- Mock expensive operations in frontend tests
- Use `beforeAll`/`afterAll` for setup that can be shared
- Consider test parallelization for large test suites