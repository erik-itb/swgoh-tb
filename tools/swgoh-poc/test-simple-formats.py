#!/usr/bin/env python3

import requests
import time

def test_timestamp_formats():
    """Test different timestamp formats to see what the API expects"""
    
    base_url = "http://localhost:5000"
    
    # Try different timestamp formats
    formats_to_test = [
        ("current_seconds", str(int(time.time()))),
        ("current_milliseconds", str(int(time.time() * 1000))),
        ("2024_seconds", "1704067200"),  # Jan 1, 2024
        ("2024_milliseconds", "1704067200000"),  # Jan 1, 2024 in ms
        ("simple_format", "1640995200"),  # Jan 1, 2022
        ("iso_format", "2024-01-01T00:00:00Z"),
    ]
    
    for format_name, timestamp in formats_to_test:
        print(f"\n🔍 Testing {format_name}: {timestamp}")
        
        headers = {
            "Content-Type": "application/json",
            "X-Date": timestamp,
            "Authorization": "HMAC-SHA256 Credential=poc-access-key,Signature=dummy"
        }
        
        try:
            response = requests.post(f"{base_url}/metadata", headers=headers, json={})
            print(f"   Status: {response.status_code}")
            error_msg = response.json().get('message', '') if response.status_code != 200 else 'Success!'
            print(f"   Message: {error_msg}")
            
            if "not in unix epoch time format" not in error_msg:
                print(f"   ✅ Timestamp format accepted! ({format_name})")
                return format_name, timestamp
                
        except Exception as e:
            print(f"   ❌ Exception: {e}")
    
    print("\n❌ No timestamp format worked")
    return None, None

if __name__ == "__main__":
    print("🧪 Testing different timestamp formats...")
    result = test_timestamp_formats()
    if result[0]:
        print(f"\n🎉 Found working format: {result[0]} = {result[1]}")
    else:
        print("\n💥 All timestamp formats failed")