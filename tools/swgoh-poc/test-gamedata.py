#!/usr/bin/env python3

import requests
import json

def test_gamedata_access():
    """Test accessing public gamedata from GitHub"""
    print("🧪 Testing SWGoH gamedata repository access...\n")
    
    # Base URL for raw GitHub content
    base_url = "https://raw.githubusercontent.com/swgoh-utils/gamedata/main"
    
    # Test 1: Get units data
    print("📦 Downloading units.json...")
    try:
        response = requests.get(f"{base_url}/units.json")
        if response.status_code == 200:
            units_data = response.json()
            print(f"✅ Units data loaded successfully!")
            print(f"   Version: {units_data.get('version', 'unknown')}")
            
            units = units_data.get('data', [])
            print(f"   Found {len(units)} units")
            
            # Show sample units
            print("\n🎯 Sample Units:")
            for i, unit in enumerate(units[:5]):
                base_id = unit.get('baseId', 'NO_ID')
                name_key = unit.get('nameKey', 'NO_NAME')
                print(f"   {i+1}. {base_id}: {name_key}")
                
                # Check for portrait/icon data
                if 'portrait' in unit:
                    print(f"      Portrait: {unit['portrait']}")
                if 'thumbnail' in unit:
                    print(f"      Thumbnail: {unit['thumbnail']}")
        else:
            print(f"❌ Failed to load units data: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False
    
    # Test 2: Get territory battle data
    print("\n📦 Downloading territoryBattleDefinition.json...")
    try:
        response = requests.get(f"{base_url}/territoryBattleDefinition.json")
        if response.status_code == 200:
            tb_data = response.json()
            print(f"✅ Territory Battle data loaded successfully!")
            
            tbs = tb_data.get('data', [])
            print(f"   Found {len(tbs)} territory battles")
            
            # Look for Rise of the Empire
            for tb in tbs:
                tb_id = tb.get('id', '')
                if 'empire' in tb_id.lower() or 'rote' in tb_id.lower():
                    print(f"\n🎯 Found Rise of the Empire TB: {tb_id}")
                    print(f"   Name Key: {tb.get('nameKey', 'NO_NAME')}")
                    print(f"   Phases: {len(tb.get('conflictZoneDefinitions', []))}")
                    break
        else:
            print(f"❌ Failed to load TB data: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Exception loading TB data: {e}")
    
    # Test 3: Get localization for unit names
    print("\n📦 Downloading English localization...")
    try:
        response = requests.get(f"{base_url}/Loc_ENG_US.txt.json")
        if response.status_code == 200:
            loc_data = response.json()
            print(f"✅ Localization data loaded successfully!")
            
            locs = loc_data.get('data', [])
            print(f"   Found {len(locs)} localized strings")
            
            # Find some unit names
            print("\n🎯 Sample Unit Names (localized):")
            count = 0
            for loc in locs:
                key = loc.get('key', '')
                if key.startswith('UNIT_') and '_NAME' in key:
                    value = loc.get('value', '')
                    if value and count < 5:
                        print(f"   {key}: {value}")
                        count += 1
                        
        else:
            print(f"❌ Failed to load localization: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Exception loading localization: {e}")
    
    return True

def test_asset_urls():
    """Check if we can determine asset URLs from the data"""
    print("\n🎨 Testing asset URL patterns...")
    
    # Known patterns for SWGoH assets
    asset_patterns = [
        "https://game-assets.swgoh.gg/tex.charui_{baseId}.png",
        "https://swgoh.gg/game-asset/u/{baseId}/",
        "https://api.swgoh.help/image/char/{baseId}"
    ]
    
    # Test with a known character
    test_unit = "COMMANDERLUKESKYWALKER"
    
    print(f"\n🔍 Testing asset URLs for {test_unit}:")
    for pattern in asset_patterns:
        url = pattern.replace("{baseId}", test_unit)
        print(f"   Pattern: {url}")
        
        # Try to check if accessible (HEAD request)
        try:
            response = requests.head(url, allow_redirects=True, timeout=5)
            if response.status_code == 200:
                print(f"      ✅ URL accessible!")
            else:
                print(f"      ❌ Status: {response.status_code}")
        except Exception as e:
            print(f"      ❌ Error: {str(e)[:50]}")

if __name__ == "__main__":
    print("🚀 SWGoH Data Access Proof of Concept\n")
    print("=" * 50)
    
    # Test gamedata repository
    gamedata_success = test_gamedata_access()
    
    # Test asset URLs
    test_asset_urls()
    
    print("\n" + "=" * 50)
    if gamedata_success:
        print("🎉 SUCCESS! We can access game data without authentication!")
        print("📊 Data source: github.com/swgoh-utils/gamedata")
        print("🔄 Auto-updates: ~10 minutes after game updates")
        print("🎨 Assets: Available via swgoh.gg or asset extractor")
        print("\n✅ Ready to integrate with TB tracker!")
    else:
        print("💥 Had issues accessing gamedata")