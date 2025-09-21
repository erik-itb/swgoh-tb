# Rise of the Empire Territory Battle Clone - Development Plan

## Project overview and requirements

This document provides comprehensive instructions for building a modern clone of the Star Wars Galaxy of Heroes Rise of the Empire Territory Battle tracker website (https://genskaar.github.io/tb_empire/). The new system will feature a Node.js/Express backend, React frontend, PostgreSQL database, and full admin capabilities for content management.

### Core Requirements
- **Backend**: Node.js with Express and TypeScript
- **Frontend**: React with modern hooks and TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based with bcrypt, Discord OAuth as future enhancement
- **Admin Dashboard**: Full CRUD operations for squads, videos, and content management
- **MVP Focus**: Text-based hierarchy navigation instead of image maps

## System architecture

### Technology Stack
```
Backend:
- Node.js 18+ with TypeScript
- Express.js for API framework
- Prisma ORM for database management
- JWT for authentication
- bcrypt for password hashing
- Winston for logging
- Jest for testing

Frontend:
- React 18+ with TypeScript
- Zustand for state management (lightweight alternative to Redux)
- React Router v6 for navigation
- Tailwind CSS for styling
- React Hook Form + Zod for forms
- Axios for API calls
- Vite for build tooling

Database:
- PostgreSQL 15+
- Prisma for migrations and ORM
- JSONB for flexible data structures

DevOps:
- Docker for containerization
- Docker Compose for local development
- GitHub Actions for CI/CD
- Environment variables for configuration
```

## Database schema design

### Core Tables Structure

```sql
-- User Management
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'viewer', -- viewer, contributor, admin, super_admin
    discord_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Territory Battle Structure
CREATE TABLE territory_battles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- "Rise of the Empire"
    slug VARCHAR(100) UNIQUE NOT NULL, -- "rise-of-the-empire"
    description TEXT,
    total_phases INTEGER DEFAULT 6,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Phases (6 phases total)
CREATE TABLE phases (
    id SERIAL PRIMARY KEY,
    territory_battle_id INTEGER REFERENCES territory_battles(id),
    phase_number INTEGER NOT NULL, -- 1-6
    name VARCHAR(100), -- "Phase 1 (Zone 1)"
    relic_requirement VARCHAR(20), -- "Relic 5+"
    start_gp_requirement BIGINT, -- minimum GP for stars
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(territory_battle_id, phase_number)
);

-- Planets
CREATE TABLE planets (
    id SERIAL PRIMARY KEY,
    phase_id INTEGER REFERENCES phases(id),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    alignment VARCHAR(20), -- 'dark_side', 'light_side', 'mixed'
    is_bonus_planet BOOLEAN DEFAULT false,
    unlock_requirement TEXT, -- for bonus planets like Zeffo
    
    -- Star requirements stored as JSONB
    star_requirements JSONB DEFAULT '{}', -- {"1": 111718750, "2": 178750000, "3": 238333333}
    
    -- Visual assets
    background_image_url TEXT,
    icon_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Combat Missions
CREATE TABLE combat_missions (
    id SERIAL PRIMARY KEY,
    planet_id INTEGER REFERENCES planets(id),
    name VARCHAR(100) NOT NULL,
    mission_type VARCHAR(20), -- 'combat', 'special', 'fleet', 'operations'
    combat_type VARCHAR(20), -- 'regular', 'fleet'
    wave_count INTEGER DEFAULT 1,
    
    -- Requirements and restrictions
    required_units JSONB DEFAULT '[]', -- specific character requirements
    required_factions TEXT[], -- ['empire', 'sith']
    unit_count INTEGER DEFAULT 5, -- 5 for regular, varies for fleet
    
    -- Modifiers and rewards as flexible JSONB
    modifiers JSONB DEFAULT '[]',
    rewards JSONB DEFAULT '{}',
    
    -- Points and difficulty
    territory_points INTEGER,
    difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 10),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Units/Characters
CREATE TABLE units (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(100) UNIQUE NOT NULL, -- internal game identifier
    name VARCHAR(100) NOT NULL,
    unit_type VARCHAR(20), -- 'character', 'ship', 'capital_ship'
    alignment VARCHAR(20), -- 'light_side', 'dark_side', 'neutral'
    factions TEXT[], -- ['rebel', 'jedi', 'old_republic']
    tags TEXT[], -- ['attacker', 'tank', 'support', 'healer']
    
    -- Visual assets
    portrait_url TEXT,
    icon_url TEXT,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Squad Compositions
CREATE TABLE squads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE,
    description TEXT,
    squad_type VARCHAR(20), -- 'regular', 'fleet'
    
    -- Strategy information
    strategy_notes TEXT,
    min_power_requirement INTEGER,
    recommended_gear_tier INTEGER,
    recommended_relic_level INTEGER,
    
    -- Metadata
    created_by INTEGER REFERENCES users(id),
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Squad Units (many-to-many)
CREATE TABLE squad_units (
    id SERIAL PRIMARY KEY,
    squad_id INTEGER REFERENCES squads(id) ON DELETE CASCADE,
    unit_id INTEGER REFERENCES units(id),
    position INTEGER, -- 1-5 for regular, 1-7 for fleet
    is_leader BOOLEAN DEFAULT false,
    is_required BOOLEAN DEFAULT true,
    notes TEXT, -- specific notes for this unit in this squad
    
    UNIQUE(squad_id, position),
    UNIQUE(squad_id, unit_id)
);

-- Mission Squad Recommendations (with versioning)
CREATE TABLE mission_squad_recommendations (
    id SERIAL PRIMARY KEY,
    mission_id INTEGER REFERENCES combat_missions(id),
    squad_id INTEGER REFERENCES squads(id),
    
    -- Versioning
    version INTEGER DEFAULT 1,
    is_current BOOLEAN DEFAULT true,
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Recommendation metadata
    priority INTEGER DEFAULT 1, -- 1=best, 2=alternative, etc.
    success_rate DECIMAL(5,2),
    difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
    
    -- User contributions
    submitted_by INTEGER REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wave Information
CREATE TABLE mission_waves (
    id SERIAL PRIMARY KEY,
    mission_id INTEGER REFERENCES combat_missions(id),
    wave_number INTEGER NOT NULL,
    
    -- Enemy data as JSONB for flexibility
    enemies JSONB DEFAULT '[]', -- [{name, level, gear, abilities}]
    
    -- Wave-specific mechanics
    special_mechanics TEXT[],
    turn_meter_preload INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(mission_id, wave_number)
);

-- Strategy Videos
CREATE TABLE strategy_videos (
    id SERIAL PRIMARY KEY,
    mission_id INTEGER REFERENCES combat_missions(id),
    squad_id INTEGER REFERENCES squads(id),
    
    title VARCHAR(200) NOT NULL,
    description TEXT,
    video_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    
    -- Video metadata
    platform VARCHAR(20), -- 'youtube', 'twitch'
    duration_seconds INTEGER,
    creator_name VARCHAR(100),
    creator_channel_url VARCHAR(500),
    
    -- Quality metrics
    view_count INTEGER DEFAULT 0,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    
    -- Management
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    submitted_by INTEGER REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Log
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER,
    action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    user_id INTEGER REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_phases_tb ON phases(territory_battle_id);
CREATE INDEX idx_planets_phase ON planets(phase_id);
CREATE INDEX idx_missions_planet ON combat_missions(planet_id);
CREATE INDEX idx_squad_units_squad ON squad_units(squad_id);
CREATE INDEX idx_recommendations_mission ON mission_squad_recommendations(mission_id, is_current);
CREATE INDEX idx_videos_mission ON strategy_videos(mission_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_units_factions ON units USING GIN(factions);
CREATE INDEX idx_units_tags ON units USING GIN(tags);
```

## API endpoints specification

### Authentication Endpoints
```
POST   /api/auth/register     - User registration
POST   /api/auth/login        - User login (returns JWT)
POST   /api/auth/refresh      - Refresh JWT token
POST   /api/auth/logout       - Logout (invalidate token)
GET    /api/auth/me          - Get current user profile
PUT    /api/auth/profile     - Update user profile
POST   /api/auth/discord      - Discord OAuth callback (future)
```

### Territory Battle Endpoints
```
GET    /api/tb                - List all territory battles
GET    /api/tb/:slug          - Get specific TB details
GET    /api/tb/:slug/phases   - Get all phases for a TB
```

### Phase Endpoints
```
GET    /api/phases/:id        - Get phase details
GET    /api/phases/:id/planets - Get all planets in a phase
```

### Planet Endpoints
```
GET    /api/planets           - List all planets
GET    /api/planets/:id       - Get planet details
GET    /api/planets/:id/missions - Get all missions for a planet
```

### Mission Endpoints
```
GET    /api/missions/:id      - Get mission details
GET    /api/missions/:id/recommendations - Get squad recommendations
GET    /api/missions/:id/waves - Get wave information
GET    /api/missions/:id/videos - Get strategy videos

POST   /api/missions/:id/recommendations - Add squad recommendation (auth)
PUT    /api/missions/:id/recommendations/:recId - Update recommendation (auth)
DELETE /api/missions/:id/recommendations/:recId - Delete recommendation (admin)
```

### Squad Management Endpoints
```
GET    /api/squads            - List all squads
GET    /api/squads/:id        - Get squad details
POST   /api/squads            - Create squad (auth)
PUT    /api/squads/:id        - Update squad (auth)
DELETE /api/squads/:id        - Delete squad (admin)

POST   /api/squads/:id/units  - Add unit to squad
DELETE /api/squads/:id/units/:unitId - Remove unit from squad
```

### Unit Endpoints
```
GET    /api/units             - List all units (with filters)
GET    /api/units/:id         - Get unit details
GET    /api/units/search      - Search units by name/faction/tags
POST   /api/units             - Add new unit (admin)
PUT    /api/units/:id         - Update unit (admin)
```

### Video Management Endpoints
```
GET    /api/videos            - List all videos
POST   /api/videos            - Submit video (auth)
PUT    /api/videos/:id        - Update video (auth)
DELETE /api/videos/:id        - Delete video (admin)
POST   /api/videos/:id/vote   - Vote on video quality
```

### Admin Endpoints
```
GET    /api/admin/users       - List all users
PUT    /api/admin/users/:id   - Update user role
GET    /api/admin/audit-logs  - View audit logs
GET    /api/admin/stats       - System statistics
POST   /api/admin/import      - Bulk import data
```

## Backend implementation

### Project Structure
```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts      # Prisma client initialization
│   │   ├── env.ts          # Environment variable validation
│   │   └── constants.ts    # App constants
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── tb.controller.ts
│   │   ├── mission.controller.ts
│   │   ├── squad.controller.ts
│   │   └── admin.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── audit.middleware.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── tb.service.ts
│   │   ├── squad.service.ts
│   │   └── cache.service.ts
│   ├── utils/
│   │   ├── jwt.utils.ts
│   │   ├── validation.schemas.ts
│   │   └── logger.ts
│   ├── routes/
│   │   └── index.ts
│   ├── types/
│   │   └── index.d.ts
│   └── app.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── tests/
├── .env.example
├── Dockerfile
└── package.json
```

### Key Implementation Files

#### Authentication Service (auth.service.ts)
```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuthService {
  async register(username: string, email: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.users.create({
      data: {
        username,
        email,
        password_hash: hashedPassword,
        role: 'viewer'
      }
    });
    
    const token = this.generateToken(user.id, user.role);
    return { user, token };
  }
  
  async login(email: string, password: string) {
    const user = await prisma.users.findUnique({ where: { email } });
    
    if (!user || !await bcrypt.compare(password, user.password_hash)) {
      throw new Error('Invalid credentials');
    }
    
    const token = this.generateToken(user.id, user.role);
    
    await prisma.users.update({
      where: { id: user.id },
      data: { last_login: new Date() }
    });
    
    return { user, token };
  }
  
  private generateToken(userId: number, role: string): string {
    return jwt.sign(
      { userId, role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );
  }
}
```

#### Authentication Middleware
```typescript
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
  user?: {
    userId: number;
    role: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = { userId: decoded.userId, role: decoded.role };
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

#### Audit Middleware
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const auditMiddleware = (tableName: string) => {
  return async (req: any, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    
    res.json = function(data: any) {
      if (res.statusCode < 400 && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
        prisma.audit_logs.create({
          data: {
            table_name: tableName,
            action: req.method === 'POST' ? 'INSERT' : 
                    req.method === 'PUT' ? 'UPDATE' : 'DELETE',
            record_id: data.id,
            new_values: req.method !== 'DELETE' ? data : null,
            user_id: req.user?.userId,
            ip_address: req.ip,
            user_agent: req.get('user-agent')
          }
        }).catch(console.error);
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};
```

## Frontend implementation

### Project Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── tb/
│   │   │   ├── PhaseList.tsx
│   │   │   ├── PlanetCard.tsx
│   │   │   ├── MissionDetails.tsx
│   │   │   └── WaveBreakdown.tsx
│   │   ├── squads/
│   │   │   ├── SquadBuilder.tsx
│   │   │   ├── SquadCard.tsx
│   │   │   └── UnitSelector.tsx
│   │   └── admin/
│   │       ├── Dashboard.tsx
│   │       ├── UserManagement.tsx
│   │       └── ContentEditor.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── TerritoryBattle.tsx
│   │   ├── Phase.tsx
│   │   ├── Planet.tsx
│   │   ├── Mission.tsx
│   │   ├── Login.tsx
│   │   └── Admin.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useApi.ts
│   │   └── useTerritoryBattle.ts
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── tbStore.ts
│   │   └── squadStore.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   └── tb.service.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   └── helpers.ts
│   ├── styles/
│   │   └── globals.css
│   ├── App.tsx
│   └── main.tsx
├── public/
├── .env.example
├── Dockerfile
├── vite.config.ts
└── package.json
```

### Key Frontend Components

#### State Management with Zustand
```typescript
// store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        const { user, token } = response.data;
        
        set({ user, token, isAuthenticated: true });
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      },
      
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        delete api.defaults.headers.common['Authorization'];
      },
      
      checkAuth: () => {
        const token = localStorage.getItem('token');
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          set({ isAuthenticated: true });
        }
      }
    }),
    {
      name: 'auth-storage'
    }
  )
);
```

#### Territory Battle Store
```typescript
// store/tbStore.ts
import { create } from 'zustand';

