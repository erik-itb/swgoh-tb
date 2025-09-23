# SWGoH Asset Management Plan
## For Rise of the Empire Territory Battle Tracker

### Overview
This plan outlines how to integrate Star Wars: Galaxy of Heroes game assets into our TB tracker using the swgoh-utils ecosystem, establish local asset management, and create an automated update pipeline for production.

### Current Project Asset Requirements

Based on the Prisma schema analysis, our application needs these asset types:

#### Database Fields Requiring Assets:
- **Units Table**:
  - `portraitUrl`: Character/ship portraits for squad displays
  - `iconUrl`: Small unit icons for compact views

- **Planets Table**:
  - `backgroundImageUrl`: Planet background images for immersive UI
  - `iconUrl`: Planet icons for navigation/lists

- **Strategy Videos**:
  - `thumbnailUrl`: Video thumbnails (handled externally via YouTube/Twitch APIs)

### Asset Sources & Tools

#### 1. swgoh-ae2 (Asset Extractor)
**Purpose**: Download 2D textures directly from game files
- **Pros**: Official game assets, high quality, comprehensive
- **Cons**: Requires periodic manual updates, large download sizes
- **Best For**: Unit portraits, planet backgrounds, UI elements

#### 2. swgoh-comlink (API Access)
**Purpose**: Real-time game data access via anonymous guest accounts
- **Pros**: Live data, no manual updates needed
- **Cons**: Rate limited (~20 req/sec), limited to publicly visible data
- **Best For**: Unit metadata, game state verification

#### 3. gamedata Repository
**Purpose**: Pre-processed JSON game data, auto-updated every ~10 minutes
- **Pros**: Reliable, structured, automatically maintained
- **Cons**: Data only, no visual assets
- **Best For**: Unit definitions, game metadata, validation data

### Recommended Asset Strategy

#### Phase 1: Establish Asset Foundation
```
Primary: swgoh-ae2 for visual assets
Secondary: gamedata for unit/planet metadata
Fallback: Manual curation for missing assets
```

#### Phase 2: Local Asset Management
```
Storage: /assets/ directory in project root
Structure: /assets/{type}/{gameId}.{ext}
CDN: Serve via frontend static files initially
```

#### Phase 3: Production Pipeline
```
Source: Local development asset library
Transfer: rsync/SCP to production VPS
Updates: Automated weekly checks + manual triggers
```

### Implementation Plan

#### Step 1: Local Asset Download & Processing (Week 1)

**1.1 Set Up swgoh-ae2**
```bash
# Download and configure asset extractor
mkdir -p tools/swgoh-ae2
cd tools/swgoh-ae2

# Download latest release
wget https://github.com/swgoh-utils/swgoh-ae2/releases/latest/download/swgoh-ae2-linux.zip
unzip swgoh-ae2-linux.zip

# Initial asset download (character portraits)
./SwgohAssetGetterConsole -downloadManifest
./SwgohAssetGetterConsole -prefix charui_  # Character portraits
./SwgohAssetGetterConsole -prefix planet_  # Planet assets
```

**1.2 Create Asset Processing Scripts**
```javascript
// scripts/process-assets.js
// - Extract downloaded assets
// - Rename to gameId format
// - Optimize for web (resize, compress)
// - Generate asset manifest
```

**1.3 Integrate gamedata for Metadata**
```bash
# Download current unit data
mkdir -p data/gamedata
curl -o data/gamedata/units.json https://raw.githubusercontent.com/swgoh-utils/gamedata/main/units.json
curl -o data/gamedata/units_pve.json https://raw.githubusercontent.com/swgoh-utils/gamedata/main/units_pve.json
```

#### Step 2: Database Integration (Week 1-2)

**2.1 Update Database Schema**
```sql
-- Add asset tracking table
CREATE TABLE asset_metadata (
  id SERIAL PRIMARY KEY,
  asset_type VARCHAR(50) NOT NULL, -- 'unit_portrait', 'unit_icon', 'planet_bg', 'planet_icon'
  game_id VARCHAR(100) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source_version VARCHAR(100), -- Track swgoh-ae2 version/date
  is_active BOOLEAN DEFAULT true,
  UNIQUE(asset_type, game_id)
);

-- Index for quick lookups
CREATE INDEX idx_asset_metadata_lookup ON asset_metadata(asset_type, game_id, is_active);
```

