#!/usr/bin/env python3

import hashlib
import hmac
import json
import time
import requests
from urllib.parse import urlencode

class SWGoHComlinkAPI:
    def __init__(self, base_url="http://localhost:5000", access_key="poc-access-key", secret_key="poc-secret-key"):
        self.base_url = base_url
        self.access_key = access_key
        self.secret_key = secret_key
    
    def _generate_hmac_signature(self, method, path, query_string, headers, payload):
        """Generate HMAC signature for API authentication"""
        # Create canonical request
        canonical_headers = ""
        for key in sorted(headers.keys()):
            canonical_headers += f"{key.lower()}:{headers[key]}\n"
        
        canonical_request = f"{method}\n{path}\n{query_string}\n{canonical_headers}\n{payload}"
        
        # Create signature
        signature = hmac.new(
            self.secret_key.encode('utf-8'),
            canonical_request.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return signature
    
    def make_request(self, endpoint, payload=None, method="POST"):
        """Make authenticated request to Comlink API"""
        url = f"{self.base_url}{endpoint}"
        # Use milliseconds timestamp!
        timestamp = str(int(time.time() * 1000))
        
        headers = {
            "Content-Type": "application/json",
            "X-Date": timestamp
        }
        
        body = json.dumps(payload) if payload else ""
        
        # Generate HMAC signature
        signature = self._generate_hmac_signature(
            method, endpoint, "", headers, body
        )
        
        headers["Authorization"] = f"HMAC-SHA256 Credential={self.access_key},Signature={signature}"
        
        if method == "POST":
            response = requests.post(url, headers=headers, data=body)
        else:
            response = requests.get(url, headers=headers)
        
        return response

def test_comlink_api():
    """Test various Comlink API endpoints with correct millisecond timestamps"""
    print("🧪 Testing SWGoH Comlink API with millisecond timestamps...")
    
    api = SWGoHComlinkAPI()
    
    # Test 1: Metadata endpoint
    print("\n📊 Testing /metadata endpoint...")
    try:
        response = api.make_request("/metadata")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Metadata loaded successfully!")
            print(f"📦 Version: {data.get('version', 'unknown')}")
            print(f"📦 Data keys: {list(data.keys())[:10]}...")  # Show first 10 keys
            return True
        else:
            print(f"❌ Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def test_game_data():
    """Test the main game data endpoint"""
    print("\n🎮 Testing /data endpoint...")
    api = SWGoHComlinkAPI()
    
    try:
        response = api.make_request("/data", {"payload": {}})
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Game data loaded successfully!")
            
            # Show what data is available
            if isinstance(data, dict):
                print(f"📦 Top-level keys: {list(data.keys())}")
                
                # Look for units data
                if 'units' in data:
                    units = data['units']
                    print(f"🎯 Found {len(units)} units!")
                    # Show first few unit examples
                    for i, unit in enumerate(units[:3]):
                        name = unit.get('nameKey', unit.get('id', 'Unknown'))
                        print(f"  Unit {i+1}: {name}")
                        
            return True
        else:
            print(f"❌ Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

if __name__ == "__main__":
    success1 = test_comlink_api()
    success2 = test_game_data() if success1 else False
    
    if success1 or success2:
        print("\n🎉 SUCCESS! API authentication working with millisecond timestamps!")
        print("🚀 Ready to integrate with your TB tracker application!")
    else:
        print("\n💥 Still having authentication issues - may need to check HMAC implementation")