interface TBState {
  territoryBattle: TerritoryBattle | null;
  currentPhase: Phase | null;
  currentPlanet: Planet | null;
  currentMission: Mission | null;
  
  loadTerritoryBattle: (slug: string) => Promise<void>;
  selectPhase: (phaseId: number) => void;
  selectPlanet: (planetId: number) => void;
  selectMission: (missionId: number) => void;
}

export const useTBStore = create<TBState>((set, get) => ({
  territoryBattle: null,
  currentPhase: null,
  currentPlanet: null,
  currentMission: null,
  
  loadTerritoryBattle: async (slug: string) => {
    const response = await api.get(`/tb/${slug}`);
    set({ territoryBattle: response.data });
  },
  
  selectPhase: (phaseId: number) => {
    const phase = get().territoryBattle?.phases.find(p => p.id === phaseId);
    set({ currentPhase: phase });
  },
  
  selectPlanet: async (planetId: number) => {
    const response = await api.get(`/planets/${planetId}`);
    set({ currentPlanet: response.data });
  },
  
  selectMission: async (missionId: number) => {
    const response = await api.get(`/missions/${missionId}`);
    set({ currentMission: response.data });
  }
}));
```

#### Mission Details Component
```typescript
// components/tb/MissionDetails.tsx
import React, { useState } from 'react';
import { Mission, Squad } from '../../types';
import { WaveBreakdown } from './WaveBreakdown';
import { SquadCard } from '../squads/SquadCard';