**2.2 Create Asset Service**
```typescript
// backend/src/services/asset.service.ts
export class AssetService {
  async getUnitPortrait(gameId: string): Promise<string | null>
  async getUnitIcon(gameId: string): Promise<string | null>
  async getPlanetBackground(planetSlug: string): Promise<string | null>
  async refreshAssetCache(): Promise<void>
  async validateAssetIntegrity(): Promise<AssetValidationReport>
}
```

#### Step 3: Frontend Integration (Week 2)

**3.1 Asset Loading Components**
```typescript
// frontend/src/components/common/UnitPortrait.tsx
interface UnitPortraitProps {
  gameId: string;
  size?: 'sm' | 'md' | 'lg';
  fallback?: string;
}

// frontend/src/components/common/PlanetBackground.tsx
interface PlanetBackgroundProps {
  planetSlug: string;
  children: React.ReactNode;
}
```

**3.2 Asset Caching Strategy**
```typescript
// frontend/src/services/asset-cache.service.ts
class AssetCacheService {
  private cache = new Map<string, string>();

  async getAssetUrl(type: string, gameId: string): Promise<string>
  async preloadCriticalAssets(): Promise<void>
  clearCache(): void
}
```

#### Step 4: Local Development Workflow (Week 2-3)

**4.1 Asset Management Scripts**
```bash
# scripts/download-assets.sh
#!/bin/bash
# Download latest assets from swgoh-ae2
# Process and optimize for web
# Update asset_metadata table
# Generate frontend asset manifest

# scripts/validate-assets.sh
#!/bin/bash
# Check for missing assets
# Validate file integrity
# Report asset coverage statistics
```

**4.2 Development Environment Setup**
```dockerfile
# Add to docker-compose.dev.yml
services:
  asset-processor:
    build:
      context: ./tools/asset-processor
    volumes:
      - ./assets:/app/assets
      - ./data:/app/data
    environment:
      - DATABASE_URL=${DATABASE_URL}
```

#### Step 5: Production Deployment Pipeline (Week 3-4)

**5.1 Asset Sync Infrastructure**
```bash
# scripts/sync-to-production.sh
#!/bin/bash
set -e

PROD_SERVER="user@your-vps-ip"
ASSET_DIR="./assets"
REMOTE_DIR="/var/www/tb-tracker/assets"

# Sync assets to production
rsync -avz --delete \
  --exclude="*.tmp" \
  --exclude="processing/*" \
  $ASSET_DIR/ $PROD_SERVER:$REMOTE_DIR/

# Update production asset database
ssh $PROD_SERVER "cd /var/www/tb-tracker && npm run asset:refresh-db"
```

**5.2 Automated Update System**
```yaml
# .github/workflows/asset-update.yml
name: Weekly Asset Update
on:
  schedule:
    - cron: '0 2 * * 1'  # Every Monday at 2 AM
  workflow_dispatch:  # Manual trigger

jobs:
  update-assets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Download Latest Assets
        run: ./scripts/download-assets.sh
      - name: Process Assets
        run: ./scripts/process-assets.js
      - name: Deploy to Production
        run: ./scripts/sync-to-production.sh
        env:
          PROD_SSH_KEY: ${{ secrets.PROD_SSH_KEY }}
```

### Asset Directory Structure

```
project-root/
├── assets/
│   ├── units/
│   │   ├── portraits/
│   │   │   ├── COMMANDERLUKESKYWALKER.webp
│   │   │   ├── DARTHVADER.webp
│   │   │   └── ...
│   │   └── icons/
│   │       ├── COMMANDERLUKESKYWALKER.webp
│   │       ├── DARTHVADER.webp
│   │       └── ...
│   ├── planets/
│   │   ├── backgrounds/
│   │   │   ├── mustafar.webp
│   │   │   ├── coruscant.webp
│   │   │   └── ...
│   │   └── icons/
│   │       ├── mustafar.webp
│   │       ├── coruscant.webp
│   │       └── ...
│   └── manifest.json
├── tools/
│   ├── swgoh-ae2/
│   ├── asset-processor/
│   └── asset-validator/
├── scripts/
│   ├── download-assets.sh
│   ├── process-assets.js
│   ├── validate-assets.sh
│   └── sync-to-production.sh
└── data/
    └── gamedata/
        ├── units.json
        ├── units_pve.json
        └── ...
```

