#!/usr/bin/env python3

import hashlib
import hmac
import json
import time
import requests

class SWGoHComlinkAPI:
    def __init__(self, base_url="http://localhost:5000", access_key="poc-access-key", secret_key="poc-secret-key"):
        self.base_url = base_url
        self.access_key = access_key
        self.secret_key = secret_key
    
    def _generate_hmac_signature(self, method, uri, body, req_time):
        """Generate HMAC signature using the correct format from comlink-js"""
        
        # Create HMAC
        hmac_obj = hmac.new(self.secret_key.encode('utf-8'), digestmod=hashlib.sha256)
        
        # Update with request time (as string)
        hmac_obj.update(req_time.encode('utf-8'))
        
        # Update with HTTP method
        hmac_obj.update(method.encode('utf-8'))
        
        # Update with URI path
        hmac_obj.update(uri.encode('utf-8'))
        
        # Create MD5 hash of body and update HMAC
        body_str = json.dumps(body) if body else ""
        body_md5 = hashlib.md5(body_str.encode('utf-8')).hexdigest()
        hmac_obj.update(body_md5.encode('utf-8'))
        
        # Return hex digest
        return hmac_obj.hexdigest()
    
    def make_request(self, endpoint, payload=None, method="POST"):
        """Make authenticated request to Comlink API with correct HMAC format"""
        url = f"{self.base_url}{endpoint}"
        req_time = str(int(time.time() * 1000))  # milliseconds
        
        # Generate HMAC signature
        signature = self._generate_hmac_signature(method, endpoint, payload, req_time)
        
        # Prepare headers
        headers = {
            "Content-Type": "application/json",
            "X-Date": req_time,
            "Authorization": f"HMAC-SHA256 Credential={self.access_key},Signature={signature}"
        }
        
        # Make request
        body_data = json.dumps(payload) if payload else "{}"
        
        if method == "POST":
            response = requests.post(url, headers=headers, data=body_data)
        else:
            response = requests.get(url, headers=headers)
        
        return response

def test_authentication():
    """Test the corrected authentication implementation"""
    print("🧪 Testing SWGoH Comlink API with corrected HMAC implementation...")
    
    api = SWGoHComlinkAPI()
    
    # Test 1: Metadata endpoint
    print("\n📊 Testing /metadata endpoint...")
    try:
        response = api.make_request("/metadata", {})
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ SUCCESS! Metadata loaded!")
            print(f"📦 Version: {data.get('version', 'unknown')}")
            print(f"📦 Keys available: {list(data.keys())[:10]}")
            return True
        else:
            print(f"❌ Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

def test_game_data():
    """Test the main game data endpoint"""
    print("\n🎮 Testing /data endpoint for game data...")
    api = SWGoHComlinkAPI()
    
    try:
        # Use empty payload object as per API docs
        response = api.make_request("/data", {})
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ SUCCESS! Game data loaded!")
            
            # Explore the data structure
            if isinstance(data, dict):
                print(f"📦 Top-level keys: {list(data.keys())}")
                
                # Look for units
                if 'units' in data:
                    units = data['units']
                    print(f"🎯 Found {len(units)} units!")
                    
                    # Show sample units
                    for i, unit in enumerate(units[:5]):
                        name_key = unit.get('nameKey', 'NO_NAME')
                        unit_id = unit.get('id', 'NO_ID')
                        print(f"  Unit {i+1}: {name_key} (ID: {unit_id})")
                        
                # Look for other useful data
                for key in ['abilities', 'equipment', 'campaigns']:
                    if key in data:
                        print(f"🎯 Found {len(data[key])} {key}")
            
            return True
        else:
            print(f"❌ Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Testing corrected HMAC authentication implementation\n")
    
    # Test both endpoints
    metadata_success = test_authentication()
    data_success = test_game_data() if metadata_success else False
    
    if metadata_success:
        print("\n🎉 BREAKTHROUGH! API authentication working correctly!")
        print("✅ Timestamp format: milliseconds")
        print("✅ HMAC format: reqTime + method + uri + md5(body)")
        print("🚀 Ready for production integration!")
    else:
        print("\n💥 Still debugging authentication...")