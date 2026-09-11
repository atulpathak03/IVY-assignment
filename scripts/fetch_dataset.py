import os
import sys
import json
import time
import urllib.request
import urllib.parse
import urllib.error
from dotenv import load_dotenv

load_dotenv(dotenv_path='.env.local')

BASE_URL = os.getenv('API_BASE_URL', 'https://solve.ivy.homes').rstrip('/')
API_KEY = os.getenv('API_KEY', '')
LOGIN_EMAIL = os.getenv('LOGIN_EMAIL', 'demo1@ivy.homes')
LOGIN_PASSWORD = os.getenv('LOGIN_PASSWORD', '')

os.makedirs('data', exist_ok=True)

def get_token():
    url = f"{BASE_URL}/auth/login"
    body = json.dumps({"email": LOGIN_EMAIL, "password": LOGIN_PASSWORD}).encode('utf-8')
    headers = {'Content-Type': 'application/json', 'X-API-Key': API_KEY}
    req = urllib.request.Request(url, data=body, headers=headers, method='POST')
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        return data['access_token']

token = get_token()
print("Token acquired successfully!")

def fetch_all(endpoint_name, path):
    global token
    print(f"\n--- Fetching complete dataset for {endpoint_name} ({path}) ---")
    all_records = []
    offset = 0
    limit = 50
    total = None
    
    while True:
        url = f"{BASE_URL}{path}?offset={offset}&limit={limit}"
        headers = {'X-API-Key': API_KEY, 'Authorization': f'Bearer {token}'}
        req = urllib.request.Request(url, headers=headers)
        
        try:
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                results = data.get('results', [])
                total = data.get('total')
                has_more = data.get('has_more', False)
                all_records.extend(results)
                print(f"Offset {offset:4d}: fetched {len(results)} items (Total accumulated: {len(all_records)} / {total})", flush=True)
                
                if not has_more or len(results) == 0:
                    break
                offset += len(results)
        except urllib.error.HTTPError as e:
            if e.code == 401:
                print("Token expired! Re-authenticating...")
                token = get_token()
                continue
            else:
                print(f"HTTPError {e.code}: {e.read().decode()}")
                break
        
        # Fast fetching within rate limit
        
    out_file = f"data/{endpoint_name}.json"
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(all_records, f, indent=2)
    print(f"Saved {len(all_records)} records to {out_file}")
    return all_records

listings = fetch_all('listings', '/v1/listings')
rentals = fetch_all('rentals', '/v1/rentals')
projects = fetch_all('projects', '/v1/projects')

print("\n=== DATASET DOWNLOAD COMPLETE ===")
print(f"Total Listings: {len(listings)}")
print(f"Total Rentals:  {len(rentals)}")
print(f"Total Projects: {len(projects)}")