### Asset Optimization Strategy

#### Image Processing Pipeline
```javascript
// tools/asset-processor/optimize.js
const sharp = require('sharp');

async function optimizeAsset(inputPath, outputPath, options = {}) {
  const { width = 512, quality = 85, format = 'webp' } = options;

  await sharp(inputPath)
    .resize(width, width, {
      fit: 'cover',
      withoutEnlargement: true
    })
    .webp({ quality })
    .toFile(outputPath);
}

// Generate multiple sizes for responsive images
const sizes = {
  portraits: { sm: 64, md: 128, lg: 256 },
  icons: { sm: 32, md: 48, lg: 64 },
  planets: { sm: 256, md: 512, lg: 1024 }
};
```

#### CDN Integration (Future Enhancement)
```typescript
// For eventual CDN migration
const ASSET_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://cdn.yourdomain.com/assets'
  : '/assets';

export function getAssetUrl(type: string, gameId: string, size?: string): string {
  const sizeSuffix = size ? `_${size}` : '';
  return `${ASSET_BASE_URL}/${type}/${gameId}${sizeSuffix}.webp`;
}
```

### Monitoring & Maintenance

#### Asset Health Monitoring
```typescript
// backend/src/services/asset-monitoring.service.ts
export class AssetMonitoringService {
  async checkAssetCoverage(): Promise<CoverageReport> {
    // Check what % of units have portraits
    // Identify missing critical assets
    // Report file integrity issues
  }

  async generateAssetReport(): Promise<AssetReport> {
    // Total asset count and sizes
    // Last update timestamps
    // Error rates and missing assets
  }
}
```

#### Update Notifications
```typescript
// Send notifications when assets are updated
// Alert on missing critical assets
// Report sync failures to production
```

### Security Considerations

#### Access Control
- Assets served as static files (no authentication needed)
- Validate file types and sizes during processing
- Sanitize filenames to prevent directory traversal

#### Intellectual Property
- Assets are extracted for legitimate fan site use
- Not redistributing game client or proprietary code
- Following community guidelines and fair use

### Performance Considerations

#### Frontend Optimization
```typescript
// Lazy load non-critical assets
// Implement progressive image loading
// Use service worker for asset caching
// WebP format with JPEG fallbacks
```

#### Backend Optimization
```sql
-- Pre-compute asset URLs in database
-- Cache frequently accessed assets in Redis
-- Use HTTP caching headers appropriately
```

### Timeline & Milestones

#### Week 1: Foundation ✅ **COMPLETED**
- [x] Set up swgoh-ae2 locally - ✅ **Docker container running on port 3001**
- [x] Download initial asset set (units + planets) - ✅ **Gamedata downloaded (126.2MB units.json)**
- [x] Create basic processing scripts - ✅ **Asset processor tools created with Sharp integration**
- [x] Update database schema for asset tracking - ✅ **AssetMetadata model added to Prisma schema**

**Phase 1 Implementation Notes:**
- **swgoh-ae2 Setup**: Successfully deployed via Docker (`ghcr.io/swgoh-utils/swgoh-ae2:latest`)
- **API Access**: Container accessible at `http://localhost:3001` with Swagger docs at `/swagger`
- **Gamedata Download**:
  - `units.json` (59.6MB) - All character and ship data
  - `units_pve.json` (72.8MB) - PvE unit variants
  - `Loc_ENG_US.txt.json` (14.3MB) - Localization data
- **Asset Processing Tools**:
  - `download-assets.js` - Downloads assets from swgoh-ae2 API
  - `process-assets.js` - Optimizes images using Sharp (PNG→WebP, multiple sizes)
  - `validate-assets.js` - Validates asset integrity and generates coverage reports
