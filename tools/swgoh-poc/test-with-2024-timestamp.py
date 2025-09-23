#!/usr/bin/env python3

import hashlib
import hmac
import json
import requests
from urllib.parse import urlencode

# Try with a 2024 timestamp (January 1, 2024)
FIXED_TIMESTAMP = "1704067200"  # Jan 1, 2024 00:00:00 UTC

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
        
        headers = {
            "Content-Type": "application/json",
            "X-Date": FIXED_TIMESTAMP
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
    """Test various Comlink API endpoints with 2024 timestamp"""
    print(f"🧪 Testing SWGoH Comlink API with fixed timestamp: {FIXED_TIMESTAMP}")
    
    api = SWGoHComlinkAPI()
    
    # Test 1: Metadata endpoint
    print("\n📊 Testing /metadata endpoint...")
    try:
        response = api.make_request("/metadata")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Metadata loaded - Version: {data.get('version', 'unknown')}")
            print(f"📦 Data size: {len(json.dumps(data))} characters")
            return True
        else:
            print(f"❌ Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

if __name__ == "__main__":
    success = test_comlink_api()
    if success:
        print("\n🎉 SUCCESS! API authentication working with 2024 timestamp")
    else:
        print("\n💥 Still having authentication issues")