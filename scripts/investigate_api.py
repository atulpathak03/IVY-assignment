import os
import sys
import json
import urllib.request
import urllib.parse
import urllib.error
from dotenv import load_dotenv

load_dotenv(dotenv_path='.env.local')

BASE_URL = os.getenv('API_BASE_URL', 'https://solve.ivy.homes').rstrip('/')
API_KEY = os.getenv('API_KEY', '')
LOGIN_EMAIL = os.getenv('LOGIN_EMAIL', 'demo1@ivy.homes')
LOGIN_PASSWORD = os.getenv('LOGIN_PASSWORD', '')

print(f"=== FULL API INVESTIGATION (Authenticated) ===")

def request_api(path, method='GET', body=None, token=None, params=None):
    url = f"{BASE_URL}{path}"
    if params:
        query = urllib.parse.urlencode(params)
        url += f"?{query}"
    
    headers = {'X-API-Key': API_KEY}
    if token:
        headers['Authorization'] = f"Bearer {token}"
    
    data_bytes = None
    if body is not None:
        data_bytes = json.dumps(body).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    
    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode('utf-8')
            try:
                return resp.status, json.loads(raw), resp.headers
            except Exception:
                return resp.status, raw, resp.headers
    except urllib.error.HTTPError as e:
        raw = e.read().decode('utf-8')
        try:
            return e.code, json.loads(raw), e.headers
        except Exception:
            return e.code, raw, e.headers
    except Exception as e:
        return 0, str(e), {}

# 1. Login
st, login_data, _ = request_api('/auth/login', method='POST', body={"email": LOGIN_EMAIL, "password": LOGIN_PASSWORD})
print(f"1. Login Status: {st}")
token = login_data.get('access_token') if isinstance(login_data, dict) else None
print(f"Token acquired: {token[:20]}..." if token else "NO TOKEN")

# 2. Test Listings
print("\n--- 2. GET /v1/listings ---")
st, listings_data, _ = request_api('/v1/listings', token=token, params={"page": 1, "limit": 5})
print(f"Status: {st}")
if st == 200:
    print(f"Total: {listings_data.get('total')}, Page: {listings_data.get('page')}, PageSize: {listings_data.get('page_size')}")
    results = listings_data.get('results', [])
    print(f"Results len: {len(results)}")
    if results:
        print("Sample Listing Object:")
        print(json.dumps(results[0], indent=2))

# 3. Test Listings Filters
print("\n--- 3. Testing Filters on /v1/listings ---")
# Filter by locality
st_f1, d_f1, _ = request_api('/v1/listings', token=token, params={"locality": "guindy", "limit": 10})
print(f"Filter locality=guindy: total in response={d_f1.get('total') if isinstance(d_f1, dict) else d_f1}")
if isinstance(d_f1, dict) and d_f1.get('results'):
    localities = set(r.get('locality') for r in d_f1['results'])
    print(f"  Actual localities in returned items: {localities}")

# Filter by bhk
st_f2, d_f2, _ = request_api('/v1/listings', token=token, params={"bhk": 2, "limit": 10})
print(f"Filter bhk=2: total in response={d_f2.get('total') if isinstance(d_f2, dict) else d_f2}")
if isinstance(d_f2, dict) and d_f2.get('results'):
    bhks = set(r.get('bedroom') for r in d_f2['results'])
    print(f"  Actual bedrooms in returned items: {bhks}")

# Filter by min_price & max_price
st_f3, d_f3, _ = request_api('/v1/listings', token=token, params={"min_price": 5000000, "max_price": 10000000, "limit": 10})
print(f"Filter min_price=5000000 & max_price=10000000: total in response={d_f3.get('total') if isinstance(d_f3, dict) else d_f3}")
if isinstance(d_f3, dict) and d_f3.get('results'):
    prices = [r.get('price') for r in d_f3['results']]
    print(f"  Actual prices returned: {prices[:5]}")