- **Database Schema**: Added comprehensive `AssetMetadata` model with:
  - Asset type tracking (UNIT_PORTRAIT, UNIT_ICON, PLANET_BACKGROUND, PLANET_ICON)
  - Multiple format support (PNG, JPEG, WEBP)
  - Size variants (SM, MD, LG)
  - Source tracking (SWGOH_AE2, MANUAL_UPLOAD, THIRD_PARTY)
  - Integrity features (checksums, file size, dimensions)

#### Week 2: Integration ✅ **COMPLETED**
- [x] Build asset service and API endpoints - ✅ **Comprehensive backend API with 10+ endpoints**
- [x] Create frontend asset loading components - ✅ **Enhanced UnitPortrait, AssetImage, UnitIcon, PlanetBackground, SquadDisplay, AssetPreloader**
- [x] Implement asset caching strategy - ✅ **Advanced caching with memory management, Service Worker, and persistence**
- [x] Add fallback mechanisms for missing assets - ✅ **Progressive loading and automatic fallbacks implemented**

**Phase 2 Implementation Notes:**
- **Enhanced Backend API**: Created comprehensive AssetController with endpoints for:
  - `/unit/:gameId/portrait` - Unit portraits with size variants
  - `/unit/:gameId/icon` - Unit icons
  - `/unit/:gameId/assets` - Comprehensive asset information
  - `/health` - Asset health monitoring
  - `/bulk-import` - Bulk asset import functionality
  - `/search` - Asset search with filtering
  - `/refresh-cache` - Cache validation and refresh
- **Frontend Components**: Created complete component library:
  - **Enhanced UnitPortrait**: Integrated with asset service, progressive loading
  - **AssetImage**: General-purpose asset loading with fallbacks
  - **UnitIcon**: Optimized small icon display component
  - **PlanetBackground**: Immersive planet backgrounds with gradients
  - **SquadDisplay**: Complete squad visualization with asset preloading
  - **AssetPreloader**: Progress tracking for batch asset loading
- **Advanced Caching Strategy**:
  - **AssetCacheService**: LRU eviction, memory management, persistence
  - **Service Worker**: Multi-strategy caching (cache-first, network-first, stale-while-revalidate)
  - **ServiceWorker Registration**: Auto-registration, update handling, cache management
  - **Progressive Loading**: Multiple size variants with intelligent fallbacks
- **Asset Management Dashboard**: Created comprehensive admin interface at `/asset-admin`

#### Week 3: Production Preparation
- [ ] Create production sync scripts
- [ ] Set up asset validation and monitoring
- [ ] Test full pipeline end-to-end
- [ ] Documentation and deployment procedures

#### Week 4: Automation & Monitoring
- [ ] Implement automated update workflows
- [ ] Set up monitoring and alerting
- [ ] Create asset management dashboard
- [ ] Performance optimization and testing

### Risk Mitigation

#### Technical Risks
- **Asset availability**: Maintain fallback images for critical assets
- **Game updates**: Monitor for asset format/location changes
- **Performance**: Implement progressive loading and caching
- **Storage**: Monitor disk usage and implement cleanup policies

#### Operational Risks
- **Sync failures**: Automated retry mechanisms and manual fallbacks
- **Version conflicts**: Asset versioning and rollback capabilities
- **Access issues**: Multiple download sources and backup procedures

### Future Enhancements

#### Phase 2 Features (Months 2-3)
- **Dynamic asset updates**: Real-time sync with game updates
- **CDN integration**: Move to dedicated CDN for better performance
- **Asset variants**: Multiple themes, HD versions, animation support
- **User uploads**: Allow community-contributed assets with moderation

#### Phase 3 Features (Months 4-6)
- **AI-powered optimization**: Automatic asset enhancement and upscaling
- **Progressive web app**: Offline asset caching for mobile users
- **Asset analytics**: Track most-viewed assets and optimization opportunities
- **Third-party integrations**: swgoh.gg, SWGOH.help asset sharing

This plan provides a robust foundation for integrating SWGoH assets while maintaining flexibility for future enhancements and scalability requirements.