# SWGoH Asset Download - Quick Start

## Problem Summary
- ❌ Previous scripts used hardcoded lists (~90 units)
- ❌ Downloads were creating SVG placeholders instead of real PNGs
- ❌ Missing 285+ units from the full roster

## Solution
✅ New script uses swgoh.gg API to download ALL 444 units as real PNG images

## Quick Start

### Download All Portraits

```bash
# Using environment variable (recommended)
export SWGOH_GG_API_KEY="6955f"
node tools/download-all-portraits.js

# Or pass API key directly
node tools/download-all-portraits.js 6955f
```

### What You'll Get
- **375 character portraits** → `assets/characters/*.png`
- **69 ship portraits** → `assets/ships/*.png`
- **Real PNG images** (128x128, RGBA, 12-25 KB each)
- **Asset manifest** → `assets/manifest.json`

### Expected Time
~90 seconds for all 444 units (with rate limiting)

### Verify Downloads

```bash
# Check character count
ls assets/characters/*.png | wc -l

# Check ship count
ls assets/ships/*.png | wc -l

# Verify they're real PNGs
file assets/characters/DARTHVADER.png
# Output: PNG image data, 128 x 128, 8-bit/color RGBA, non-interlaced
```

## Test Results (Already Completed)

✅ **2 test downloads successful:**
```bash
assets/characters/TRIPLEZERO.png    - 16 KB PNG (128x128 RGBA)
assets/characters/ADMIRALRADDUS.png - 20 KB PNG (128x128 RGBA)
```

## Full Documentation
See `claudedocs/ASSET-DOWNLOAD-SOLUTION.md` for complete details.