# Filter by furnishing
st_f4, d_f4, _ = request_api('/v1/listings', token=token, params={"furnishing": "semi-furnished", "limit": 10})
print(f"Filter furnishing=semi-furnished: total in response={d_f4.get('total') if isinstance(d_f4, dict) else d_f4}")

# Sorting sort_by & order
st_s1, d_s1, _ = request_api('/v1/listings', token=token, params={"sort_by": "price", "order": "desc", "limit": 5})
print(f"Sort sort_by=price&order=desc: total={d_s1.get('total') if isinstance(d_s1, dict) else d_s1}")
if isinstance(d_s1, dict) and d_s1.get('results'):
    prices = [r.get('price') for r in d_s1['results']]
    print(f"  Prices returned: {prices}")

# 4. Test Single Listing Routes
sample_lid = listings_data['results'][0]['listing_id'] if isinstance(listings_data, dict) and listings_data.get('results') else '100-1000042'
print(f"\n--- 4. Single Listing Routes for ID {sample_lid} ---")
st_sing, d_sing, _ = request_api(f"/v1/listing/{sample_lid}", token=token)
print(f"GET /v1/listing/{sample_lid} (singular): status {st_sing}, res: {d_sing if st_sing!=200 else 'OK'}")

st_plur, d_plur, _ = request_api(f"/v1/listings/{sample_lid}", token=token)
print(f"GET /v1/listings/{sample_lid} (plural): status {st_plur}")
if st_plur == 200:
    print("  Plural route /v1/listings/{id} works!")

st_sim, d_sim, _ = request_api(f"/v1/listings/{sample_lid}/similar", token=token)
print(f"GET /v1/listings/{sample_lid}/similar: status {st_sim}, res: {d_sim if st_sim!=200 else len(d_sim) if isinstance(d_sim, list) else d_sim}")

# 5. Test Rentals
print("\n--- 5. GET /v1/rentals ---")
st_rent, d_rent, _ = request_api('/v1/rentals', token=token, params={"page": 1, "limit": 5})
print(f"GET /v1/rentals Status: {st_rent}")
if st_rent == 200 and isinstance(d_rent, dict):
    print(f"Total: {d_rent.get('total')}, Page: {d_rent.get('page')}, PageSize: {d_rent.get('page_size')}")
    results = d_rent.get('results', [])
    print(f"Results len: {len(results)}")
    if results:
        print("Sample Rental Object:")
        print(json.dumps(results[0], indent=2))

# 6. Test Projects
print("\n--- 6. GET /v1/projects ---")
st_proj, d_proj, _ = request_api('/v1/projects', token=token, params={"page": 1, "limit": 5})
print(f"GET /v1/projects Status: {st_proj}")
if st_proj == 200 and isinstance(d_proj, dict):
    print(f"Total: {d_proj.get('total')}, Page: {d_proj.get('page')}, PageSize: {d_proj.get('page_size')}")
    results = d_proj.get('results', [])
    print(f"Results len: {len(results)}")
    if results:
        print("Sample Project Object:")
        print(json.dumps(results[0], indent=2))

# 7. Probe All Favourites variations
print("\n--- 7. Probing Favourites Endpoint Paths ---")
for path in ["/v1/favourites", "/v1/favorites", "/favourites", "/favorites", "/v1/user/favourites", "/v1/user/favorites"]:
    st_f, d_f, _ = request_api(path, token=token)
    print(f"GET {path}: status {st_f}, res: {d_f}")
    if st_f == 200:
        print(f"  FOUND FAVOURITES ENDPOINT AT {path}!")

# 8. Probe All Analytics variations
print("\n--- 8. Probing Analytics Endpoint Paths ---")
for path in ["/v1/analytics/summary", "/v1/analytics", "/analytics/summary", "/analytics", "/v1/summary"]:
    st_a, d_a, _ = request_api(path, token=token)
    print(f"GET {path}: status {st_a}, res: {d_a}")
    if st_a == 200:
        print(f"  FOUND ANALYTICS ENDPOINT AT {path}!")