interface MissionDetailsProps {
  mission: Mission;
  recommendations: MissionRecommendation[];
}

export const MissionDetails: React.FC<MissionDetailsProps> = ({ mission, recommendations }) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'waves' | 'squads'>('overview');
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">{mission.name}</h2>
      
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setSelectedTab('overview')}
          className={`px-4 py-2 rounded ${selectedTab === 'overview' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setSelectedTab('waves')}
          className={`px-4 py-2 rounded ${selectedTab === 'waves' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Waves ({mission.wave_count})
        </button>
        <button
          onClick={() => setSelectedTab('squads')}
          className={`px-4 py-2 rounded ${selectedTab === 'squads' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Recommended Squads
        </button>
      </div>
      
      {selectedTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-semibold">Type:</span> {mission.mission_type}
            </div>
            <div>
              <span className="font-semibold">Combat Type:</span> {mission.combat_type}
            </div>
            <div>
              <span className="font-semibold">Required Units:</span> {mission.unit_count}
            </div>
            <div>
              <span className="font-semibold">Territory Points:</span> {mission.territory_points?.toLocaleString()}
            </div>
          </div>
          
          {mission.required_factions && mission.required_factions.length > 0 && (
            <div>
              <span className="font-semibold">Required Factions:</span>
              <div className="flex gap-2 mt-2">
                {mission.required_factions.map(faction => (
                  <span key={faction} className="px-3 py-1 bg-gray-200 rounded-full text-sm">
                    {faction}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {mission.modifiers && mission.modifiers.length > 0 && (
            <div>
              <span className="font-semibold">Active Modifiers:</span>
              <ul className="mt-2 space-y-1">
                {mission.modifiers.map((mod, idx) => (
                  <li key={idx} className="text-sm text-gray-600">
                    • {mod.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {selectedTab === 'waves' && (
        <WaveBreakdown missionId={mission.id} />
      )}
      
      {selectedTab === 'squads' && (
        <div className="space-y-4">
          {recommendations
            .sort((a, b) => a.priority - b.priority)
            .map(rec => (
              <SquadCard key={rec.id} squad={rec.squad} recommendation={rec} />
            ))}
        </div>
      )}
    </div>
  );
};
```

#### Admin Dashboard
```typescript
// components/admin/Dashboard.tsx
import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { UserManagement } from './UserManagement';
import { ContentEditor } from './ContentEditor';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [activeSection, setActiveSection] = useState('overview');
  
  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    return <div>Access denied</div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        <aside className="w-64 bg-white shadow-md">
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setActiveSection('overview')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded"
                >
                  Overview
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveSection('users')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded"
                >
                  Users
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveSection('content')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded"
                >
                  Content Management
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveSection('audit')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded"
                >
                  Audit Logs
                </button>
              </li>
            </ul>
          </nav>
        </aside>
        
        <main className="flex-1 p-8">
          {activeSection === 'overview' && <DashboardOverview />}
          {activeSection === 'users' && <UserManagement />}
          {activeSection === 'content' && <ContentEditor />}
          {activeSection === 'audit' && <AuditLogs />}
        </main>
      </div>
    </div>
  );
};
```

## Game data structure

### Territory Battle Hierarchy
```
Rise of the Empire
├── Phase 1 (Relic 5+)
│   ├── Mustafar (Dark Side)
│   │   ├── 4 Combat Missions
│   │   ├── 1 Fleet Mission
│   │   └── Operations
│   ├── Corellia (Mixed)
│   │   ├── 3 Combat Missions
│   │   ├── 1 Special Mission
│   │   ├── 1 Fleet Mission
│   │   └── Operations
│   └── Coruscant (Light Side)
│       ├── 4 Combat Missions
│       ├── 1 Fleet Mission
│       └── Operations
├── Phase 2 (Relic 6+)
│   ├── Geonosis (Dark Side)
│   ├── Felucia (Mixed)
│   └── Bracca (Light Side)
├── Phase 3 (Relic 7+)
│   ├── Dathomir (Dark Side)
│   ├── Tatooine (Mixed)
│   ├── Kashyyyk (Light Side)
│   └── Zeffo (Light Side - Bonus)
├── Phase 4 (Relic 8+)
│   ├── Haven Medical Station (Dark Side)
│   ├── Kessel (Mixed)
│   ├── Lothal (Light Side)
│   └── Mandalore (Mixed - Bonus)
├── Phase 5 (Relic 9+)
│   ├── Malachor (Dark Side)
│   ├── Vandor (Mixed)
│   └── Ring of Kafrene (Light Side)
└── Phase 6 (Relic 9+)
    ├── Death Star (Dark Side)
    ├── Hoth (Mixed)
    └── Scarif (Light Side)
```

### Territory Points Requirements (per planet)
```javascript
const starRequirements = {
  phase1: {
    mustafar: { 1: 116406250, 2: 186250000, 3: 248333333 },
    corellia: { 1: 113203125, 2: 181125000, 3: 241500000 },
    coruscant: { 1: 111718750, 2: 178750000, 3: 238333333 }
  },
  phase2: {
    geonosis: { 1: 148125000, 2: 237000000, 3: 316000000 },
    felucia: { 1: 143906250, 2: 230250000, 3: 307000000 },
    bracca: { 1: 142265625, 2: 227625000, 3: 303500000 }
  },
  phase3: {
    dathomir: { 1: 154921875, 2: 247875000, 3: 330500000 },
    tatooine: { 1: 190953125, 2: 305525000, 3: 407366667 },
    kashyyyk: { 1: 143589583, 2: 229743333, 3: 306324444 },
    zeffo: { 1: 147552083, 2: 236083333, 3: 287179167 }
  },
  // ... continue for phases 4-6
};
```

## Deployment instructions

### Docker Configuration

#### Backend Dockerfile
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate

EXPOSE 5000
CMD ["npm", "start"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: tb_tracker
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/tb_tracker
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "5000:5000"
    volumes:
      - ./backend/.env:/app/.env

  frontend:
    build: ./frontend
    environment:
      VITE_API_URL: http://backend:5000
    depends_on:
      - backend
    ports:
      - "3000:80"

volumes:
  postgres_data:
```

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/tb_tracker
DB_USER=user
DB_PASSWORD=password

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=24h

# Server
PORT=5000
NODE_ENV=development

# Logging
LOG_LEVEL=info

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# Future Discord OAuth
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Rise of the Empire TB Tracker
```

### Database Migration and Seeding

#### Initial Migration
```bash
# Generate Prisma client
npx prisma generate

# Create initial migration
npx prisma migrate dev --name init

# Run migrations in production
npx prisma migrate deploy
```

#### Seed Script (prisma/seed.ts)
```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.users.create({
    data: {
      username: 'admin',
      email: 'admin@example.com',
      password_hash: adminPassword,
      role: 'super_admin'
    }
  });

  // Create Rise of the Empire TB
  const tb = await prisma.territory_battles.create({
    data: {
      name: 'Rise of the Empire',
      slug: 'rise-of-the-empire',
      description: 'Classic Territory Battle featuring Imperial forces',
      total_phases: 6
    }
  });

  // Create phases
  const phases = await Promise.all([
    prisma.phases.create({
      data: {
        territory_battle_id: tb.id,
        phase_number: 1,
        name: 'Phase 1 (Zone 1)',
        relic_requirement: 'Relic 5+'
      }
    }),
    // ... create all 6 phases
  ]);

  // Create planets for Phase 1
  const mustafar = await prisma.planets.create({
    data: {
      phase_id: phases[0].id,
      name: 'Mustafar',
      slug: 'mustafar',
      alignment: 'dark_side',
      star_requirements: {
        1: 116406250,
        2: 186250000,
        3: 248333333
      }
    }
  });

  // Import units from game data
  // This would typically be done via bulk import from SWGOH.gg API or similar

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Production Deployment Steps

1. **Initial Setup**
```bash
# Clone repository
git clone <repository-url>
cd tb-tracker

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
```

2. **Database Setup**
```bash
# Create production database
createdb tb_tracker_production

# Run migrations
cd backend
npx prisma migrate deploy

# Seed initial data
npm run seed
```

3. **Build and Deploy with Docker**
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

4. **Nginx Configuration (if not using Docker)**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Security considerations

### Implementation Checklist
- [x] Password hashing with bcrypt (10+ rounds)
- [x] JWT token authentication with expiration
- [x] Role-based access control (RBAC)
- [x] Input validation on all endpoints
- [x] SQL injection prevention via Prisma ORM
- [x] CORS configuration for production
- [x] Rate limiting on authentication endpoints
- [x] Audit logging for all data modifications
- [x] HTTPS enforcement in production
- [x] Environment variable protection
- [x] XSS protection via React's default escaping
- [x] CSRF token implementation for state-changing operations

### Security Headers (Helmet.js)
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later'
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

## Testing strategy

### Backend Testing
```typescript
// tests/auth.test.ts
import request from 'supertest';
import app from '../src/app';

describe('Authentication', () => {
  test('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!'
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user.email).toBe('test@example.com');
  });
  
  test('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Test123!'
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});
```

### Frontend Testing
```typescript
// tests/MissionDetails.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MissionDetails } from '../src/components/tb/MissionDetails';

describe('MissionDetails', () => {
  const mockMission = {
    id: 1,
    name: 'Test Mission',
    mission_type: 'combat',
    combat_type: 'regular',
    wave_count: 3,
    unit_count: 5
  };
  
  test('renders mission details', () => {
    render(<MissionDetails mission={mockMission} recommendations={[]} />);
    
    expect(screen.getByText('Test Mission')).toBeInTheDocument();
    expect(screen.getByText('Waves (3)')).toBeInTheDocument();
  });
  
  test('switches between tabs', () => {
    render(<MissionDetails mission={mockMission} recommendations={[]} />);
    
    const wavesTab = screen.getByText('Waves (3)');
    fireEvent.click(wavesTab);
    
    expect(wavesTab).toHaveClass('bg-blue-500');
  });
});
```

## Future enhancements

### Phase 2 Features (Months 2-3)
1. **Discord OAuth Integration**
   - Implement passport-discord strategy
   - Link Discord accounts to users
   - Guild verification for access control

2. **Advanced Search and Filtering**
   - Full-text search across all content
   - Filter by faction, gear requirements, success rate
   - Save custom filters and views

3. **Community Features**
   - User comments on squad recommendations
   - Voting system for best strategies
   - User-submitted guide articles

4. **Analytics Dashboard**
   - Track most viewed missions
   - Popular squad compositions
   - Success rate tracking

### Phase 3 Features (Months 4-6)
1. **Mobile App**
   - React Native companion app
   - Push notifications for TB phases
   - Offline mode with data sync

2. **AI-Powered Recommendations**
   - Machine learning for squad optimization
   - Predictive success rates
   - Personalized recommendations based on roster

3. **Additional Territory Battles**
   - Support for Geonosis TB
   - Support for Hoth TB
   - Generic framework for future TBs

4. **Guild Management Tools**
   - Guild member tracking
   - Deployment coordination
   - Performance analytics

5. **API for Third-Party Tools**
   - Public REST API
   - GraphQL endpoint
   - Webhook support for updates

## Conclusion

This comprehensive development plan provides all the necessary components to build a modern, scalable Rise of the Empire Territory Battle tracker. The architecture emphasizes:

- **Modularity**: Clean separation between frontend, backend, and database
- **Scalability**: Designed to handle growth in users and content
- **Security**: Multiple layers of protection and audit trails
- **User Experience**: Intuitive navigation and responsive design
- **Maintainability**: Clear code organization and documentation
- **Extensibility**: Easy to add new features and territory battles

The MVP focuses on core functionality with a text-based hierarchy, allowing for rapid development while maintaining the flexibility to add visual enhancements and advanced features in future iterations.

Key implementation priorities:
1. Set up development environment and database schema
2. Implement authentication and authorization
3. Create basic CRUD operations for missions and squads
4. Build the hierarchical navigation (TB → Phase → Planet → Mission)
5. Implement squad recommendation system
6. Add admin dashboard for content management
7. Deploy to production with Docker

This plan provides a solid foundation that can evolve based on user feedback and community needs while maintaining high code quality and performance standards.